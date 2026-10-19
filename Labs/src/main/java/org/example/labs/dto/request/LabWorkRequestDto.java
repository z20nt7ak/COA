package org.example.labs.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.example.labs.enums.Difficulty;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LabWorkRequestDto {

    @NotBlank
    private String name;

    @NotNull
    @Valid
    private CoordinatesRequestDto coordinates;

    @Positive
    @NotNull
    private Integer minimalPoint;

    private Difficulty difficulty;

    @Valid
    private ExistingDisciplineDto discipline;
}