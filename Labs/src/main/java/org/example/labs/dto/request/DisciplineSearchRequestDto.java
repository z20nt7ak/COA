package org.example.labs.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class DisciplineSearchRequestDto extends PageOptions {
    @NotBlank @Pattern(regexp = "(?i)asc|desc") private String sortDirection = "asc";
    @Size(min = 1, max = 1000) private List<@NotNull @Positive Long> ids;
    private String name;
    @PositiveOrZero private Long practiceHoursFrom;
    @PositiveOrZero private Long practiceHoursTo;
    @PositiveOrZero private Long labsCountFrom;
    @PositiveOrZero private Long labsCountTo;
}
