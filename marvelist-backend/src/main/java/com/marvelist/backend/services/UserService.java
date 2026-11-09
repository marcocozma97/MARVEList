package com.marvelist.backend.services;

import com.marvelist.backend.dto.UserProfileRequest;
import com.marvelist.backend.dto.UserProfileResponse;
import com.marvelist.backend.entities.NicknameClaim;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.FollowRepository;
import com.marvelist.backend.repositories.NicknameClaimRepository;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    public static final Duration NICKNAME_COOLDOWN = Duration.ofDays(30);
    private static final DateTimeFormatter IT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Europe/Rome"));

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final NicknameClaimRepository claimRepository;

    public UserProfileResponse getProfile(String email) {
        return toResponse(findUser(email));
    }

    public static String nicknameKey(String nickname) {
        return nickname.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String email, String nickname) {
        if (nickname == null || nickname.isBlank()) return false;
        User user = findUser(email);
        return claimRepository.findByNicknameKey(nicknameKey(nickname))
                .map(claim -> claim.getUser().getId().equals(user.getId()))
                .orElse(true);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileRequest request) {
        User user = findUser(email);

        if (request.getNickname() != null) {
            String nickname = request.getNickname().strip().replaceAll("\\s+", " ");
            if (nickname.length() < 2 || nickname.length() > 30) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il nickname deve avere tra 2 e 30 caratteri");
            }
            Instant now = Instant.now();
            Instant changedAt = user.getNicknameChangedAt();
            if (changedAt == null || !nickname.equals(user.displayName())) {
                if (changedAt != null && now.isBefore(changedAt.plus(NICKNAME_COOLDOWN))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Potrai cambiare di nuovo il nickname dal " + IT_DATE.format(changedAt.plus(NICKNAME_COOLDOWN)));
                }
                String key = nicknameKey(nickname);
                var claim = claimRepository.findByNicknameKey(key);
                if (claim.isPresent() && !claim.get().getUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Il nickname \"" + nickname + "\" è già di un altro utente: scegline un altro");
                }
                if (claim.isEmpty()) {
                    claimRepository.save(NicknameClaim.builder().nicknameKey(key).user(user).claimedAt(now).build());
                }
                user.setNickname(nickname);
                user.setNicknameChangedAt(now);
                user.setNicknameReminderSent(false);
            }
        }

        if (request.getAvatar() != null) {
            // Solo ID semplici degli avatar predefiniti (es. "shield"), niente URL esterni
            if (!request.getAvatar().matches("^[a-z0-9-]{1,30}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar non valido");
            }
            user.setAvatarUrl(request.getAvatar());
        }

        return toResponse(userRepository.save(user));
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .nickname(user.getNickname() != null && !user.getNickname().isBlank() ? user.getNickname() : user.getName())
                .avatar(user.getAvatarUrl())
                .followers(followRepository.countByFollowed(user))
                .following(followRepository.countByFollower(user))
                .nicknameChosen(user.getNicknameChangedAt() != null)
                .nicknameChangeableFrom(nextNicknameChange(user))
                .build();
    }

    private static Instant nextNicknameChange(User user) {
        if (user.getNicknameChangedAt() == null) return null;
        Instant next = user.getNicknameChangedAt().plus(NICKNAME_COOLDOWN);
        return Instant.now().isBefore(next) ? next : null;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }
}
