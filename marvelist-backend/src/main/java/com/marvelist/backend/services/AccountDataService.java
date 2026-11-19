package com.marvelist.backend.services;

import com.marvelist.backend.dto.AccountBackup;
import com.marvelist.backend.dto.AccountBackup.CommentData;
import com.marvelist.backend.dto.AccountBackup.ImportResult;
import com.marvelist.backend.dto.AccountBackup.MarathonData;
import com.marvelist.backend.dto.AccountBackup.MarathonItemData;
import com.marvelist.backend.dto.AccountBackup.TitleData;
import com.marvelist.backend.dto.UserProfileRequest;
import com.marvelist.backend.entities.EpisodeRating;
import com.marvelist.backend.entities.Follow;
import com.marvelist.backend.entities.Marathon;
import com.marvelist.backend.entities.MarathonItem;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserProgress;
import com.marvelist.backend.repositories.CommentRepository;
import com.marvelist.backend.repositories.EpisodeRatingRepository;
import com.marvelist.backend.repositories.FollowRepository;
import com.marvelist.backend.repositories.MarathonRepository;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.NicknameClaimRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

// "Modifica profilo": salvataggio dei dati in JSON, importazione su un nuovo profilo ed eliminazione dell'account
@Service
@RequiredArgsConstructor
public class AccountDataService {

    private static final int MAX_TITLES = 2000;
    private static final int MAX_MARATHONS = 200;
    private static final int MAX_FOLLOWING = 1000;

    private final UserRepository userRepository;
    private final MediaRepository mediaRepository;
    private final UserProgressRepository progressRepository;
    private final EpisodeRatingRepository episodeRatingRepository;
    private final MarathonRepository marathonRepository;
    private final FollowRepository followRepository;
    private final NicknameClaimRepository claimRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;

    // --- ESPORTAZIONE ---

    @Transactional(readOnly = true)
    public AccountBackup export(String email) {
        User user = findUser(email);

        Map<Long, UserProgress> progress = progressRepository.findAllByUser(user).stream()
                .collect(Collectors.toMap(p -> p.getMedia().getId(), p -> p, (a, b) -> a));
        Map<Long, Map<Integer, Double>> episodeRatings = new HashMap<>();
        for (EpisodeRating r : episodeRatingRepository.findAllByUser(user)) {
            episodeRatings.computeIfAbsent(r.getMedia().getId(), k -> new TreeMap<>()).put(r.getEpisodeNumber(), r.getRating());
        }
        Set<Long> seen = ids(user.getSeenMedia());
        Set<Long> favorite = ids(user.getFavoriteMedia());
        Set<Long> later = ids(user.getWatchLaterMedia());

        Set<Long> touched = new LinkedHashSet<>();
        touched.addAll(seen);
        touched.addAll(favorite);
        touched.addAll(later);
        touched.addAll(progress.keySet());
        touched.addAll(episodeRatings.keySet());

        Map<Long, Media> mediaById = mediaRepository.findAllById(touched).stream()
                .collect(Collectors.toMap(Media::getId, m -> m));
        List<TitleData> titles = new ArrayList<>();
        for (Long id : touched) {
            Media media = mediaById.get(id);
            if (media == null) continue;
            UserProgress p = progress.get(id);
            List<Integer> episodes = p == null ? List.of() : p.getWatchedEpisodes().stream().sorted().toList();
            titles.add(new TitleData(media.getTitle(), media.getReleaseYear(), media.getType(),
                    seen.contains(id), favorite.contains(id), later.contains(id),
                    p == null ? null : p.getRating(),
                    p == null ? 0 : p.getMinutesWatched(),
                    episodes,
                    episodeRatings.getOrDefault(id, Map.of())));
        }

        List<MarathonData> marathons = marathonRepository.findAllByUserOrderByStartDateAscIdAsc(user).stream()
                .map(m -> new MarathonData(m.getName(), m.getBackground(), m.getVisionOrder(), m.getStartDate(), m.getEndDate(),
                        m.isHideSeen(), m.isMixedDays(), m.getMaxFilmsPerWeek(), m.getMaxEpisodesPerDay(),
                        m.getItems().stream().map(i -> new MarathonItemData(i.getMedia().getTitle(), i.getMedia().getReleaseYear(),
                                i.getPosition(), i.isDone(), i.getDoneDate(),
                                i.getDoneEpisodes().stream().sorted().toList(),
                                new TreeMap<>(i.getEpisodeDoneDates()))).toList()))
                .toList();

        List<String> following = followRepository.findByFollowerOrderByCreatedAtDesc(user, Pageable.unpaged()).stream()
                .map(f -> f.getFollowed().displayName())
                .toList();

        List<CommentData> comments = commentRepository.findByUserOrderByCreatedAtAsc(user).stream()
                .map(c -> new CommentData(c.getMedia().getTitle(), c.getMedia().getReleaseYear(), c.getEpisodeNumber(),
                        c.getText(), c.getGifUrl(), c.isSpoiler(), c.getCreatedAt(), c.getParent() != null))
                .toList();

        return new AccountBackup(AccountBackup.FORMAT, AccountBackup.VERSION, Instant.now(),
                new AccountBackup.Profile(user.getName(), user.getSurname(), user.displayName(), user.getAvatarUrl()),
                titles, marathons, following, comments);
    }

