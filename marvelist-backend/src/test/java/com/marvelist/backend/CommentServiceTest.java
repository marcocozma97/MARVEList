package com.marvelist.backend;

import com.marvelist.backend.dto.CommentDtos.CommentRequest;
import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.CommentRepository;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CommentServiceTest {

    private static final String PNG = "data:image/png;base64," + Base64.getEncoder().encodeToString(
            new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0});
    private static final String GIF = "https://media2.giphy.com/media/v1.abc/giphy.gif?cid=123&ct=g";

    private CommentRepository comments;
    private CommentService service;
    private User tony;
    private User peter;
    private Media loki;

    @BeforeEach
    void setUp() {
        comments = mock(CommentRepository.class);
        MediaRepository mediaRepository = mock(MediaRepository.class);
        UserRepository users = mock(UserRepository.class);
        service = new CommentService(comments, mediaRepository, users);

        tony = User.builder().id(1L).name("Tony").nickname("IronMan").email("tony@stark.it").role(Role.USER).build();
        peter = User.builder().id(2L).name("Peter").email("peter@parker.it").role(Role.USER).build();
        loki = Media.builder().id(10L).title("Loki Season 1").type("SERIE_TV").episodes(6).build();

        when(users.findByEmail("tony@stark.it")).thenReturn(Optional.of(tony));
        when(users.findByEmail("peter@parker.it")).thenReturn(Optional.of(peter));
        when(mediaRepository.findById(10L)).thenReturn(Optional.of(loki));
        when(comments.save(any())).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(99L);
            return c;
        });
    }

    private HttpStatus status(Runnable action) {
        return (HttpStatus) assertThrows(ResponseStatusException.class, action::run).getStatusCode();
    }

    @Test
    void unCommentoConTestoEImmagineVieneSalvato() {
        var response = service.create("tony@stark.it", 10L, new CommentRequest("  Che finale!  ", 6, true, null, PNG));

        assertEquals("Che finale!", response.text());
        assertEquals("IronMan", response.authorName());
        assertEquals("/comments/99/image", response.imageUrl());
        assertTrue(response.spoiler());
        assertTrue(response.mine());
        assertEquals(6, response.episode());
    }

    @Test
    void unCommentoVuotoVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("   ", null, false, null, null))));
        verify(comments, never()).save(any());
    }

    @Test
    void immagineEGifInsiemeNonSonoAmmesse() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest(null, null, false, GIF, PNG))));
    }

    @Test
    void soloLeGifDiGiphySonoAccettate() {
        assertNotNull(service.create("tony@stark.it", 10L, new CommentRequest(null, null, false, GIF, null)).gifUrl());
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L,
                new CommentRequest(null, null, false, "https://evil.example.com/x.gif", null))));
    }

    @Test
    void unImmagineCheNonCorrispondeAlFormatoDichiaratoVieneRifiutata() {
        String fake = "data:image/png;base64," + Base64.getEncoder().encodeToString("<script>".getBytes());
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest(null, null, false, null, fake))));
    }

    @Test
    void unEpisodioFuoriDallaStagioneVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("Ciao", 7, false, null, null))));
    }

    @Test
    void troppiCommentiInUnMinutoVengonoBloccati() {
        when(comments.countByUserAndCreatedAtAfter(any(), any())).thenReturn(6L);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("Ciao", null, false, null, null))));
    }

    @Test
    void soloLAutorePuoCancellareIlCommento() {
        Comment comment = Comment.builder().id(5L).user(tony).media(loki).build();
        when(comments.findById(5L)).thenReturn(Optional.of(comment));

        assertEquals(HttpStatus.FORBIDDEN, status(() -> service.delete("peter@parker.it", 5L)));
        service.delete("tony@stark.it", 5L);
        verify(comments).delete(comment);
    }
}
