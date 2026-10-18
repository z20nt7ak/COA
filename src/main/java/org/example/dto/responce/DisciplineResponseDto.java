package org.example.dto.responce;

public record DisciplineResponseDto(
        Long id,
        String name,
        long practiceHours,
        Long labsCount
) {}
