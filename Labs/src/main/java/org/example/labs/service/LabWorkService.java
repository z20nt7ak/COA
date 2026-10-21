package org.example.labs.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.request.LabWorkSearchRequestDto;
import org.example.labs.dto.response.PageResponseDto;
import org.example.labs.search.SearchSpecifications;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.dto.response.NameGroupResponseDto;
import org.example.labs.exceptions.InvalidIdException;
import org.example.labs.mapper.LabWorkMapper;
import org.example.labs.models.LabWork;
import org.example.labs.repository.LabWorkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import java.time.ZonedDateTime;
import java.util.List;

@Service
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

    @Transactional
    public LabWorkResponseDto saveLabWork(LabWorkRequestDto requestDto) {
        LabWork labWork = labWorkMapper.toEntity(requestDto);
        labWork.setCreationDate(ZonedDateTime.now());
        labWork.setDiscipline(requestDto.getDiscipline() == null ? null :
                disciplineService.findDisciplineForLab(requestDto.getDiscipline().getId()));
        LabWork saved = labWorkRepository.save(labWork);
        disciplineService.changeLabsCount(labWork.getDiscipline(), +1);
        return labWorkMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LabWorkResponseDto> getLabWorks() {
        return labWorkRepository.findAll(Sort.by("name").ascending().and(Sort.by("id")))
                .stream().map(labWorkMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public PageResponseDto<LabWorkResponseDto> search(LabWorkSearchRequestDto request) {
        return PageResponseDto.from(labWorkRepository.findAll(SearchSpecifications.labs(request),
                PageRequest.of(request.getPage() - 1, request.getSize())).map(labWorkMapper::toDto));
    }

    public LabWorkResponseDto getLabWork(Long id) {
        LabWork labWork = findLabWork(id);
        return labWorkMapper.toDto(labWork);
    }

    @Transactional
    public LabWorkResponseDto update(Long id, LabWorkRequestDto request) {
        LabWork labWork = findLabWork(id);
        labWork.setName(request.getName());
        labWork.setCoordinates(labWorkMapper.toCoordinates(request.getCoordinates()));
        labWork.setMinimalPoint(request.getMinimalPoint());
        labWork.setDifficulty(request.getDifficulty());
        disciplineService.changeLabsCount(labWork.getDiscipline(), -1);
        labWork.setDiscipline(request.getDiscipline() == null ? null :
                disciplineService.findDisciplineForLab(request.getDiscipline().getId()));
        disciplineService.changeLabsCount(labWork.getDiscipline(), +1);
        LabWork saved = labWorkRepository.save(labWork);
        return labWorkMapper.toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        LabWork labWork = findLabWork(id);
        disciplineService.changeLabsCount(labWork.getDiscipline(), -1);
        labWorkRepository.delete(labWork);
    }

    @Transactional(readOnly = true)
    public LabWorkResponseDto getByMinId() {
        return labWorkRepository.findFirstByOrderByIdAsc()
                .map(labWorkMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Нет лабораторных работ"));
    }

    @Transactional(readOnly = true)
    public LabWorkResponseDto getByMaxDifficulty() {
        return labWorkRepository.findByMaximumDifficulty(PageRequest.of(0, 1)).stream()
                .findFirst().map(labWorkMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Нет лабораторных работ с заданной сложностью"));
    }

    @Transactional(readOnly = true)
    public List<NameGroupResponseDto> groupByName() {
        List<NameGroupResponseDto> groups = labWorkRepository.countGroupedByName();
        if (groups.isEmpty()) {
            throw new EntityNotFoundException("Нет лабораторных работ");
        }
        return groups;
    }

    private LabWork findLabWork(Long id) {
        if (id <= 0) {
            throw new InvalidIdException("Некорректный id");
        }
        return labWorkRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лабораторная работа с id=" + id + " не найдена"));
    }
}
