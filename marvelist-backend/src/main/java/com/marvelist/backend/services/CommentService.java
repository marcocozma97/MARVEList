package com.marvelist.backend.services;

import com.marvelist.backend.dto.CommentDtos.CommentRequest;
import com.marvelist.backend.dto.CommentDtos.CommentResponse;
import com.marvelist.backend.dto.CommentDtos.LikeResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CommentService {

    static final int MAX_TEXT = 1500;
    static final int MAX_PER_MINUTE = 6;
    private static final int PAGE_SIZE = 200;

    private static final Pattern GIF_URL = Pattern.compile("^https://static\\.klipy\\.com/[^\\s\"'<>]+$");

    private final CommentRepository commentRepository;
    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository likeRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<CommentResponse> list(String userEmail, Long mediaId, Integer episode) {
        User user = findUser(userEmail);
        PageRequest page = PageRequest.of(0, PAGE_SIZE);
        List<Comment> roots = episode == null
                ? commentRepository.findByMediaIdAndEpisodeNumberIsNullAndParentIsNullOrderByCreatedAtDesc(mediaId, page)
                : commentRepository.findByMediaIdAndEpisodeNumberAndParentIsNullOrderByCreatedAtDesc(mediaId, episode, page);
        if (roots.isEmpty()) return List.of();

        List<Long> rootIds = roots.stream().map(Comment::getId).toList();
        Map<Long, List<Comment>> repliesByRoot = commentRepository.findByParentIdInOrderByCreatedAtAsc(rootIds).stream()
                .collect(Collectors.groupingBy(c -> c.getParent().getId(), LinkedHashMap::new, Collectors.toList()));

        List<Long> allIds = Stream.concat(rootIds.stream(),
                repliesByRoot.values().stream().flatMap(List::stream).map(Comment::getId)).toList();
        Map<Long, Long> likes = new HashMap<>();
        likeRepository.countByCommentIds(allIds).forEach(row -> likes.put((Long) row[0], (Long) row[1]));
        Set<Long> liked = new HashSet<>(likeRepository.likedAmong(user, allIds));

        return roots.stream().map(root -> toResponse(root, user, likes, liked,
                repliesByRoot.getOrDefault(root.getId(), List.of()).stream()
                        .map(reply -> toResponse(reply, user, likes, liked, List.of()))
                        .toList()))
                .toList();
    }

    public long count(Long mediaId, Integer episode) {
        return episode == null
                ? commentRepository.countByMediaIdAndEpisodeNumberIsNull(mediaId)
                : commentRepository.countByMediaIdAndEpisodeNumber(mediaId, episode);
    }

    @Transactional
    public CommentResponse create(String userEmail, Long mediaId, CommentRequest request) {
        User user = findUser(userEmail);
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media non trovato"));

        Integer episode = request.episode();
        if (episode != null && (!"SERIE_TV".equals(media.getType()) || episode < 1
                || (media.getEpisodes() != null && episode > media.getEpisodes()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episodio non valido");
        }

        Comment parent = null;
        Comment repliedTo = null;
        if (request.parentId() != null) {
            repliedTo = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Il commento a cui rispondi non esiste più"));
            parent = repliedTo.getParent() != null ? repliedTo.getParent() : repliedTo;
            if (!parent.getMedia().getId().equals(mediaId) || !Objects.equals(parent.getEpisodeNumber(), episode)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Risposta non valida");
            }
        }

        String text = request.text() == null ? "" : request.text().strip();
        if (text.length() > MAX_TEXT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il commento può avere al massimo " + MAX_TEXT + " caratteri");
        }
        String gifUrl = request.gifUrl() == null || request.gifUrl().isBlank() ? null : request.gifUrl().strip();
        if (gifUrl != null && (gifUrl.length() > 600 || !GIF_URL.matcher(gifUrl).matches())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GIF non valida");
        }
        if (text.isEmpty() && gifUrl == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scrivi qualcosa o allega una GIF");
        }
        if (commentRepository.countByUserAndCreatedAtAfter(user, Instant.now().minus(Duration.ofMinutes(1))) >= MAX_PER_MINUTE) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Stai commentando troppo velocemente: riprova tra qualche secondo");
        }

        Comment comment = commentRepository.save(Comment.builder()
                .user(user)
                .media(media)
                .episodeNumber(episode)
                .parent(parent)
                .text(text.isEmpty() ? null : text)
                .gifUrl(gifUrl)
                .spoiler(request.spoiler())
                .createdAt(Instant.now())
                .build());
        if (repliedTo != null) {
            notificationService.notify(repliedTo.getUser(), user, NotificationType.REPLY, comment);
            if (!parent.getUser().getId().equals(repliedTo.getUser().getId())) {
                notificationService.notify(parent.getUser(), user, NotificationType.REPLY, comment);
            }
        }
        return toResponse(comment, user, Map.of(), Set.of(), List.of());
    }

    @Transactional
    public LikeResponse toggleLike(String userEmail, Long commentId) {
        User user = findUser(userEmail);
        Comment comment = findComment(commentId);
        Optional<CommentLike> existing = likeRepository.findByUserAndComment(user, comment);
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            notificationRepository.deleteByActorAndTypeAndComment(user, NotificationType.LIKE, comment);
        } else {
            likeRepository.save(CommentLike.builder().user(user).comment(comment).createdAt(Instant.now()).build());
            notificationService.notify(comment.getUser(), user, NotificationType.LIKE, comment);
        }
        return new LikeResponse(likeRepository.countByComment(comment), existing.isEmpty());
    }

    @Transactional
    public void delete(String userEmail, Long commentId) {
        User user = findUser(userEmail);
        Comment comment = findComment(commentId);
        if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Puoi cancellare solo i tuoi commenti");
        }
        List<Comment> replies = commentRepository.findByParent(comment);
        List<Long> ids = Stream.concat(Stream.of(comment), replies.stream()).map(Comment::getId).toList();
        notificationRepository.deleteByCommentIds(ids);
        likeRepository.deleteByCommentIds(ids);
        commentRepository.deleteAll(replies);
        commentRepository.delete(comment);
    }

    private CommentResponse toResponse(Comment c, User viewer, Map<Long, Long> likes, Set<Long> liked, List<CommentResponse> replies) {
        User author = c.getUser();
        return new CommentResponse(
                c.getId(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.getEpisodeNumber(),
                author.getId(),
                author.displayName(),
                author.getAvatarUrl(),
                c.getText(),
                c.getGifUrl(),
                c.isSpoiler(),
                c.getCreatedAt(),
                author.getId().equals(viewer.getId()),
                likes.getOrDefault(c.getId(), 0L),
                liked.contains(c.getId()),
                replies
        );
    }

    private Comment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commento non trovato"));
    }

    private User findUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
