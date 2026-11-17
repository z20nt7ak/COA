package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExistingDisciplineDto {
    @NotNull(message = "Укажите ID дисциплины")
    @Positive(message = "ID дисциплины должен быть положительным числом")
    private Long id;
}
