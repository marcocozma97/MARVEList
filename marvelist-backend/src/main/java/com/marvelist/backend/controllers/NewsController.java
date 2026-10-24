package com.marvelist.backend.controllers;

import com.marvelist.backend.dto.NewsArticle;
import com.marvelist.backend.services.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<List<NewsArticle>> getLatest() {
        return ResponseEntity.ok(newsService.getLatest());
    }
}
