package com.marvelist.backend.services;

import com.marvelist.backend.dto.UserProfileRequest;
import com.marvelist.backend.dto.UserProfileResponse;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(String email) {
        return toResponse(findUser(email));
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileRequest request) {
        User user = findUser(email);

        if (request.getNickname() != null) {
            String nickname = request.getNickname().trim();
            if (nickname.length() < 2 || nickname.length() > 30) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il nickname deve avere tra 2 e 30 caratteri");
            }
            user.setNickname(nickname);
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
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }
}
