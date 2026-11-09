package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String surname;

    @Column(nullable = false, unique = true) // L'email univoca
    private String email;

    @Column(nullable = false)
    private String password;

    private String avatarUrl; // ID dell'avatar scelto tra quelli predefiniti del frontend

    private String nickname; // Nome mostrato nell'app (se vuoto si usa il nome)

    private Instant nicknameChangedAt;

    private Boolean nicknameReminderSent;

    private Instant jairvisLastAskAt;

    @Enumerated(EnumType.STRING)
    private Role role; // Permette di distinguere Admin da Utenti

    // Account attivo solo dopo aver cliccato il link nella mail di conferma.
    // null = utente registrato prima della conferma via mail: resta attivo.
    private Boolean enabled;

    @Column(unique = true)
    private String verificationToken; // Token del link di conferma

    private LocalDateTime verificationTokenExpiresAt;

    // Film visti dall'utente
    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "user_seen_media",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id")
    )
    private Set<Media> seenMedia = new HashSet<>();

    // Film preferiti dell'utente
    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "user_favorite_media",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id")
    )
    private Set<Media> favoriteMedia = new HashSet<>();

    // Titoli rimandati con "Guarda dopo": saltati nelle maratone e non contati nel completamento delle fasi
    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "user_watch_later_media",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "media_id")
    )
    private Set<Media> watchLaterMedia = new HashSet<>();

    // La watchlist si ricava dai progressi (vedi MediaService)

    public String displayName() {
        return nickname != null && !nickname.isBlank() ? nickname : name;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email; // Usiamo l'email per il login, non un "nome utente" separato
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !Boolean.FALSE.equals(enabled); // Spring Security blocca il login degli account non confermati
    }
}