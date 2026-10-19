package org.example.bars.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.example.bars.dto.ErrorResponseDto;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(HandlerMethodValidationException e) {
        String message = e.getAllErrors().stream()
                .map(MessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDto> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return build(HttpStatus.BAD_REQUEST, "Параметр '" + e.getName() + "' имеет неверный формат");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNoResource(NoResourceFoundException e) {
        return build(HttpStatus.NOT_FOUND, "Ресурс не найден");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDto> handleMethod(HttpRequestMethodNotSupportedException e) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Метод " + e.getMethod() + " не поддерживается");
    }

    @ExceptionHandler(LabWorkNotInDisciplineException.class)
    public ResponseEntity<ErrorResponseDto> handleNotInDiscipline(LabWorkNotInDisciplineException e) {
        return build(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(HttpClientErrorException.NotFound.class)
    public ResponseEntity<ErrorResponseDto> handleLabsNotFound(HttpClientErrorException.NotFound e) {
        return build(HttpStatus.NOT_FOUND, "Лабораторная работа или дисциплина не найдена");
    }

    @ExceptionHandler(HttpStatusCodeException.class)
    public ResponseEntity<ErrorResponseDto> handleLabsError(HttpStatusCodeException e) {
        log.warn("Labs вернул ошибку: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
        return build(HttpStatus.BAD_GATEWAY, "Первый сервис вернул ошибку " + e.getStatusCode().value());
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponseDto> handleLabsUnavailable(ResourceAccessException e) {
        log.error("Labs недоступен", e);
        return build(HttpStatus.SERVICE_UNAVAILABLE, "Первый сервис недоступен");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleOther(Exception e) {
        log.error("Необработанная ошибка", e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Внутренняя ошибка сервера");
    }

    private ResponseEntity<ErrorResponseDto> build(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(new ErrorResponseDto(status.value(), status.getReasonPhrase(), message));
    }
}