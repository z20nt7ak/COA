package org.example.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DisciplineRequestDto {

    @NotBlank
    private String name;

    @NotNull
    @PositiveOrZero
    private Long practiceHours;

    @NotNull
    @PositiveOrZero
    private Long labsCount;
}