package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    // Utente a cui appartiene il link di conferma della registrazione
    Optional<User> findByVerificationToken(String token);
}