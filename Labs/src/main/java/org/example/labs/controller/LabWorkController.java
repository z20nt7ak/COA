package org.example.labs.controller;

import jakarta.validation.Valid;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.request.LabWorkSearchRequestDto;
import org.example.labs.dto.response.PageResponseDto;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.dto.response.NameGroupResponseDto;
import java.util.List;
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

    @GetMapping
    public List<LabWorkResponseDto> getAll() {
        return labWorkService.getLabWorks();
    }

    @PostMapping("/search")
    public PageResponseDto<LabWorkResponseDto> search(@Valid @RequestBody LabWorkSearchRequestDto request) {
        return labWorkService.search(request);
    }

    @GetMapping("/by-min-id")
    public LabWorkResponseDto getByMinId() {
        return labWorkService.getByMinId();
    }

    @GetMapping("/by-max-difficulty")
    public LabWorkResponseDto getByMaxDifficulty() {
        return labWorkService.getByMaxDifficulty();
    }

    @GetMapping("/group-by-name")
    public List<NameGroupResponseDto> groupByName() {
        return labWorkService.groupByName();
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