    // --- IMPORTAZIONE ---
    // Unisce i dati del file a quelli del profilo senza cancellare niente: visti, preferiti e "guarda dopo"
    // si aggiungono, i voti del file prendono il posto di quelli attuali, i progressi tengono il più avanti.

    @Transactional
    public ImportResult importBackup(String email, AccountBackup backup) {
        if (backup == null || !AccountBackup.FORMAT.equals(backup.format())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il file non è un salvataggio di MARVEList");
        }
        List<TitleData> titles = Objects.requireNonNullElse(backup.titles(), List.of());
        List<MarathonData> marathons = Objects.requireNonNullElse(backup.marathons(), List.of());
        List<String> following = Objects.requireNonNullElse(backup.following(), List.of());
        if (titles.size() > MAX_TITLES || marathons.size() > MAX_MARATHONS || following.size() > MAX_FOLLOWING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il file è troppo grande per essere un salvataggio di MARVEList");
        }

        User user = findUser(email);
        MediaLookup lookup = new MediaLookup(mediaRepository.findAll());
        Set<String> notFound = new LinkedHashSet<>();

        int importedTitles = 0;
        for (TitleData t : titles) {
            Media media = lookup.find(t.title(), t.year());
            if (media == null) {
                if (t.title() != null) notFound.add(t.title() + (t.year() != null ? " (" + t.year() + ")" : ""));
                continue;
            }
            importTitle(user, media, t);
            importedTitles++;
        }
        userRepository.save(user);

        int importedMarathons = 0;
        Set<String> existing = marathonRepository.findAllByUserOrderByStartDateAscIdAsc(user).stream()
                .map(m -> m.getName() + "|" + m.getStartDate()).collect(Collectors.toSet());
        for (MarathonData m : marathons) {
            if (m.name() == null || m.name().isBlank() || !existing.add(m.name() + "|" + m.startDate())) continue;
            // Stesse regole della creazione di una maratona: il file potrebbe essere stato modificato a mano
            if (m.startDate() == null || m.endDate() == null || m.endDate().isBefore(m.startDate())) continue;
            String name = m.name().strip();
            Marathon marathon = Marathon.builder().user(user)
                    .name(name.length() > 60 ? name.substring(0, 60) : name)
                    .background(validBackground(m.background()))
                    .visionOrder(MarathonService.VISION_ORDERS.contains(m.visionOrder()) ? m.visionOrder() : "MCU")
                    .startDate(m.startDate()).endDate(m.endDate())
                    .hideSeen(m.hideSeen()).mixedDays(m.mixedDays())
                    .maxFilmsPerWeek(Math.clamp(m.maxFilmsPerWeek(), 0, 50))
                    .maxEpisodesPerDay(Math.clamp(m.maxEpisodesPerDay(), 0, 50)).build();
            for (MarathonItemData i : Objects.requireNonNullElse(m.items(), List.<MarathonItemData>of())) {
                Media media = lookup.find(i.title(), i.year());
                if (media == null) continue;
                MarathonItem item = MarathonItem.builder().marathon(marathon).media(media).position(i.position())
                        .done(i.done()).doneDate(i.doneDate()).build();
                if (i.doneEpisodes() != null) item.getDoneEpisodes().addAll(i.doneEpisodes().stream().filter(Objects::nonNull).toList());
                if (i.episodeDoneDates() != null) {
                    i.episodeDoneDates().forEach((ep, day) -> { if (ep != null && day != null) item.getEpisodeDoneDates().put(ep, day); });
                }
                marathon.getItems().add(item);
            }
            if (marathon.getItems().isEmpty()) continue;
            marathonRepository.save(marathon);
            importedMarathons++;
        }

        int importedFollowing = 0;
        for (String nickname : following) {
            if (nickname == null || nickname.isBlank()) continue;
            User other = claimRepository.findByNicknameKey(UserService.nicknameKey(nickname)).map(c -> c.getUser()).orElse(null);
            if (other == null || other.getId().equals(user.getId()) || followRepository.existsByFollowerAndFollowed(user, other)) continue;
            followRepository.save(Follow.builder().follower(user).followed(other).createdAt(Instant.now()).build());
            importedFollowing++;
        }

        boolean nicknameRestored = restoreProfile(email, user, backup.profile());

        return new ImportResult(importedTitles, importedMarathons, importedFollowing, nicknameRestored, List.copyOf(notFound));
    }

