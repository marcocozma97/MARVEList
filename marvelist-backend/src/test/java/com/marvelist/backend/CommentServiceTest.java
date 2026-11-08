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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CommentServiceTest {

    private static final String GIF = "https://static.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/14/af/eUbp2uNc.webp";

    private CommentRepository comments;
    private CommentService service;
    private User tony;
    private Media loki;

    @BeforeEach
    void setUp() {
        comments = mock(CommentRepository.class);
        MediaRepository mediaRepository = mock(MediaRepository.class);
        UserRepository users = mock(UserRepository.class);
        service = new CommentService(comments, mediaRepository, users);

        tony = User.builder().id(1L).name("Tony").nickname("IronMan").email("tony@stark.it").role(Role.USER).build();
        User peter = User.builder().id(2L).name("Peter").email("peter@parker.it").role(Role.USER).build();
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
    void unCommentoConTestoEGifVieneSalvato() {
        var response = service.create("tony@stark.it", 10L, new CommentRequest("  Che finale!  ", 6, true, GIF));

        assertEquals("Che finale!", response.text());
        assertEquals("IronMan", response.authorName());
        assertEquals(GIF, response.gifUrl());
        assertTrue(response.spoiler());
        assertTrue(response.mine());
        assertEquals(6, response.episode());
    }

    @Test
    void unCommentoVuotoVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("   ", null, false, null))));
        verify(comments, never()).save(any());
    }

    @Test
    void soloLeGifDiKlipySonoAccettate() {
        assertNotNull(service.create("tony@stark.it", 10L, new CommentRequest(null, null, false, GIF)).gifUrl());
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L,
                new CommentRequest(null, null, false, "https://evil.example.com/x.gif"))));
    }

    @Test
    void unEpisodioFuoriDallaStagioneVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("Ciao", 7, false, null))));
    }

    @Test
    void troppiCommentiInUnMinutoVengonoBloccati() {
        when(comments.countByUserAndCreatedAtAfter(any(), any())).thenReturn(6L);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, status(() -> service.create("tony@stark.it", 10L, new CommentRequest("Ciao", null, false, null))));
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
