package org.example.labs.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.example.labs.dto.request.DisciplineRequestDto;
import org.example.labs.dto.response.DisciplineResponseDto;
import org.example.labs.service.DisciplineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/disciplines")
public class DisciplineController {

    private final DisciplineService disciplineService;

    @Autowired
    public DisciplineController(DisciplineService disciplineService) {
        this.disciplineService = disciplineService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DisciplineResponseDto create(@Valid @RequestBody DisciplineRequestDto request) {
        return disciplineService.saveDiscipline(request);
    }

    @GetMapping("/{id}")
    public DisciplineResponseDto getById( @Positive @PathVariable("id") Long id) {
        return disciplineService.getDiscipline(id);
    }

    @PutMapping("/{id}")
    public DisciplineResponseDto update( @Positive @PathVariable("id") Long id, @Valid @RequestBody DisciplineRequestDto request) {
        return disciplineService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Positive @PathVariable("id") Long id) {
        disciplineService.delete(id);
    }
}