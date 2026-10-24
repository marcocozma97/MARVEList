package com.marvelist.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {
    private String nickname;
    private String avatar; // ID di uno degli avatar predefiniti del frontend (es. "shield")
}
