package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String surname;
    private String email;
    private String nickname;
    private String avatar;
    private long followers;
    private long following;
    private boolean nicknameChosen;
    private Instant nicknameChangeableFrom;
}
