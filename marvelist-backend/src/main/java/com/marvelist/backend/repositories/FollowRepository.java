package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Follow;
import com.marvelist.backend.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerAndFollowed(User follower, User followed);

    boolean existsByFollowerAndFollowed(User follower, User followed);

    long countByFollowed(User followed);

    long countByFollower(User follower);

    @EntityGraph(attributePaths = "follower")
    List<Follow> findByFollowedOrderByCreatedAtDesc(User followed, Pageable pageable);

    @EntityGraph(attributePaths = "followed")
    List<Follow> findByFollowerOrderByCreatedAtDesc(User follower, Pageable pageable);

    @Query("select f.followed.id from Follow f where f.follower = :follower and f.followed.id in :ids")
    List<Long> followedAmong(@Param("follower") User follower, @Param("ids") Collection<Long> ids);
}
