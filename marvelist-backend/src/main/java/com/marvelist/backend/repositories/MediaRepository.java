package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {

    // Stesso ordine del marvel_data.json (l'ID non basta: i titoli aggiunti dopo finirebbero in fondo).
    // I titoli senza posizione non sono più nel JSON e restano fuori dalla Timeline.
    List<Media> findAllBySortOrderIsNotNullOrderBySortOrderAsc();
}
