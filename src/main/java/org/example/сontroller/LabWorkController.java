package org.example.сontroller;

import jakarta.validation.Valid;
import org.example.dto.request.LabWorkRequestDto;
import org.example.dto.responce.LabWorkResponseDto;
import org.example.service.LabWorkService;
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
    public LabWorkResponseDto getById(@PathVariable("id") Long id) {
        return labWorkService.getLabWork(id);
    }

    @PutMapping("/{id}")
    public LabWorkResponseDto update(@PathVariable("id") Long id, @Valid @RequestBody LabWorkRequestDto request) {
        return labWorkService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        labWorkService.delete(id);
    }
}