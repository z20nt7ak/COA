package org.example.labs.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class PageOptions {
    public static final int PAGE_SIZE_MAX = 100;
    public static final int SORT_CRITERIA_MAX = 12;

    @NotNull(message = "Укажите номер страницы")
    @Min(value = 1, message = "Номер страницы должен быть не меньше 1")
    private Integer page = 1;

    @NotNull(message = "Укажите размер страницы")
    @Min(value = 1, message = "Размер страницы должен быть от 1 до " + PAGE_SIZE_MAX)
    @Max(value = PAGE_SIZE_MAX, message = "Размер страницы должен быть от 1 до " + PAGE_SIZE_MAX)
    private Integer size = 10;

    @NotBlank(message = "Укажите поле сортировки")
    private String sortBy = "id";

    @Size(min = 1, max = SORT_CRITERIA_MAX, message = "Список сортировки должен содержать от 1 до " + SORT_CRITERIA_MAX + " критериев")
    private List<@NotNull(message = "Критерий сортировки не может быть пустым") @Valid SortCriterion> sort;
    @AssertTrue(message = "Смещение страницы превышает допустимый диапазон")
    public boolean isOffsetValid() {
        return page == null || size == null || ((long) page - 1) * size <= Integer.MAX_VALUE;
    }

    public record SortCriterion(@NotBlank(message = "Укажите поле в критерии сортировки") String field,
                                @NotBlank(message = "Укажите направление в критерии сортировки")
                                @Pattern(regexp = "(?i)asc|desc", message = "Направление сортировки должно быть asc или desc") String direction) {}
}
