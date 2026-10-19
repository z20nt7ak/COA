package org.example.labs.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.service.LabWorkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lab-works")
public class LabWorkController {

    private final LabWorkService labWorkService;

    @Autowired
    public LabWorkController(LabWorkService labWorkService) {
        this.labWorkService = labWorkService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LabWorkResponseDto create(@Valid @RequestBody LabWorkRequestDto request) {
        return labWorkService.saveLabWork(request);
    }

    @GetMapping("/{id}")
    public LabWorkResponseDto getById( @Positive @PathVariable("id") Long id) {
        return labWorkService.getLabWork(id);
    }

    @PutMapping("/{id}")
    public LabWorkResponseDto update(@Positive @PathVariable("id") Long id, @Valid @RequestBody LabWorkRequestDto request) {
        return labWorkService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Positive @PathVariable("id") Long id) {
        labWorkService.delete(id);
    }
}