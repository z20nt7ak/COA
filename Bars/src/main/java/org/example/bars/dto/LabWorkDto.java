package org.example.bars.dto;

public record LabWorkDto(
        String name,
        CoordinatesDto coordinates,
        Integer minimalPoint,
        String difficulty,
        DisciplineDto discipline
) {}