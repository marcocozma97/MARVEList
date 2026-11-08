package com.marvelist.backend.services;

import com.marvelist.backend.dto.SocialDtos.NotificationResponse;
import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Notification;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.NotificationRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static com.marvelist.backend.entities.NotificationType.*;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int PAGE_SIZE = 60;
    private static final int SNIPPET = 90;
    private static final int RECENT_DAYS = 14;
    private static final List<NotificationType> MEDIA_TYPES = List.of(NEW_MEDIA, RELEASE_30, RELEASE_7, RELEASE_1, RELEASED, EPISODE_OUT);
    private static final int EPISODE_DAYS = 3;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final MediaRepository mediaRepository;
    private final Set<Long> generating = ConcurrentHashMap.newKeySet();

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

    @Transactional
    public List<NotificationResponse> list(String email) {
        User user = findUser(email);
        generatePending(user);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, PageRequest.of(0, PAGE_SIZE))
                .stream().map(NotificationService::toResponse).toList();
    }

    @Transactional
    public long unreadCount(String email) {
        User user = findUser(email);
        generatePending(user);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Transactional
    public void markAllRead(String email) {
        notificationRepository.markAllRead(findUser(email));
    }

    void generatePending(User user) {
        if (!generating.add(user.getId())) return;
        try {
            nicknameReminder(user);
            mediaNotifications(user, EpisodeSchedule.today());
        } finally {
            generating.remove(user.getId());
        }
    }

    private void nicknameReminder(User user) {
        Instant changedAt = user.getNicknameChangedAt();
        if (changedAt == null || Boolean.TRUE.equals(user.getNicknameReminderSent())) return;
        if (Instant.now().isBefore(changedAt.plus(UserService.NICKNAME_COOLDOWN))) return;
        notificationRepository.save(system(user, NICKNAME, null, null));
        user.setNicknameReminderSent(true);
        userRepository.save(user);
    }

    private void mediaNotifications(User user, LocalDate today) {
        Instant addedSince = Instant.now().minus(Duration.ofDays(RECENT_DAYS));
        List<Media> candidates = mediaRepository.findNotificationCandidates(addedSince, today.minusDays(RECENT_DAYS), today.plusDays(30));
        List<Media> airing = mediaRepository.findSeriesAiringOn(today.toString(), today.minusDays(1).toString(),
                today.minusDays(2).toString(), today.minusDays(EPISODE_DAYS).toString());
        if (candidates.isEmpty() && airing.isEmpty()) return;

        Set<Long> ids = new HashSet<>();
        candidates.forEach(m -> ids.add(m.getId()));
        airing.forEach(m -> ids.add(m.getId()));
        Set<String> sent = new HashSet<>();
        notificationRepository.findMediaKeys(user, ids, MEDIA_TYPES)
                .forEach(row -> sent.add(row[0] + ":" + row[1] + ":" + row[2]));

        List<Notification> created = new ArrayList<>();
        for (Media media : candidates) {
            for (NotificationType type : dueFor(media, today, addedSince)) {
                if (sent.add(media.getId() + ":" + type + ":null")) created.add(system(user, type, media, null));
            }
        }
        for (Media media : airing) {
            for (Integer episode : episodesOut(media, today)) {
                if (sent.add(media.getId() + ":" + EPISODE_OUT + ":" + episode)) created.add(system(user, EPISODE_OUT, media, episode));
            }
        }
        if (!created.isEmpty()) notificationRepository.saveAll(created);
    }

    public static List<Integer> episodesOut(Media media, LocalDate today) {
        List<Integer> out = new ArrayList<>();
        if (!EpisodeSchedule.isOut(media, today)) return out;
        List<LocalDate> dates = EpisodeSchedule.dates(media);
        for (int i = 1; i < dates.size(); i++) {
            LocalDate date = dates.get(i);
            if (date != null && !date.isAfter(today) && !date.isBefore(today.minusDays(EPISODE_DAYS))) out.add(i + 1);
        }
        return out;
    }

    public static List<NotificationType> dueFor(Media media, LocalDate today, Instant addedSince) {
        List<NotificationType> due = new ArrayList<>();
        if (media.getAddedAt() != null && !media.getAddedAt().isBefore(addedSince)) due.add(NEW_MEDIA);

        boolean upcoming = Boolean.TRUE.equals(media.getUpcoming());
        LocalDate releaseDate = media.getReleaseDate();
        LocalDate releasedOn = media.getReleasedOn() != null ? media.getReleasedOn()
                : upcoming && releaseDate != null && !releaseDate.isAfter(today) ? releaseDate : null;

        if (releasedOn != null) {
            if (!releasedOn.isBefore(today.minusDays(RECENT_DAYS))) due.add(RELEASED);
        } else if (upcoming && releaseDate != null) {
            long days = ChronoUnit.DAYS.between(today, releaseDate);
            if (days == 1) due.add(RELEASE_1);
            else if (days > 1 && days <= 7) due.add(RELEASE_7);
            else if (days > 7 && days <= 30) due.add(RELEASE_30);
        }
        return due;
    }

    private static Notification system(User user, NotificationType type, Media media, Integer episode) {
        return Notification.builder()
                .recipient(user)
                .actor(user)
                .type(type)
                .media(media)
                .episodeNumber(episode)
                .createdAt(Instant.now())
                .build();
    }

    private static NotificationResponse toResponse(Notification n) {
        User actor = n.getActor();
        Comment comment = n.getComment();
        Media media = n.getMedia();
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                actor.getId(),
                actor.displayName(),
                actor.getAvatarUrl(),
                media != null ? media.getId() : null,
                media != null ? media.getTitle() : null,
                n.getEpisodeNumber(),
                comment != null ? comment.getId() : null,
                comment != null ? snippet(comment) : null,
                media != null ? media.getPosterPath() : null,
                media != null ? media.getReleaseDate() : null,
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
