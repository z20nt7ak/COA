package org.example.labs.dto.response;

public record ErrorResponseDto(
        int status,
        String error,
        String message
) {}