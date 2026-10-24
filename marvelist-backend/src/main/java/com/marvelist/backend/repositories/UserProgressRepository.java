package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.entities.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {

    Optional<UserProgress> findByUserAndMedia(User user, Media media);

    List<UserProgress> findAllByUser(User user);
}