    private void importTitle(User user, Media media, TitleData t) {
        if (t.favorite()) user.getFavoriteMedia().add(media);
        if (t.watchLater()) user.getWatchLaterMedia().add(media);

        UserProgress progress = progressRepository.findByUserAndMedia(user, media)
                .orElseGet(() -> UserProgress.builder().user(user).media(media).build());
        if (isValidRating(t.rating())) progress.setRating(t.rating());

        Integer total = media.getEpisodes();
        if (t.seen()) {
            user.getSeenMedia().add(media);
            if (media.getRuntime() != null) progress.setMinutesWatched(media.getRuntime());
            if (total != null) progress.getWatchedEpisodes().addAll(IntStream.rangeClosed(1, total).boxed().toList());
        } else {
            int minutes = Math.max(progress.getMinutesWatched() == null ? 0 : progress.getMinutesWatched(),
                    t.minutesWatched() == null ? 0 : Math.max(0, t.minutesWatched()));
            if (media.getRuntime() != null) minutes = Math.min(minutes, media.getRuntime());
            progress.setMinutesWatched(minutes);
            if (t.watchedEpisodes() != null) {
                progress.getWatchedEpisodes().addAll(t.watchedEpisodes().stream()
                        .filter(ep -> ep != null && ep >= 1 && (total == null || ep <= total)).toList());
            }
            boolean filmComplete = "FILM".equals(media.getType()) && media.getRuntime() != null && minutes >= media.getRuntime();
            boolean seriesComplete = total != null && progress.getWatchedEpisodes().size() >= total;
            if (filmComplete || seriesComplete) user.getSeenMedia().add(media);
        }
        progressRepository.save(progress);

        if (t.episodeRatings() != null && "SERIE_TV".equals(media.getType())) {
            Map<Integer, EpisodeRating> current = episodeRatingRepository.findAllByUserAndMedia(user, media).stream()
                    .collect(Collectors.toMap(EpisodeRating::getEpisodeNumber, r -> r, (a, b) -> a));
            t.episodeRatings().forEach((ep, rating) -> {
                if (ep == null || ep < 1 || (total != null && ep > total) || !isValidRating(rating)) return;
                EpisodeRating vote = current.getOrDefault(ep, EpisodeRating.builder().user(user).media(media).episodeNumber(ep).build());
                vote.setRating(rating);
                episodeRatingRepository.save(vote);
            });
        }
    }

    // Nickname e avatar del vecchio profilo: il nickname solo se non ne hai ancora scelto uno ed è libero
    private boolean restoreProfile(String email, User user, AccountBackup.Profile profile) {
        if (profile == null) return false;
        boolean restored = false;
        if (user.getNicknameChangedAt() == null && profile.nickname() != null && !profile.nickname().isBlank()) {
            try {
                if (userService.isNicknameAvailable(email, profile.nickname())) {
                    userService.updateProfile(email, new UserProfileRequest(profile.nickname(), null));
                    restored = true;
                }
            } catch (ResponseStatusException ignored) {
                // Nickname non valido o non più disponibile: resta quello attuale
            }
        }
        if (profile.avatar() != null && user.getAvatarUrl() == null) {
            try {
                userService.updateProfile(email, new UserProfileRequest(null, profile.avatar()));
            } catch (ResponseStatusException ignored) {
                // Avatar non più disponibile
            }
        }
        return restored;
    }

    private static String validBackground(String bg) {
        if (bg == null || bg.length() > MarathonService.MAX_BACKGROUND_LENGTH) return null;
        return bg.startsWith("data:image/") || bg.startsWith("/") || bg.startsWith("https://") ? bg : null;
    }

