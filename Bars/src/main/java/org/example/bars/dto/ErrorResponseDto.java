package org.example.bars.dto;

public record ErrorResponseDto(
        int status,
        String error,
        String message
) {}