package com.marvelist.backend.services;

import com.marvelist.backend.dto.CommentDtos.CommentRequest;
import com.marvelist.backend.dto.CommentDtos.CommentResponse;
import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.CommentImage;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Role;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.CommentRepository;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CommentService {

    static final int MAX_TEXT = 1500;
    static final int MAX_IMAGE_BYTES = 600 * 1024;
    static final int MAX_PER_MINUTE = 6;
    private static final int PAGE_SIZE = 200;

    private static final Pattern DATA_URL = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$");
    private static final Pattern GIPHY_URL = Pattern.compile("^https://(?:media\\d*|i)\\.giphy\\.com/[^\\s\"'<>]+$");

    private final CommentRepository commentRepository;
    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> list(String userEmail, Long mediaId, Integer episode) {
        User user = findUser(userEmail);
        PageRequest page = PageRequest.of(0, PAGE_SIZE);
        List<Comment> comments = episode == null
                ? commentRepository.findByMediaIdAndEpisodeNumberIsNullOrderByCreatedAtDesc(mediaId, page)
                : commentRepository.findByMediaIdAndEpisodeNumberOrderByCreatedAtDesc(mediaId, episode, page);
        return comments.stream().map(c -> toResponse(c, user)).toList();
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

        String text = request.text() == null ? "" : request.text().strip();
        if (text.length() > MAX_TEXT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il commento può avere al massimo " + MAX_TEXT + " caratteri");
        }
        String gifUrl = request.gifUrl() == null || request.gifUrl().isBlank() ? null : request.gifUrl().strip();
        if (gifUrl != null && (gifUrl.length() > 600 || !GIPHY_URL.matcher(gifUrl).matches())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GIF non valida");
        }
        CommentImage image = request.image() == null || request.image().isBlank() ? null : decodeImage(request.image());

        if (gifUrl != null && image != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Puoi allegare un'immagine oppure una GIF, non entrambe");
        }
        if (text.isEmpty() && gifUrl == null && image == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scrivi qualcosa o allega un'immagine o una GIF");
        }
        if (commentRepository.countByUserAndCreatedAtAfter(user, Instant.now().minus(Duration.ofMinutes(1))) >= MAX_PER_MINUTE) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Stai commentando troppo velocemente: riprova tra qualche secondo");
        }

        Comment comment = commentRepository.save(Comment.builder()
                .user(user)
                .media(media)
                .episodeNumber(episode)
                .text(text.isEmpty() ? null : text)
                .gifUrl(gifUrl)
                .image(image)
                .spoiler(request.spoiler())
                .createdAt(Instant.now())
                .build());
        return toResponse(comment, user);
    }

    @Transactional
    public void delete(String userEmail, Long commentId) {
        User user = findUser(userEmail);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commento non trovato"));
        if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Puoi cancellare solo i tuoi commenti");
        }
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public CommentImage getImage(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Immagine non trovata"));
        CommentImage image = comment.getImage();
        if (image == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Immagine non trovata");
        image.getData();
        return image;
    }

    static CommentImage decodeImage(String dataUrl) {
        Matcher m = DATA_URL.matcher(dataUrl.strip());
        if (!m.matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato immagine non supportato: usa JPG, PNG o WebP");
        }
        byte[] data;
        try {
            data = Base64.getDecoder().decode(m.group(2));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Immagine non valida");
        }
        if (data.length > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'immagine è troppo pesante (massimo 600 KB)");
        }
        if (!matchesSignature(m.group(1), data)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Immagine non valida");
        }
        return CommentImage.builder().contentType(m.group(1)).data(data).build();
    }

    private static boolean matchesSignature(String type, byte[] d) {
        return switch (type) {
            case "image/jpeg" -> d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8;
            case "image/png" -> d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G';
            case "image/webp" -> d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                    && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P';
            default -> false;
        };
    }

    private CommentResponse toResponse(Comment c, User viewer) {
        User author = c.getUser();
        String name = author.getNickname() != null && !author.getNickname().isBlank() ? author.getNickname() : author.getName();
        return new CommentResponse(
                c.getId(),
                c.getEpisodeNumber(),
                name,
                author.getAvatarUrl(),
                c.getText(),
                c.getGifUrl(),
                c.getImage() != null ? "/comments/" + c.getId() + "/image" : null,
                c.isSpoiler(),
                c.getCreatedAt(),
                author.getId().equals(viewer.getId())
        );
    }

    private User findUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
