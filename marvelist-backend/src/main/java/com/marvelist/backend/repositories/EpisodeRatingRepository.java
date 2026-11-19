package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.EpisodeRating;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EpisodeRatingRepository extends JpaRepository<EpisodeRating, Long> {

    List<EpisodeRating> findAllByUserAndMedia(User user, Media media);
    List<EpisodeRating> findAllByUser(User user);

    // Voto MARVEList dei singoli episodi: [episodio, media, numero di voti]
    @Query("select r.episodeNumber, avg(r.rating), count(r) from EpisodeRating r where r.media.id = :mediaId group by r.episodeNumber")
    List<Object[]> averageByEpisode(@Param("mediaId") Long mediaId);

    Optional<EpisodeRating> findByUserAndMediaAndEpisodeNumber(User user, Media media, Integer episodeNumber);
}
