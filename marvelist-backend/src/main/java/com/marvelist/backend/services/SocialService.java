package com.marvelist.backend.services;

import com.marvelist.backend.dto.SocialDtos.FollowState;
import com.marvelist.backend.dto.SocialDtos.PublicProfile;
import com.marvelist.backend.dto.SocialDtos.UserCard;
import com.marvelist.backend.entities.Follow;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.FollowRepository;
import com.marvelist.backend.repositories.NotificationRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SocialService {

    private static final int LIST_SIZE = 200;
    private static final int SEARCH_SIZE = 20;

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final MarathonService marathonService;

    @Transactional(readOnly = true)
    public PublicProfile profile(String viewerEmail, Long userId) {
        User viewer = findUser(viewerEmail);
        User owner = findById(userId);
        List<Long> favorites = owner.getFavoriteMedia().stream().map(Media::getId).sorted().toList();
        return new PublicProfile(
                owner.getId(),
                owner.displayName(),
                owner.getAvatarUrl(),
                followRepository.countByFollowed(owner),
                followRepository.countByFollower(owner),
                followRepository.existsByFollowerAndFollowed(viewer, owner),
                viewer.getId().equals(owner.getId()),
                favorites,
                marathonService.publicLists(owner)
        );
    }

    @Transactional
    public FollowState follow(String viewerEmail, Long userId) {
        User viewer = findUser(viewerEmail);
        User target = findById(userId);
        if (viewer.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Non puoi seguire te stesso");
        }
        if (!followRepository.existsByFollowerAndFollowed(viewer, target)) {
            followRepository.save(Follow.builder().follower(viewer).followed(target).createdAt(Instant.now()).build());
            notificationService.notify(target, viewer, NotificationType.FOLLOW, null);
        }
        return new FollowState(true, followRepository.countByFollowed(target));
    }

    @Transactional
    public FollowState unfollow(String viewerEmail, Long userId) {
        User viewer = findUser(viewerEmail);
        User target = findById(userId);
        followRepository.findByFollowerAndFollowed(viewer, target).ifPresent(f -> {
            followRepository.delete(f);
            notificationRepository.deleteByActorAndRecipientAndType(viewer, target, NotificationType.FOLLOW);
        });
        return new FollowState(false, followRepository.countByFollowed(target));
    }

    @Transactional(readOnly = true)
    public List<UserCard> followers(String viewerEmail, Long userId) {
        User viewer = findUser(viewerEmail);
        List<User> users = followRepository.findByFollowedOrderByCreatedAtDesc(findById(userId), PageRequest.of(0, LIST_SIZE))
                .stream().map(Follow::getFollower).toList();
        return toCards(viewer, users);
    }

    @Transactional(readOnly = true)
    public List<UserCard> following(String viewerEmail, Long userId) {
        User viewer = findUser(viewerEmail);
        List<User> users = followRepository.findByFollowerOrderByCreatedAtDesc(findById(userId), PageRequest.of(0, LIST_SIZE))
                .stream().map(Follow::getFollowed).toList();
        return toCards(viewer, users);
    }

    @Transactional(readOnly = true)
    public List<UserCard> search(String viewerEmail, String query) {
        User viewer = findUser(viewerEmail);
        String q = query == null ? "" : query.strip();
        if (q.length() < 2) return List.of();
        if (q.length() > 30) q = q.substring(0, 30);
        return toCards(viewer, userRepository.searchByDisplayName(q, viewer.getId(), PageRequest.of(0, SEARCH_SIZE)));
    }

    private List<UserCard> toCards(User viewer, List<User> users) {
        if (users.isEmpty()) return List.of();
        Set<Long> followed = new HashSet<>(followRepository.followedAmong(viewer, users.stream().map(User::getId).toList()));
        return users.stream()
                .map(u -> new UserCard(u.getId(), u.displayName(), u.getAvatarUrl(), followed.contains(u.getId()), u.getId().equals(viewer.getId())))
                .toList();
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .filter(User::isEnabled)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
