package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import static org.example.labs.validation.Limits.*;

@Getter
@Setter
@NoArgsConstructor
public class DisciplineRequestDto {
    @NotBlank(message = NAME_BLANK_MESSAGE)
    @Size(max = NAME_MAX_LENGTH, message = NAME_LENGTH_MESSAGE)
    private String name;

    @NotNull(message = "Укажите часы практики")
    @Min(value = PRACTICE_HOURS_MIN, message = PRACTICE_HOURS_MESSAGE)
    @Max(value = PRACTICE_HOURS_MAX, message = PRACTICE_HOURS_MESSAGE)
    private Long practiceHours;

    public void setName(String name) {
        this.name = name == null ? null : name.strip();
    }
}
