package com.marvelist.backend.dto;

import java.time.Instant;
import java.util.List;

public final class SocialDtos {

    private SocialDtos() {}

    public record UserCard(Long id, String nickname, String avatar, boolean followedByMe, boolean me) {}

    public record PublicProfile(Long id, String nickname, String avatar, long followers, long following,
                                boolean followedByMe, boolean me, List<Long> favoriteIds,
                                List<MarathonDtos.PublicMarathon> lists) {}

    public record FollowState(boolean following, long followers) {}

    public record NotificationResponse(Long id, String type, Long actorId, String actorName, String actorAvatar,
                                       Long mediaId, String mediaTitle, Integer episode, Long commentId,
                                       String snippet, boolean read, Instant createdAt) {}

    public record UnreadCount(long count) {}
}
