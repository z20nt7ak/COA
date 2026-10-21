package org.example.labs.search;

import jakarta.persistence.criteria.*;
import org.example.labs.dto.request.*;
import org.example.labs.enums.Difficulty;
import org.example.labs.exceptions.InvalidSearchException;
import org.example.labs.models.*;
import org.springframework.data.jpa.domain.Specification;
import java.time.ZoneOffset;
import java.time.DateTimeException;
import java.util.*;

public final class SearchSpecifications {
    private SearchSpecifications() {}
    private static final Set<String> LAB_SORT = Set.of("id", "name", "creationDate", "minimalPoint", "difficulty",
            "coordinates.x", "coordinates.y", "discipline.id", "discipline.name", "discipline.practiceHours", "discipline.labsCount");
    private static final Set<String> DISCIPLINE_SORT = Set.of("id", "name", "practiceHours", "labsCount");

    public static Specification<LabWork> labs(LabWorkSearchRequestDto r) {
        rangeValid("x", r.getXFrom(), r.getXTo()); rangeValid("y", r.getYFrom(), r.getYTo());
        rangeValid("minimalPoint", r.getMinimalPointFrom(), r.getMinimalPointTo());
        rangeValid("creationDate", r.getCreationDateFrom(), r.getCreationDateTo());
        rangeValid("disciplinePracticeHours", r.getDisciplinePracticeHoursFrom(), r.getDisciplinePracticeHoursTo());
        rangeValid("disciplineLabsCount", r.getDisciplineLabsCountFrom(), r.getDisciplineLabsCountTo());
        if ((r.getYFrom() != null && !Double.isFinite(r.getYFrom())) ||
                (r.getYTo() != null && !Double.isFinite(r.getYTo()))) invalid("Координата y должна быть конечным числом");
        boolean disciplineFilter = r.getDisciplineIds() != null || nonblank(r.getDisciplineName()) ||
                r.getDisciplinePracticeHoursFrom() != null || r.getDisciplinePracticeHoursTo() != null ||
                r.getDisciplineLabsCountFrom() != null || r.getDisciplineLabsCountTo() != null;
        if (Boolean.FALSE.equals(r.getHasDiscipline()) && disciplineFilter) invalid("Фильтры дисциплины противоречат hasDiscipline=false");
        if (Boolean.FALSE.equals(r.getHasDifficulty()) && r.getDifficulty() != null) invalid("difficulty противоречит hasDifficulty=false");
        var orders = sort(r, r.getSortType(), LAB_SORT);
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (r.getId() != null) p.add(root.get("id").in(r.getId()));
            contains(p, cb, root.get("name"), r.getName());
            range(p, cb, root.get("coordinates").get("x"), r.getXFrom(), r.getXTo());
            range(p, cb, root.get("coordinates").get("y"), r.getYFrom(), r.getYTo());
            range(p, cb, root.get("minimalPoint"), r.getMinimalPointFrom(), r.getMinimalPointTo());
            if (r.getCreationDateFrom() != null) p.add(cb.greaterThanOrEqualTo(root.get("creationDate"), r.getCreationDateFrom().atStartOfDay(ZoneOffset.UTC)));
            if (r.getCreationDateTo() != null) {
                try { p.add(cb.lessThan(root.get("creationDate"), r.getCreationDateTo().plusDays(1).atStartOfDay(ZoneOffset.UTC))); }
                catch (DateTimeException e) { invalid("Некорректная верхняя граница даты"); }
            }
            if (r.getDifficulty() != null) p.add(cb.equal(root.get("difficulty"), r.getDifficulty()));
            nullable(p, cb, root.get("difficulty"), r.getHasDifficulty());
            nullable(p, cb, root.get("discipline"), r.getHasDiscipline());
            if (disciplineFilter) {
                var discipline = root.join("discipline", JoinType.LEFT);
                if (r.getDisciplineIds() != null) p.add(discipline.get("id").in(r.getDisciplineIds()));
                contains(p, cb, discipline.get("name"), r.getDisciplineName());
                range(p, cb, discipline.get("practiceHours"), r.getDisciplinePracticeHoursFrom(), r.getDisciplinePracticeHoursTo());
                range(p, cb, discipline.get("labsCount"), r.getDisciplineLabsCountFrom(), r.getDisciplineLabsCountTo());
            }
            order(root, query, cb, orders);
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    public static Specification<Discipline> disciplines(DisciplineSearchRequestDto r) {
        rangeValid("practiceHours", r.getPracticeHoursFrom(), r.getPracticeHoursTo());
        rangeValid("labsCount", r.getLabsCountFrom(), r.getLabsCountTo());
        var orders = sort(r, r.getSortDirection(), DISCIPLINE_SORT);
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (r.getIds() != null) p.add(root.get("id").in(r.getIds()));
            contains(p, cb, root.get("name"), r.getName());
            range(p, cb, root.get("practiceHours"), r.getPracticeHoursFrom(), r.getPracticeHoursTo());
            range(p, cb, root.get("labsCount"), r.getLabsCountFrom(), r.getLabsCountTo());
            order(root, query, cb, orders);
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    private static List<PageOptions.SortCriterion> sort(PageOptions r, String direction, Set<String> fields) {
        List<PageOptions.SortCriterion> result = new ArrayList<>(r.getSort() == null ?
                List.of(new PageOptions.SortCriterion(r.getSortBy(), direction)) : r.getSort());
        Set<String> used = new HashSet<>();
        for (var item : result) {
            if (!fields.contains(item.field())) invalid("Недопустимое поле сортировки: " + item.field());
            if (!used.add(item.field())) invalid("Повтор поля сортировки: " + item.field());
        }
        if (!used.contains("id")) result.add(new PageOptions.SortCriterion("id", "asc"));
        return result;
    }

    private static void order(Root<?> root, CriteriaQuery<?> query, CriteriaBuilder cb, List<PageOptions.SortCriterion> fields) {
        if (query == null || query.getResultType() == Long.class || query.getResultType() == long.class) return;
        List<Order> orders = new ArrayList<>();
        for (var item : fields) {
            Expression<?> path;
            if (item.field().equals("difficulty")) {
                path = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("difficulty"), Difficulty.VERY_EASY), 1)
                        .when(cb.equal(root.get("difficulty"), Difficulty.EASY), 2)
                        .when(cb.equal(root.get("difficulty"), Difficulty.VERY_HARD), 3)
                        .when(cb.equal(root.get("difficulty"), Difficulty.TERRIBLE), 4).otherwise((Integer) null);
            } else if (item.field().startsWith("discipline.")) {
                path = root.join("discipline", JoinType.LEFT).get(item.field().substring("discipline.".length()));
            } else {
                Path<?> resolved = root;
                for (String part : item.field().split("\\.")) resolved = resolved.get(part);
                path = resolved;
            }
            orders.add(cb.asc(cb.<Integer>selectCase().when(cb.isNull(path), 1).otherwise(0)));
            orders.add(item.direction().equalsIgnoreCase("desc") ? cb.desc(path) : cb.asc(path));
        }
        query.orderBy(orders);
    }

    private static void contains(List<Predicate> p, CriteriaBuilder cb, Expression<String> path, String value) {
        if (nonblank(value)) {
            String escaped = value.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            p.add(cb.like(cb.lower(path), "%" + escaped + "%", '\\'));
        }
    }
    private static <T extends Comparable<? super T>> void range(List<Predicate> p, CriteriaBuilder cb, Expression<T> path, T from, T to) {
        if (from != null) p.add(cb.greaterThanOrEqualTo(path, from));
        if (to != null) p.add(cb.lessThanOrEqualTo(path, to));
    }
    private static void nullable(List<Predicate> p, CriteriaBuilder cb, Expression<?> path, Boolean present) {
        if (present != null) p.add(present ? cb.isNotNull(path) : cb.isNull(path));
    }
    private static <T extends Comparable<? super T>> void rangeValid(String field, T from, T to) {
        if (from != null && to != null && from.compareTo(to) > 0) invalid(field + ": нижняя граница больше верхней");
    }
    private static boolean nonblank(String value) { return value != null && !value.isBlank(); }
    private static void invalid(String message) { throw new InvalidSearchException(message); }
}
