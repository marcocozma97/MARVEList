package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = "user")
    List<Comment> findByMediaIdAndEpisodeNumberIsNullOrderByCreatedAtDesc(Long mediaId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    List<Comment> findByMediaIdAndEpisodeNumberOrderByCreatedAtDesc(Long mediaId, Integer episodeNumber, Pageable pageable);

    long countByMediaIdAndEpisodeNumberIsNull(Long mediaId);

    long countByMediaIdAndEpisodeNumber(Long mediaId, Integer episodeNumber);

    long countByUserAndCreatedAtAfter(User user, Instant since);
}
