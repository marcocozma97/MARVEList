package com.marvelist.backend.services;

import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.Notification;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserProgress;
import com.marvelist.backend.repositories.NotificationRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.marvelist.backend.entities.NotificationType.TOP_TEN;
import static com.marvelist.backend.entities.NotificationType.TOP_TEN_FEATURE;

@Service
@RequiredArgsConstructor
public class TopTenService {

    static final int SIZE = 10;
    private static final int MAX_SAVED = 200;

    public record Entry(Long mediaId, Double rating) {}

    public record Tie(Double rating, int slots, List<Long> mediaIds, boolean confirmed) {}

    public record TopTen(List<Entry> items, boolean needsConfirmation, List<Tie> ties) {}

    public record TopTenRequest(List<Long> order) {}

    private final UserRepository userRepository;
    private final UserProgressRepository progressRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public TopTen get(String email) {
        return compute(findUser(email));
    }

    @Transactional
    public TopTen confirm(String email, List<Long> order) {
        User user = findUser(email);
        Set<Long> rated = rated(user).stream().map(Entry::mediaId).collect(Collectors.toSet());
        List<Long> clean = Stream.concat(order == null ? Stream.empty() : order.stream(), parse(user.getTopTenOrder()).stream())
                .filter(Objects::nonNull)
                .filter(rated::contains)
                .distinct()
                .limit(MAX_SAVED)
                .toList();
        user.setTopTenOrder(clean.stream().map(String::valueOf).collect(Collectors.joining(",")));
        TopTen result = compute(user);
        if (!result.needsConfirmation()) user.setTopTenPending(false);
        userRepository.save(user);
        return result;
    }

    @Transactional
    public void ratingChanged(User user) {
        boolean needs = compute(user).needsConfirmation();
        boolean pending = Boolean.TRUE.equals(user.getTopTenPending());
        if (needs == pending) return;
        if (needs) notificationRepository.save(notice(user, TOP_TEN));
        user.setTopTenPending(needs);
        userRepository.save(user);
    }

    @Transactional
    public void announceTo(User user) {
        if (notificationRepository.existsByRecipientAndType(user, TOP_TEN_FEATURE)) return;
        notificationRepository.save(notice(user, TOP_TEN_FEATURE));
        if (!Boolean.TRUE.equals(user.getTopTenPending()) && compute(user).needsConfirmation()) {
            user.setTopTenPending(true);
            userRepository.save(user);
        }
    }

    TopTen compute(User user) {
        Map<Long, Integer> saved = new HashMap<>();
        for (Long id : parse(user.getTopTenOrder())) saved.putIfAbsent(id, saved.size());

        List<Entry> sorted = rated(user).stream()
                .sorted(Comparator.comparing(Entry::rating).reversed()
                        .thenComparing(e -> saved.getOrDefault(e.mediaId(), Integer.MAX_VALUE))
                        .thenComparing(Entry::mediaId))
                .toList();
        if (sorted.isEmpty()) return new TopTen(List.of(), false, List.of());

        double cutoff = sorted.get(Math.min(SIZE, sorted.size()) - 1).rating();
        Map<Double, List<Entry>> groups = sorted.stream()
                .filter(e -> e.rating() >= cutoff)
                .collect(Collectors.groupingBy(Entry::rating, LinkedHashMap::new, Collectors.toList()));

        List<Tie> ties = new ArrayList<>();
        int above = 0;
        for (Map.Entry<Double, List<Entry>> group : groups.entrySet()) {
            List<Entry> members = group.getValue();
            if (members.size() > 1) {
                ties.add(new Tie(group.getKey(), Math.min(members.size(), SIZE - above),
                        members.stream().map(Entry::mediaId).toList(),
                        members.stream().allMatch(e -> saved.containsKey(e.mediaId()))));
            }
            above += members.size();
        }
        return new TopTen(sorted.subList(0, Math.min(SIZE, sorted.size())), ties.stream().anyMatch(t -> !t.confirmed()), ties);
    }

    private List<Entry> rated(User user) {
        Set<Long> seen = user.getSeenMedia().stream().map(Media::getId).collect(Collectors.toSet());
        return progressRepository.findAllByUser(user).stream()
                .filter(p -> p.getRating() != null)
                .filter(p -> !"SERIE_TV".equals(p.getMedia().getType()) || seen.contains(p.getMedia().getId()))
                .map((UserProgress p) -> new Entry(p.getMedia().getId(), p.getRating()))
                .toList();
    }

    private static List<Long> parse(String order) {
        if (order == null || order.isBlank()) return List.of();
        List<Long> ids = new ArrayList<>();
        for (String part : order.split(",")) {
            try {
                ids.add(Long.parseLong(part.trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        return ids;
    }

    private static Notification notice(User user, NotificationType type) {
        return Notification.builder()
                .recipient(user)
                .actor(user)
                .type(type)
                .createdAt(Instant.now())
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
