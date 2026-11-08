package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.SocialDtos.FollowState;
import com.marvelist.backend.dto.SocialDtos.NotificationResponse;
import com.marvelist.backend.dto.SocialDtos.PublicProfile;
import com.marvelist.backend.dto.SocialDtos.UnreadCount;
import com.marvelist.backend.dto.SocialDtos.UserCard;
import com.marvelist.backend.services.NotificationService;
import com.marvelist.backend.services.SocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;
    private final NotificationService notificationService;

    @GetMapping("/users/search")
    public ResponseEntity<List<UserCard>> search(@RequestParam(defaultValue = "") String q, Authentication auth) {
        return ResponseEntity.ok(socialService.search(auth.getName(), q));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<PublicProfile> profile(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(socialService.profile(auth.getName(), id));
    }

    @GetMapping("/users/{id}/followers")
    public ResponseEntity<List<UserCard>> followers(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(socialService.followers(auth.getName(), id));
    }

    @GetMapping("/users/{id}/following")
    public ResponseEntity<List<UserCard>> following(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(socialService.following(auth.getName(), id));
    }

    @PostMapping("/users/{id}/follow")
    public ResponseEntity<FollowState> follow(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(socialService.follow(auth.getName(), id));
    }

    @DeleteMapping("/users/{id}/follow")
    public ResponseEntity<FollowState> unfollow(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(socialService.unfollow(auth.getName(), id));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> notifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.list(auth.getName()));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<UnreadCount> unreadCount(Authentication auth) {
        return ResponseEntity.ok(new UnreadCount(notificationService.unreadCount(auth.getName())));
    }

    @PostMapping("/notifications/read")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
