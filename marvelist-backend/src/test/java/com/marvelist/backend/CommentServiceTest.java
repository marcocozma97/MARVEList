package com.marvelist.backend;

import com.marvelist.backend.dto.CommentDtos.CommentRequest;
import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.CommentLike;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.CommentLikeRepository;
import com.marvelist.backend.repositories.CommentRepository;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.NotificationRepository;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.CommentService;
import com.marvelist.backend.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CommentServiceTest {

    private static final String GIF = "https://static.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/14/af/eUbp2uNc.webp";

    private CommentRepository comments;
    private CommentLikeRepository likes;
    private NotificationService notifications;
    private CommentService service;
    private User tony;
    private User peter;
    private Media loki;

    @BeforeEach
    void setUp() {
        comments = mock(CommentRepository.class);
        likes = mock(CommentLikeRepository.class);
        notifications = mock(NotificationService.class);
        MediaRepository mediaRepository = mock(MediaRepository.class);
        UserRepository users = mock(UserRepository.class);
        service = new CommentService(comments, mediaRepository, users, likes, mock(NotificationRepository.class), notifications);

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

    private CommentRequest request(String text, Integer episode, Long parentId) {
        return new CommentRequest(text, episode, false, null, parentId);
    }

    @Test
    void unCommentoConTestoEGifVieneSalvato() {
        var response = service.create("tony@stark.it", 10L, new CommentRequest("  Che finale!  ", 6, true, GIF, null));

        assertEquals("Che finale!", response.text());
        assertEquals("IronMan", response.authorName());
        assertEquals(1L, response.authorId());
        assertEquals(GIF, response.gifUrl());
        assertTrue(response.spoiler());
        assertTrue(response.mine());
        assertEquals(6, response.episode());
        assertEquals(0, response.likes());
    }

    @Test
    void unCommentoVuotoVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, request("   ", null, null))));
        verify(comments, never()).save(any());
    }

    @Test
    void soloLeGifDiKlipySonoAccettate() {
        assertNotNull(service.create("tony@stark.it", 10L, new CommentRequest(null, null, false, GIF, null)).gifUrl());
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L,
                new CommentRequest(null, null, false, "https://evil.example.com/x.gif", null))));
    }

    @Test
    void unEpisodioFuoriDallaStagioneVieneRifiutato() {
        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("tony@stark.it", 10L, request("Ciao", 7, null))));
    }

    @Test
    void troppiCommentiInUnMinutoVengonoBloccati() {
        when(comments.countByUserAndCreatedAtAfter(any(), any())).thenReturn(6L);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, status(() -> service.create("tony@stark.it", 10L, request("Ciao", null, null))));
    }

    @Test
    void soloLAutorePuoCancellareIlCommento() {
        Comment comment = Comment.builder().id(5L).user(tony).media(loki).build();
        when(comments.findById(5L)).thenReturn(Optional.of(comment));

        assertEquals(HttpStatus.FORBIDDEN, status(() -> service.delete("peter@parker.it", 5L)));
        service.delete("tony@stark.it", 5L);
        verify(comments).delete(comment);
    }

    @Test
    void unaRispostaVaSottoIlCommentoPrincipaleEAvvisaLAutore() {
        Comment root = Comment.builder().id(5L).user(tony).media(loki).episodeNumber(2).build();
        Comment reply = Comment.builder().id(6L).user(peter).media(loki).episodeNumber(2).parent(root).build();
        when(comments.findById(6L)).thenReturn(Optional.of(reply));

        var response = service.create("peter@parker.it", 10L, request("Concordo!", 2, 6L));

        assertEquals(5L, response.parentId());
        verify(notifications).notify(eq(peter), eq(peter), eq(NotificationType.REPLY), any());
        verify(notifications).notify(eq(tony), eq(peter), eq(NotificationType.REPLY), any());
    }

    @Test
    void unaRispostaDiUnAltroEpisodioVieneRifiutata() {
        Comment root = Comment.builder().id(5L).user(tony).media(loki).episodeNumber(2).build();
        when(comments.findById(5L)).thenReturn(Optional.of(root));

        assertEquals(HttpStatus.BAD_REQUEST, status(() -> service.create("peter@parker.it", 10L, request("Ciao", 3, 5L))));
    }

    @Test
    void ilLikeSiMetteESiToglieConLoStessoPulsante() {
        Comment comment = Comment.builder().id(5L).user(tony).media(loki).build();
        when(comments.findById(5L)).thenReturn(Optional.of(comment));
        when(likes.findByUserAndComment(peter, comment)).thenReturn(Optional.empty());
        when(likes.countByComment(comment)).thenReturn(1L);

        var liked = service.toggleLike("peter@parker.it", 5L);
        assertTrue(liked.liked());
        assertEquals(1, liked.likes());
        verify(notifications).notify(tony, peter, NotificationType.LIKE, comment);

        when(likes.findByUserAndComment(peter, comment)).thenReturn(Optional.of(CommentLike.builder().id(1L).build()));
        when(likes.countByComment(comment)).thenReturn(0L);
        assertFalse(service.toggleLike("peter@parker.it", 5L).liked());
    }
}
