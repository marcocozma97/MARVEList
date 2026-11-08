package com.marvelist.backend.config;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.MediaJsonDTO;
import com.marvelist.backend.repositories.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final MediaRepository mediaRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        // Sincronizza il DB con il JSON ad ogni avvio (titolo + anno come chiave):
        // aggiorna i titoli esistenti mantenendo gli ID (e quindi i "visti") e inserisce i nuovi
        {
            System.out.println("--- SINCRONIZZAZIONE DATI DA MARVEL_DATA.JSON ---");

            Map<String, Media> existingByKey = new HashMap<>();
            for (Media m : mediaRepository.findAll()) {
                existingByKey.put(m.getTitle() + "|" + m.getReleaseYear(), m);
            }

            try (InputStream inputStream = new ClassPathResource("marvel_data.json").getInputStream()) {
                List<MediaJsonDTO> jsonMediaList = objectMapper.readValue(inputStream, new TypeReference<List<MediaJsonDTO>>() {});
                List<Media> mediaToSave = new ArrayList<>();

                // L'indice nel JSON diventa l'ordine di visione
                for (int index = 0; index < jsonMediaList.size(); index++) {
                    MediaJsonDTO item = jsonMediaList.get(index);

                    String type = "movie".equalsIgnoreCase(item.getType()) ? "FILM" : "SERIE_TV";

                    String phaseStr;
                    Integer phase = item.getPhase();
                    if (phase == null) phaseStr = "Sconosciuta";
                    else if (phase == -1) phaseStr = "Classici / Origini";
                    else if (phase == 0) phaseStr = "Fase 0 (Multiverso)";
                    else phaseStr = "Fase " + phase;

                    // Ordine di visione in base ai tag
                    String visionOrder = "GOD"; // Default: tutto è GOD
                    if (item.getTags() != null) {
                        if (item.getTags().contains("mcu")) {
                            visionOrder = "MCU";
                        } else if (item.getTags().contains("marvel-fan")) {
                            visionOrder = "FAN";
                        }
                    }

                    // Cast sicuro per tmdbId se è Integer
                    Long tmdbId = item.getTmdbId() != null ? item.getTmdbId().longValue() : null;

                    Media media = existingByKey.remove(item.getTitle() + "|" + item.getYear());
                    if (media == null) {
                        media = Media.builder()
                                .title(item.getTitle())
                                .releaseYear(item.getYear())
                                .build();
                    }
                    media.setType(type);
                    media.setPhase(phaseStr);
                    media.setVisionOrder(visionOrder);
                    media.setSortOrder(index);
                    media.setEpisodes(item.getEpisodes());
                    media.setUpcoming(Boolean.TRUE.equals(item.getInArrivo()));
                    media.setDoomsday(Boolean.TRUE.equals(item.getDoomsday()));
                    media.setTags(item.getTags() == null ? "" : String.join(",", item.getTags()));
                    if (tmdbId != null && !tmdbId.equals(media.getTmdbId())) {
                        if (media.getTmdbId() != null) {
                            media.setPosterPath(null);
                            media.setRuntime(null);
                            media.setReleaseDate(null);
                        }
                        media.setTmdbId(tmdbId);
                    }

                    mediaToSave.add(media);
                }

                mediaRepository.saveAll(mediaToSave);
                System.out.println("--- SINCRONIZZATI " + jsonMediaList.size() + " TITOLI CON SUCCESSO! ---");

                // Titoli rimasti nel DB ma non più nel JSON (es. anno cambiato): li cancelliamo;
                // se qualche utente li usa ancora (visti, preferiti, maratone) li nascondiamo soltanto
                int deleted = 0, hidden = 0;
                for (Media orphan : existingByKey.values()) {
                    try {
                        mediaRepository.delete(orphan);
                        mediaRepository.flush();
                        deleted++;
                    } catch (DataIntegrityViolationException referenced) {
                        orphan.setSortOrder(null);
                        mediaRepository.save(orphan);
                        hidden++;
                    }
                }
                if (deleted + hidden > 0) {
                    System.out.println("--- TITOLI NON PIU' NEL JSON: " + deleted + " CANCELLATI, " + hidden + " NASCOSTI (IN USO) ---");
                }

            } catch (Exception e) {
                System.err.println("Errore durante la lettura di marvel_data.json: " + e.getMessage());
            }
        }
    }
}