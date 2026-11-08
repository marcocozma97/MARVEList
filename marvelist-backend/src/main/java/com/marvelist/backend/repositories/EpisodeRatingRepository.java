package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.EpisodeRating;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EpisodeRatingRepository extends JpaRepository<EpisodeRating, Long> {

    List<EpisodeRating> findAllByUserAndMedia(User user, Media media);

    Optional<EpisodeRating> findByUserAndMediaAndEpisodeNumber(User user, Media media, Integer episodeNumber);
}
