package com.marvelist.backend.dto;

import java.time.Instant;

// Notizia del feed: il link porta all'articolo originale sul sito della testata
public record NewsArticle(String title, String source, String link, Instant publishedAt) {
}
