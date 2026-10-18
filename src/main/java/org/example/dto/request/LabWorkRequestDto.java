package org.example.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.example.enums.Difficulty;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LabWorkRequestDto {

    @NotEmpty
    private String name;

    @NotNull
    @Valid
    private CoordinatesRequestDto coordinates;

    @NotNull
    @Positive
    private Integer minimalPoint;

    private Difficulty difficulty;

    @Valid
    private ExistingDisciplineDto discipline;
}