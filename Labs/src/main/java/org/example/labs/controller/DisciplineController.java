package org.example.labs.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.example.labs.dto.request.DisciplineRequestDto;
import org.example.labs.dto.request.DisciplineSearchRequestDto;
import org.example.labs.dto.response.PageResponseDto;
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

    @GetMapping
    public List<DisciplineResponseDto> getAll() {
        return disciplineService.getDisciplines();
    }

    @PostMapping("/search")
    public PageResponseDto<DisciplineResponseDto> search(@Valid @RequestBody DisciplineSearchRequestDto request) {
        return disciplineService.search(request);
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
