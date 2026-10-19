package org.example.labs.dto.response;

import org.example.labs.enums.Difficulty;
import java.time.ZonedDateTime;

public record LabWorkResponseDto(
        Long id,
        String name,
        CoordinatesResponseDto coordinates,
        ZonedDateTime creationDate,
        Integer minimalPoint,
        Difficulty difficulty,
        DisciplineResponseDto discipline
) {}