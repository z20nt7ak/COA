package org.example.labs.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.mapper.LabWorkMapper;
import org.example.labs.models.LabWork;
import org.example.labs.repository.LabWorkRepository;
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
        disciplineService.changeLabsCount(labWork.getDiscipline(), +1);
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
        disciplineService.changeLabsCount(labWork.getDiscipline(), -1);
        labWork.setDiscipline(request.getDiscipline() == null ? null :
                disciplineService.findDiscipline(request.getDiscipline().getId()));
        disciplineService.changeLabsCount(labWork.getDiscipline(), +1);
        LabWork saved = labWorkRepository.save(labWork);
        return labWorkMapper.toDto(saved);
    }

    public void delete(Long id) {
        LabWork labWork = findLabWork(id);
        disciplineService.changeLabsCount(labWork.getDiscipline(), -1);
        labWorkRepository.delete(labWork);
    }

    private LabWork findLabWork(Long id) {
        return labWorkRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лабораторная работа с id=" + id + " не найдена"));
    }
}