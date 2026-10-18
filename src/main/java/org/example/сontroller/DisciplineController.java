package org.example.сontroller;

import jakarta.validation.Valid;
import org.example.dto.request.DisciplineRequestDto;
import org.example.dto.responce.DisciplineResponseDto;
import org.example.service.DisciplineService;
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
    public DisciplineResponseDto getById(@PathVariable("id") Long id) {
        return disciplineService.getDiscipline(id);
    }

    @PutMapping("/{id}")
    public DisciplineResponseDto update(@PathVariable("id") Long id, @Valid @RequestBody DisciplineRequestDto request) {
        return disciplineService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        disciplineService.delete(id);
    }
}