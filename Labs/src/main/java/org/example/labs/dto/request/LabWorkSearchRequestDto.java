package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.example.labs.enums.Difficulty;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class LabWorkSearchRequestDto extends PageOptions {
    @NotBlank @Pattern(regexp = "(?i)asc|desc") private String sortType = "asc";
    @Size(min = 1, max = 1000) private List<@NotNull @Positive Long> id;
    private String name;
    private Integer xFrom, xTo;
    private Double yFrom, yTo;
    private LocalDate creationDateFrom, creationDateTo;
    @Positive private Integer minimalPointFrom;
    @Positive private Integer minimalPointTo;
    private Difficulty difficulty;
    private Boolean hasDifficulty, hasDiscipline;
    @Size(min = 1, max = 1000) private List<@NotNull @Positive Long> disciplineIds;
    private String disciplineName;
    @PositiveOrZero private Long disciplinePracticeHoursFrom;
    @PositiveOrZero private Long disciplinePracticeHoursTo;
    @PositiveOrZero private Long disciplineLabsCountFrom;
    @PositiveOrZero private Long disciplineLabsCountTo;
}
