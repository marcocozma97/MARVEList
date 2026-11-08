package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    // Utente a cui appartiene il link di conferma della registrazione
    Optional<User> findByVerificationToken(String token);

    @Query("select u from User u where (u.enabled is null or u.enabled = true) and u.id <> :excludeId and "
            + "lower(coalesce(nullif(trim(u.nickname), ''), u.name)) like lower(concat('%', :query, '%')) "
            + "order by lower(coalesce(nullif(trim(u.nickname), ''), u.name))")
    List<User> searchByDisplayName(@Param("query") String query, @Param("excludeId") Long excludeId, Pageable pageable);
}