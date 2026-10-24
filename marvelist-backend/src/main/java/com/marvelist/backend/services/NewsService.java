package com.marvelist.backend.services;

import com.marvelist.backend.dto.NewsArticle;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// Notizie Marvel dal feed RSS di Google News in italiano.
// Il feed si legge dal backend (il browser lo bloccherebbe per CORS) e resta in memoria per qualche minuto.
@Service
@RequiredArgsConstructor
public class NewsService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final int MAX_ARTICLES = 40;

    private final RestTemplate restTemplate;

    @Value("${news.feed.url}")
    private String feedUrl;

    @Value("${news.feed.query}")
    private String feedQuery;

    private volatile List<NewsArticle> cached = List.of();
    private volatile Instant cachedAt = Instant.EPOCH;

    public List<NewsArticle> getLatest() {
        if (Instant.now().isBefore(cachedAt.plus(CACHE_TTL))) return cached;
        synchronized (this) {
            if (Instant.now().isBefore(cachedAt.plus(CACHE_TTL))) return cached;
            try {
                URI uri = UriComponentsBuilder.fromUriString(feedUrl)
                        .queryParam("q", feedQuery)
                        .queryParam("hl", "it")
                        .queryParam("gl", "IT")
                        .queryParam("ceid", "IT:it")
                        .encode().build().toUri();
                String xml = restTemplate.getForObject(uri, String.class);
                cached = parse(xml == null ? "" : xml);
                cachedAt = Instant.now();
            } catch (RestClientException | IllegalArgumentException e) {
                // Feed irraggiungibile: meglio le notizie di prima che una pagina vuota
                if (cached.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                            "Le rotative del Daily Bugle sono ferme: riprova tra qualche minuto.", e);
                }
            }
            return cached;
        }
    }

    // Dal più recente al più vecchio, senza doppioni (la stessa notizia esce su più testate con lo stesso titolo)
    public static List<NewsArticle> parse(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Niente DTD né entità esterne: il feed arriva da Internet (protezione da XXE)
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));

            NodeList items = document.getElementsByTagName("item");
            List<NewsArticle> articles = new ArrayList<>();
            List<String> seenTitles = new ArrayList<>();
            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);
                String source = text(item, "source");
                String title = stripSource(text(item, "title"), source);
                String link = text(item, "link");
                Instant publishedAt = parseDate(text(item, "pubDate"));
                if (title.isBlank() || !link.startsWith("https://") || publishedAt == null) continue;
                if (seenTitles.contains(title.toLowerCase())) continue;
                seenTitles.add(title.toLowerCase());
                articles.add(new NewsArticle(title, source, link, publishedAt));
            }
            return articles.stream()
                    .sorted(Comparator.comparing(NewsArticle::publishedAt).reversed())
                    .limit(MAX_ARTICLES)
                    .toList();
        } catch (Exception e) {
            throw new IllegalArgumentException("Feed RSS non valido", e);
        }
    }

    private static String text(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        return nodes.getLength() == 0 ? "" : nodes.item(0).getTextContent().trim();
    }

    // Google News accoda la testata al titolo: "Titolo - Fonte"
    private static String stripSource(String title, String source) {
        String suffix = " - " + source;
        return !source.isEmpty() && title.endsWith(suffix) ? title.substring(0, title.length() - suffix.length()).trim() : title;
    }

    private static Instant parseDate(String value) {
        try {
            return ZonedDateTime.parse(value, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant();
        } catch (Exception e) {
            return null;
        }
    }
}
