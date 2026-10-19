package org.example.labs.exceptions;

public class DisciplineInUseException extends RuntimeException {
    public DisciplineInUseException(String message) {
        super(message);
    }
}