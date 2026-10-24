package com.marvelist.backend.services;

import com.marvelist.backend.dto.UserMediaRequest;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserMedia;
import com.marvelist.backend.repositories.UserMediaRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserMediaService {

    private final UserMediaRepository userMediaRepository;
    private final UserRepository userRepository;

    // Metodo helper per ottenere l'utente attualmente loggato tramite il Token JWT
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));
    }

    // Salva o aggiorna il progresso di un film/serie
    public UserMedia saveOrUpdateMedia(UserMediaRequest request) {
        User currentUser = getCurrentUser();

        // Cerca se l'utente ha già interagito con questo specifico media
        UserMedia media = userMediaRepository.findByUserAndTmdbIdAndMediaType(
                currentUser, request.getTmdbId(), request.getMediaType()
        ).orElse(new UserMedia()); // Se non esiste, crea un nuovo oggetto vuoto

        // Aggiorna i dati
        media.setUser(currentUser);
        media.setTmdbId(request.getTmdbId());
        media.setMediaType(request.getMediaType());
        media.setWatched(request.isWatched());
        media.setInWatchlist(request.isInWatchlist());
        media.setRating(request.getRating()); // Accetta Double (es. 8.5)

        // Salva nel database
        return userMediaRepository.save(media);
    }

    // Recupera tutta la libreria dell'utente (per mostrare i suoi progressi nel profilo)
    public List<UserMedia> getUserLibrary() {
        User currentUser = getCurrentUser();
        return userMediaRepository.findAllByUser(currentUser);
    }
}