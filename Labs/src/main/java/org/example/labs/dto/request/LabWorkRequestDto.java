package org.example.labs.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.example.labs.enums.Difficulty;

import static org.example.labs.validation.Limits.*;

@Getter
@Setter
@NoArgsConstructor
public class LabWorkRequestDto {
    @NotBlank(message = NAME_BLANK_MESSAGE)
    private String name;

    @NotNull(message = "Укажите координаты")
    @Valid
    private CoordinatesRequestDto coordinates;

    @NotNull(message = "Укажите минимальный балл")
    @Min(value = MIN_POINT_MIN, message = MIN_POINT_MESSAGE)
    @Max(value = MIN_POINT_MAX, message = MIN_POINT_MESSAGE)
    private Integer minimalPoint;

    private Difficulty difficulty;

    @Valid
    private ExistingDisciplineDto discipline;

    public void setName(String name) {
        this.name = name == null ? null : name.strip();
    }
}
