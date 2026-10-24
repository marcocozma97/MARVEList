package com.marvelist.backend;

import com.marvelist.backend.dto.NewsArticle;
import com.marvelist.backend.services.NewsService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class NewsServiceTest {

    private static String item(String title, String source, String date) {
        return "<item><title>" + title + "</title><link>https://news.google.com/rss/articles/x</link>"
                + "<pubDate>" + date + "</pubDate><source url=\"https://esempio.it\">" + source + "</source></item>";
    }

    private static String feed(String... items) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel>" + String.join("", items) + "</channel></rss>";
    }

    @Test
    void ordinaDalPiuRecenteETogliLaTestataDalTitolo() {
        List<NewsArticle> news = NewsService.parse(feed(
                item("Vecchia notizia - BadTaste", "BadTaste", "Mon, 19 Oct 2026 10:00:00 GMT"),
                item("Avengers: Doomsday, nuovo trailer - Best Movie", "Best Movie", "Wed, 21 Oct 2026 08:38:40 GMT")
        ));

        assertEquals(2, news.size());
        assertEquals("Avengers: Doomsday, nuovo trailer", news.get(0).title());
        assertEquals("Best Movie", news.get(0).source());
        assertEquals(Instant.parse("2026-10-21T08:38:40Z"), news.get(0).publishedAt());
    }

    @Test
    void laStessaNotiziaSuPiuTestateCompareUnaVolta() {
        List<NewsArticle> news = NewsService.parse(feed(
                item("VisionQuest arriva su Disney+ - Sky TG24", "Sky TG24", "Wed, 21 Oct 2026 08:00:00 GMT"),
                item("VisionQuest arriva su Disney+ - IGN Italia", "IGN Italia", "Wed, 21 Oct 2026 09:00:00 GMT")
        ));

        assertEquals(1, news.size());
    }

    @Test
    void scartaLeNotizieSenzaDataValida() {
        List<NewsArticle> news = NewsService.parse(feed(item("Senza data - Fonte", "Fonte", "ieri")));

        assertTrue(news.isEmpty());
    }

    @Test
    void rifiutaUnFeedConDtd() {
        String xxe = "<?xml version=\"1.0\"?><!DOCTYPE rss [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><rss><channel>"
                + item("&x;", "Fonte", "Wed, 21 Oct 2026 08:00:00 GMT") + "</channel></rss>";

        assertThrows(IllegalArgumentException.class, () -> NewsService.parse(xxe));
    }
}
