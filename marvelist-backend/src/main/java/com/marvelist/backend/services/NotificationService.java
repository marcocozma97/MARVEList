package com.marvelist.backend.services;

import com.marvelist.backend.dto.SocialDtos.NotificationResponse;
import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.Notification;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.NotificationRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int PAGE_SIZE = 60;
    private static final int SNIPPET = 90;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notify(User recipient, User actor, NotificationType type, Comment comment) {
        if (recipient.getId().equals(actor.getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .comment(comment)
                .media(comment != null ? comment.getMedia() : null)
                .episodeNumber(comment != null ? comment.getEpisodeNumber() : null)
                .createdAt(Instant.now())
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String email) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(findUser(email), PageRequest.of(0, PAGE_SIZE))
                .stream().map(NotificationService::toResponse).toList();
    }

    public long unreadCount(String email) {
        return notificationRepository.countByRecipientAndReadFalse(findUser(email));
    }

    @Transactional
    public void markAllRead(String email) {
        notificationRepository.markAllRead(findUser(email));
    }

    private static NotificationResponse toResponse(Notification n) {
        User actor = n.getActor();
        Comment comment = n.getComment();
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                actor.getId(),
                actor.displayName(),
                actor.getAvatarUrl(),
                n.getMedia() != null ? n.getMedia().getId() : null,
                n.getMedia() != null ? n.getMedia().getTitle() : null,
                n.getEpisodeNumber(),
                comment != null ? comment.getId() : null,
                comment != null ? snippet(comment) : null,
                n.isRead(),
                n.getCreatedAt()
        );
    }

    private static String snippet(Comment comment) {
        if (comment.isSpoiler()) return "Contiene spoiler";
        String text = comment.getText();
        if (text == null || text.isBlank()) return comment.getGifUrl() != null ? "GIF" : null;
        return text.length() > SNIPPET ? text.substring(0, SNIPPET).strip() + "…" : text;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
