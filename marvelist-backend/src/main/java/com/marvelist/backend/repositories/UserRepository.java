package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findAllByEmailIgnoreCase(String email);

    // Login e registrazione ignorano le maiuscole (gli smartphone scrivono "Mario@..." da soli).
    // Se esistono vecchi account che differiscono solo per le maiuscole vince quello attivo, poi quello scritto uguale.
    default Optional<User> findByEmailForLogin(String email) {
        if (email == null) return Optional.empty();
        String typed = email.trim();
        return findAllByEmailIgnoreCase(typed).stream()
                .sorted(Comparator.comparing((User u) -> !u.isEnabled())
                        .thenComparing(u -> !u.getEmail().equals(typed)))
                .findFirst();
    }
    // Utente a cui appartiene il link di conferma della registrazione
    Optional<User> findByVerificationToken(String token);

    @Query("select u from User u where (u.enabled is null or u.enabled = true) and u.id <> :excludeId and "
            + "lower(coalesce(nullif(trim(u.nickname), ''), u.name)) like lower(concat('%', :query, '%')) "
            + "order by lower(coalesce(nullif(trim(u.nickname), ''), u.name))")
    List<User> searchByDisplayName(@Param("query") String query, @Param("excludeId") Long excludeId, Pageable pageable);

    @Transactional
    @Modifying
    @Query("update User u set u.jairvisLastAskAt = :now where u.id = :id and (u.jairvisLastAskAt is null or u.jairvisLastAskAt <= :cutoff)")
    int claimJairvisQuestion(@Param("id") Long id, @Param("now") Instant now, @Param("cutoff") Instant cutoff);

    @Transactional
    @Modifying
    @Query("update User u set u.jairvisLastAskAt = :previous where u.id = :id and u.jairvisLastAskAt = :claimed")
    int releaseJairvisQuestion(@Param("id") Long id, @Param("claimed") Instant claimed, @Param("previous") Instant previous);



    List<User> findByEmailIgnoreCaseIn(Collection<String> emails);

    // Contatore dell'account ufficiale: attivi (enabled null = registrati prima della conferma via mail)
    @Query("select count(u) from User u where u.enabled is null or u.enabled = true")
    long countActive();

    long countByEnabled(Boolean enabled);

    // Attivi che hanno segnato almeno un titolo come visto
    @Query("select count(distinct u) from User u join u.seenMedia m where u.enabled is null or u.enabled = true")
    long countActiveWithSeenMedia();
}
