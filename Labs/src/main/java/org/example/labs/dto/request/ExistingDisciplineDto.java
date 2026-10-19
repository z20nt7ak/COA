package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExistingDisciplineDto {

    @NotNull
    @Positive
    private Long id;
}