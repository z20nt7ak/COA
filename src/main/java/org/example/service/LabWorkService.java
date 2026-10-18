package org.example.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.dto.request.LabWorkRequestDto;
import org.example.dto.responce.LabWorkResponseDto;
import org.example.mapper.LabWorkMapper;
import org.example.models.LabWork;
import org.example.repository.LabWorkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
@Transactional
public class LabWorkService {

    private final LabWorkRepository labWorkRepository;
    private final LabWorkMapper labWorkMapper;
    private final DisciplineService disciplineService;

    @Autowired
    public LabWorkService(
            LabWorkRepository labWorkRepository,
            LabWorkMapper labWorkMapper,
            DisciplineService disciplineService
    ) {
        this.labWorkRepository = labWorkRepository;
        this.labWorkMapper = labWorkMapper;
        this.disciplineService = disciplineService;
    }

    public LabWorkResponseDto saveLabWork(LabWorkRequestDto requestDto) {
        LabWork labWork = labWorkMapper.toEntity(requestDto);
        labWork.setCreationDate(ZonedDateTime.now());
        labWork.setDiscipline(requestDto.getDiscipline() == null ? null :
                disciplineService.findDiscipline(requestDto.getDiscipline().getId()));
        LabWork saved = labWorkRepository.save(labWork);
        return labWorkMapper.toDto(saved);
    }

    public LabWorkResponseDto getLabWork(Long id) {
        LabWork labWork = findLabWork(id);
        return labWorkMapper.toDto(labWork);
    }

    public LabWorkResponseDto update(Long id, LabWorkRequestDto request) {
        LabWork labWork = findLabWork(id);
        labWork.setName(request.getName());
        labWork.setCoordinates(labWorkMapper.toCoordinates(request.getCoordinates()));
        labWork.setMinimalPoint(request.getMinimalPoint());
        labWork.setDifficulty(request.getDifficulty());
        labWork.setDiscipline(request.getDiscipline() == null ? null :
                disciplineService.findDiscipline(request.getDiscipline().getId()));
        LabWork saved = labWorkRepository.save(labWork);
        return labWorkMapper.toDto(saved);
    }

    public void delete(Long id) {
        LabWork labWork = findLabWork(id);
        labWorkRepository.delete(labWork);
    }

    private LabWork findLabWork(Long id) {
        return labWorkRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лабораторная работа с id=" + id + " не найдена"));
    }
}