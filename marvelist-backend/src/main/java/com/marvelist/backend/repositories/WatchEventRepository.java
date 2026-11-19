package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.WatchEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface WatchEventRepository extends JpaRepository<WatchEvent, Long> {

    // Titoli visti da più utenti diversi dopo "since": [mediaId, utenti]
    @Query("select e.media.id, count(distinct e.user.id) from WatchEvent e "
            + "where e.watchedAt >= :since and e.media.sortOrder is not null "
            + "group by e.media.id order by count(distinct e.user.id) desc, max(e.watchedAt) desc")
    List<Object[]> topWatchedSince(@Param("since") Instant since, Pageable pageable);
}
