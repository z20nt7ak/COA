package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import static org.example.labs.validation.Limits.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CoordinatesRequestDto {

    @NotNull(message = "Укажите координату X")
    @Min(value = COORDINATE_MIN, message = COORDINATE_X_MESSAGE)
    @Max(value = COORDINATE_MAX, message = COORDINATE_X_MESSAGE)
    private Integer x;

    @NotNull(message = "Укажите координату Y")
    @DecimalMin(value = COORDINATE_MIN_DECIMAL, message = COORDINATE_Y_MESSAGE)
    @DecimalMax(value = COORDINATE_MAX_DECIMAL, message = COORDINATE_Y_MESSAGE)
    @Digits(integer = COORDINATE_Y_INTEGER_DIGITS, fraction = COORDINATE_Y_FRACTION_DIGITS, message = COORDINATE_Y_FRACTION_MESSAGE)
    private Double y;
}
