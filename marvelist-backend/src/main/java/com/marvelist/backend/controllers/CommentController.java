package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.CommentDtos.CommentCount;
import com.marvelist.backend.dto.CommentDtos.CommentRequest;
import com.marvelist.backend.dto.CommentDtos.CommentResponse;
import com.marvelist.backend.dto.CommentDtos.LikeResponse;
import com.marvelist.backend.services.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/media/{mediaId}/comments")
    public ResponseEntity<List<CommentResponse>> list(@PathVariable Long mediaId, @RequestParam(required = false) Integer episode,
                                                      Authentication authentication) {
        return ResponseEntity.ok(commentService.list(authentication.getName(), mediaId, episode));
    }

    @GetMapping("/media/{mediaId}/comments/count")
    public ResponseEntity<CommentCount> count(@PathVariable Long mediaId, @RequestParam(required = false) Integer episode) {
        return ResponseEntity.ok(new CommentCount(commentService.count(mediaId, episode)));
    }

    @PostMapping("/media/{mediaId}/comments")
    public ResponseEntity<CommentResponse> create(@PathVariable Long mediaId, @RequestBody CommentRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.ok(commentService.create(authentication.getName(), mediaId, request));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<LikeResponse> like(@PathVariable Long commentId, Authentication authentication) {
        return ResponseEntity.ok(commentService.toggleLike(authentication.getName(), commentId));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long commentId, Authentication authentication) {
        commentService.delete(authentication.getName(), commentId);
        return ResponseEntity.noContent().build();
    }
}
