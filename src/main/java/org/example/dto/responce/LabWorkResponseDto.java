package org.example.dto.responce;
import org.example.enums.Difficulty;

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