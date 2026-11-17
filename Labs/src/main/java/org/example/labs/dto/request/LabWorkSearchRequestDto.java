package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.example.labs.enums.Difficulty;
import java.time.LocalDate;
import java.util.List;

import static org.example.labs.validation.Limits.*;

@Getter @Setter
public class LabWorkSearchRequestDto extends PageOptions {
    @NotBlank(message = "Укажите направление сортировки")
    @Pattern(regexp = "(?i)asc|desc", message = "Направление сортировки должно быть asc или desc")
    private String sortType = "asc";
    @Size(min = 1, max = IDS_MAX, message = IDS_SIZE_MESSAGE)
    private List<@NotNull(message = "ID не может быть пустым") @Positive(message = "ID должен быть положительным числом") Long> id;
    private String name;
    @Min(value = COORDINATE_MIN, message = COORDINATE_X_MESSAGE)
    @Max(value = COORDINATE_MAX, message = COORDINATE_X_MESSAGE)
    private Integer xFrom, xTo;
    @DecimalMin(value = COORDINATE_MIN_DECIMAL, message = COORDINATE_Y_MESSAGE)
    @DecimalMax(value = COORDINATE_MAX_DECIMAL, message = COORDINATE_Y_MESSAGE)
    private Double yFrom, yTo;
    private LocalDate creationDateFrom, creationDateTo;
    private String dateTimeZone;
    @Min(value = MIN_POINT_MIN, message = MIN_POINT_MESSAGE)
    @Max(value = MIN_POINT_MAX, message = MIN_POINT_MESSAGE)
    private Integer minimalPointFrom, minimalPointTo;
    private Difficulty difficulty;
    private Boolean hasDifficulty, hasDiscipline;
    @Size(min = 1, max = IDS_MAX, message = DISCIPLINE_IDS_SIZE_MESSAGE)
    private List<@NotNull(message = "ID дисциплины не может быть пустым") @Positive(message = "ID дисциплины должен быть положительным числом") Long> disciplineIds;
    private String disciplineName;
    @Min(value = PRACTICE_HOURS_MIN, message = PRACTICE_HOURS_MESSAGE)
    @Max(value = PRACTICE_HOURS_MAX, message = PRACTICE_HOURS_MESSAGE)
    private Long disciplinePracticeHoursFrom, disciplinePracticeHoursTo;
    @PositiveOrZero(message = LABS_COUNT_MESSAGE) private Long disciplineLabsCountFrom;
    @PositiveOrZero(message = LABS_COUNT_MESSAGE) private Long disciplineLabsCountTo;

    @AssertTrue(message = CREATION_DATE_MESSAGE)
    public boolean isCreationDateInRange() {
        return inDateRange(creationDateFrom) && inDateRange(creationDateTo);
    }

    private static boolean inDateRange(LocalDate date) {
        return date == null || (!date.isBefore(CREATION_DATE_MIN) && !date.isAfter(CREATION_DATE_MAX));
    }
}
