package org.example.labs.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class PageOptions {
    @NotNull @Min(1) private Integer page = 1;
    @NotNull @Min(1) @Max(100) private Integer size = 10;
    @NotBlank private String sortBy = "id";
    @Size(min = 1, max = 12) private List<@NotNull @Valid SortCriterion> sort;
    @AssertTrue(message = "Смещение страницы превышает допустимый диапазон")
    public boolean isOffsetValid() {
        return page == null || size == null || ((long) page - 1) * size <= Integer.MAX_VALUE;
    }

    public record SortCriterion(@NotBlank String field,
                                @NotBlank @Pattern(regexp = "(?i)asc|desc") String direction) {}
}
