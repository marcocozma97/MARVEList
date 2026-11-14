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
    }
}
