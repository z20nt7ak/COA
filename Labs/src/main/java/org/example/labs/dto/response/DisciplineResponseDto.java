package org.example.labs.dto.response;

public record DisciplineResponseDto(
        Long id,
        String name,
        long practiceHours,
        Long labsCount
) {}
