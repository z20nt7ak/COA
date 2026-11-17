package org.example.labs.validation;

import java.time.LocalDate;

public final class Limits {
    public static final int NAME_MAX_LENGTH = 100;
    public static final String NAME_BLANK_MESSAGE = "Название не может быть пустым";
    public static final String NAME_LENGTH_MESSAGE = "Название должно быть не длиннее " + NAME_MAX_LENGTH + " символов";

    public static final int MIN_POINT_MIN = 1;
    public static final int MIN_POINT_MAX = 100;
    public static final String MIN_POINT_MESSAGE =
            "Минимальный балл должен быть от " + MIN_POINT_MIN + " до " + MIN_POINT_MAX;

    public static final int COORDINATE_MIN = -1000;
    public static final int COORDINATE_MAX = 1000;
    public static final String COORDINATE_MIN_DECIMAL = "" + COORDINATE_MIN;
    public static final String COORDINATE_MAX_DECIMAL = "" + COORDINATE_MAX;
    public static final int COORDINATE_Y_INTEGER_DIGITS = 4;
    public static final int COORDINATE_Y_FRACTION_DIGITS = 2;
    public static final String COORDINATE_X_MESSAGE =
            "Координата X должна быть от " + COORDINATE_MIN + " до " + COORDINATE_MAX;
    public static final String COORDINATE_Y_MESSAGE =
            "Координата Y должна быть от " + COORDINATE_MIN + " до " + COORDINATE_MAX;
    public static final String COORDINATE_Y_FRACTION_MESSAGE =
            "Координата Y может содержать не больше " + COORDINATE_Y_FRACTION_DIGITS + " знаков после запятой";

    public static final long PRACTICE_HOURS_MIN = 0;
    public static final long PRACTICE_HOURS_MAX = 500;
    public static final String PRACTICE_HOURS_MESSAGE =
            "Часы практики должны быть от " + PRACTICE_HOURS_MIN + " до " + PRACTICE_HOURS_MAX;

    public static final String LABS_COUNT_MESSAGE = "Количество работ не может быть отрицательным";

    public static final int IDS_MAX = 1000;
    public static final String IDS_SIZE_MESSAGE = "Список ID должен содержать от 1 до " + IDS_MAX + " значений";
    public static final String DISCIPLINE_IDS_SIZE_MESSAGE = "Список ID дисциплин должен содержать от 1 до " + IDS_MAX + " значений";

    public static final int CREATION_YEAR_MIN = 2000;
    public static final int CREATION_YEAR_MAX = 2100;
    public static final LocalDate CREATION_DATE_MIN = LocalDate.of(CREATION_YEAR_MIN, 1, 1);
    public static final LocalDate CREATION_DATE_MAX = LocalDate.of(CREATION_YEAR_MAX, 12, 31);
    public static final String CREATION_DATE_MESSAGE =
            "Дата создания должна быть в пределах с " + CREATION_YEAR_MIN + " по " + CREATION_YEAR_MAX + " год";

    private Limits() {}
}
