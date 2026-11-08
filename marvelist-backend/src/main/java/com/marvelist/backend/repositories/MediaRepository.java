package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {

    // Stesso ordine del marvel_data.json (l'ID non basta: i titoli aggiunti dopo finirebbero in fondo).
    // I titoli senza posizione non sono più nel JSON e restano fuori dalla Timeline.
    List<Media> findAllBySortOrderIsNotNullOrderBySortOrderAsc();

    @Query("select m from Media m where m.sortOrder is not null and (m.addedAt >= :addedSince or m.releasedOn >= :from "
            + "or (m.releaseDate is not null and m.releaseDate between :from and :to))")
    List<Media> findNotificationCandidates(@Param("addedSince") Instant addedSince, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
