package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {

    Optional<UserProgress> findByUserAndMedia(User user, Media media);

    List<UserProgress> findAllByUser(User user);

    // Voto MARVEList di un titolo: [media, numero di voti]
    @Query("select avg(p.rating), count(p.rating) from UserProgress p where p.media.id = :mediaId and p.rating is not null")
    List<Object[]> averageRating(@Param("mediaId") Long mediaId);

    // Classifica dei titoli più votati, solo con almeno minVotes voti: [mediaId, media, numero di voti]
    @Query("select p.media.id, avg(p.rating), count(p.rating) from UserProgress p "
            + "where p.rating is not null and p.media.sortOrder is not null "
            + "group by p.media.id having count(p.rating) >= :minVotes "
            + "order by avg(p.rating) desc, count(p.rating) desc")
    List<Object[]> topRated(@Param("minVotes") long minVotes, Pageable pageable);
}
