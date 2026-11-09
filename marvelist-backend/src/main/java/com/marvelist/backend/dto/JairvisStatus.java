package com.marvelist.backend.dto;

import java.time.Instant;

public record JairvisStatus(int remaining, Instant nextAskAt, boolean maintenance) {}
