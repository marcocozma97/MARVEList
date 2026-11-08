package com.marvelist.backend.dto;

import java.time.Instant;

public class CommentDtos {

    public record CommentRequest(String text, Integer episode, boolean spoiler, String gifUrl, String image) {}

    public record CommentResponse(Long id, Integer episode, String authorName, String authorAvatar, String text,
                                  String gifUrl, String imageUrl, boolean spoiler, Instant createdAt, boolean mine) {}

    public record CommentCount(long count) {}
}
