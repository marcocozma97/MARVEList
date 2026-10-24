package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Marathon;
import com.marvelist.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarathonRepository extends JpaRepository<Marathon, Long> {

    List<Marathon> findAllByUserOrderByStartDateAscIdAsc(User user);

    Optional<Marathon> findByIdAndUser(Long id, User user);
}
