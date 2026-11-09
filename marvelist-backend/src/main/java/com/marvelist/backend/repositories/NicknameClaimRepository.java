package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.NicknameClaim;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NicknameClaimRepository extends JpaRepository<NicknameClaim, Long> {

    @EntityGraph(attributePaths = "user")
    Optional<NicknameClaim> findByNicknameKey(String nicknameKey);
}
