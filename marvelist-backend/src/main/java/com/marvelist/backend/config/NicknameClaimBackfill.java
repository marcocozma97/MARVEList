package com.marvelist.backend.config;

import com.marvelist.backend.entities.NicknameClaim;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.NicknameClaimRepository;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

@Component
@RequiredArgsConstructor
public class NicknameClaimBackfill implements ApplicationRunner {

    private final UserRepository userRepository;
    private final NicknameClaimRepository claimRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findAll().stream()
                .filter(u -> u.getNicknameChangedAt() != null && u.getNickname() != null && !u.getNickname().isBlank())
                .sorted(Comparator.comparing(User::getNicknameChangedAt).thenComparing(User::getId))
                .forEach(user -> {
                    String key = UserService.nicknameKey(user.getNickname());
                    var claim = claimRepository.findByNicknameKey(key);
                    if (claim.isEmpty()) {
                        claimRepository.save(NicknameClaim.builder().nicknameKey(key).user(user).claimedAt(user.getNicknameChangedAt()).build());
                    } else if (!claim.get().getUser().getId().equals(user.getId())) {
                        user.setNicknameChangedAt(null);
                        userRepository.save(user);
                    }
                });
    }
}