    private static boolean isValidRating(Double rating) {
        return rating != null && rating >= 0.5 && rating <= 10 && rating * 2 == Math.floor(rating * 2);
    }

    // Titolo + anno; se l'anno è cambiato nel catalogo basta il titolo, purché sia unico
    private static final class MediaLookup {
        private final Map<String, Media> byTitleAndYear = new HashMap<>();
        private final Map<String, List<Media>> byTitle = new HashMap<>();

        MediaLookup(List<Media> all) {
            for (Media m : all) {
                if (m.getTitle() == null) continue;
                String title = normalize(m.getTitle());
                // A parità di titolo e anno vince quello ancora in catalogo
                byTitleAndYear.merge(title + "|" + m.getReleaseYear(), m, (a, b) -> a.getSortOrder() != null ? a : b);
                byTitle.computeIfAbsent(title, k -> new ArrayList<>()).add(m);
            }
        }

        Media find(String title, Integer year) {
            if (title == null) return null;
            String key = normalize(title);
            Media exact = byTitleAndYear.get(key + "|" + year);
            if (exact != null) return exact;
            List<Media> sameTitle = byTitle.getOrDefault(key, Collections.emptyList());
            return sameTitle.size() == 1 ? sameTitle.get(0) : null;
        }

        private static String normalize(String title) {
            return title.strip().replaceAll("\\s+", " ").toLowerCase();
        }
    }

    // --- ELIMINAZIONE ---
    // Cancella l'utente e tutto ciò che lo riguarda: progressi, voti, maratone, follow, notifiche, commenti
    // (con le risposte ricevute, come quando si cancella un commento) e tutti i nickname usati, che tornano liberi.

    @Transactional
    public void deleteAccount(String email, String password) {
        User user = findUser(email);
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La password non è corretta");
        }
        if (UserService.isOfficial(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "L'account ufficiale di MARVEList non si può eliminare");
        }
        long id = user.getId();
        entityManager.flush();
        entityManager.clear();

        String ownComments = "select id from comments where user_id = ?";
        String touchedComments = "select id from comments where user_id = ? or parent_id in (" + ownComments + ")";

        delete("notifications", "delete from notifications where recipient_id = ? or actor_id = ? or comment_id in (" + touchedComments + ")", id, id, id, id);
        delete("comment_likes", "delete from comment_likes where user_id = ? or comment_id in (" + touchedComments + ")", id, id, id);
        delete("comments", "delete from comments where parent_id in (" + ownComments + ")", id);
        delete("comments", "delete from comments where user_id = ?", id);
        delete("episode_ratings", "delete from episode_ratings where user_id = ?", id);
        delete("watch_events", "delete from watch_events where user_id = ?", id);
        delete("user_progress_episodes", "delete from user_progress_episodes where progress_id in (select id from user_progress where user_id = ?)", id);
        delete("user_progress", "delete from user_progress where user_id = ?", id);
        String items = "select i.id from marathon_items i join marathons m on m.id = i.marathon_id where m.user_id = ?";
        delete("marathon_item_episode_dates", "delete from marathon_item_episode_dates where item_id in (" + items + ")", id);
        delete("marathon_item_episodes", "delete from marathon_item_episodes where item_id in (" + items + ")", id);
        delete("marathon_items", "delete from marathon_items where marathon_id in (select id from marathons where user_id = ?)", id);
        delete("marathons", "delete from marathons where user_id = ?", id);
        delete("follows", "delete from follows where follower_id = ? or followed_id = ?", id, id);
        delete("nickname_claims", "delete from nickname_claims where user_id = ?", id);
        delete("user_media", "delete from user_media where user_id = ?", id);
        for (String table : List.of("user_seen_media", "user_favorite_media", "user_watch_later_media", "user_watchlist_media")) {
            delete(table, "delete from " + table + " where user_id = ?", id);
        }
        delete("users", "delete from users where id = ?", id);
    }

    // Alcune tabelle (es. user_watchlist_media) esistono solo nei database più vecchi
    private void delete(String table, String sql, Object... args) {
        Boolean exists = jdbcTemplate.queryForObject("select to_regclass(?) is not null", Boolean.class, table);
        if (Boolean.TRUE.equals(exists)) jdbcTemplate.update(sql, args);
    }

    private static Set<Long> ids(Set<Media> media) {
        return media.stream().map(Media::getId).collect(Collectors.toCollection(HashSet::new));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }
}
