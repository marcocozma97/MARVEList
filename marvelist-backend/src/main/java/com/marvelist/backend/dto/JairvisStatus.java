package com.marvelist.backend.dto;

import java.time.Instant;
import java.util.List;

public record JairvisStatus(boolean available, Instant nextAskAt, boolean suggestionAvailable, Instant nextSuggestionAt,
                            boolean maintenance, List<String> suggestions) {}
