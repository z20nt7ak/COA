package org.example.labs.exceptions;

public class DisciplineNotExistsException extends RuntimeException {
    public DisciplineNotExistsException(String message) {
        super(message);
    }
}