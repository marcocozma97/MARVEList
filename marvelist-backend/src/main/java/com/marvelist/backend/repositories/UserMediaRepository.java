package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMediaRepository extends JpaRepository<UserMedia, Long> {

    // Trova un media specifico di un utente specifico (es. Il film "Iron Man" di Tony Stark)
    Optional<UserMedia> findByUserAndTmdbIdAndMediaType(User user, Long tmdbId, String mediaType);

    // Recupera tutta la lista di film/serie salvati da un utente
    List<UserMedia> findAllByUser(User user);
}