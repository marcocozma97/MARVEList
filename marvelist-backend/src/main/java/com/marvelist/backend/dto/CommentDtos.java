package com.marvelist.backend.dto;

import java.time.Instant;
import java.util.List;

public class CommentDtos {

    public record CommentRequest(String text, Integer episode, boolean spoiler, String gifUrl, Long parentId) {}

    public record CommentResponse(Long id, Long parentId, Integer episode, Long authorId, String authorName, String authorAvatar,
                                  String text, String gifUrl, boolean spoiler, Instant createdAt, boolean mine,
                                  long likes, boolean liked, List<CommentResponse> replies) {}

    public record CommentCount(long count) {}

    public record LikeResponse(long likes, boolean liked) {}
}
