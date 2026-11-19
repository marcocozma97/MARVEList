package com.marvelist.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class SchemaUpgrade implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("alter table if exists notifications drop constraint if exists notifications_type_check");
        jdbcTemplate.execute("alter table if exists users drop column if exists jairvis_last_suggestion_at");
        jdbcTemplate.execute("alter table if exists users drop column if exists jairvis_second_ask_at");

        // Sfondi delle maratone: le immagini caricate (MB nel database) diventano la locandina del primo titolo
        // che ne ha una, o nessuno sfondo. Dopo la prima volta non trova più niente da cambiare.
        int replaced = jdbcTemplate.update("""
                update marathons m set background = (
                    select me.poster_path from marathon_items i join media me on me.id = i.media_id
                    where i.marathon_id = m.id and me.poster_path is not null
                      and (me.poster_path like '/%' or me.poster_path like 'https://%')
                    order by i.position limit 1)
                where m.background like 'data:%'""");
        if (replaced > 0) {
            System.out.println("--- SFONDI DELLE MARATONE: " + replaced + " IMMAGINI CARICATE SOSTITUITE CON UNA LOCANDINA ---");
        }
    }
}
