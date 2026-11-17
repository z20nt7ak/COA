package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

import static org.example.labs.validation.Limits.*;

@Getter
@Setter
public class DisciplineSearchRequestDto extends PageOptions {
    @NotBlank(message = "Укажите направление сортировки")
    @Pattern(regexp = "(?i)asc|desc", message = "Направление сортировки должно быть asc или desc")
    private String sortDirection = "asc";
    @Size(min = 1, max = IDS_MAX, message = IDS_SIZE_MESSAGE)
    private List<@NotNull(message = "ID не может быть пустым") @Positive(message = "ID должен быть положительным числом") Long> ids;
    private String name;
    @Min(value = PRACTICE_HOURS_MIN, message = PRACTICE_HOURS_MESSAGE)
    @Max(value = PRACTICE_HOURS_MAX, message = PRACTICE_HOURS_MESSAGE)
    private Long practiceHoursFrom, practiceHoursTo;
    @PositiveOrZero(message = LABS_COUNT_MESSAGE)
    private Long labsCountFrom;
    @PositiveOrZero(message = LABS_COUNT_MESSAGE)
    private Long labsCountTo;
}
