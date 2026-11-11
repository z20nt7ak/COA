package org.example.labs.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.request.LabWorkSearchRequestDto;
import org.example.labs.dto.response.PageResponseDto;
import org.example.labs.search.SearchSpecifications;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.dto.response.NameGroupResponseDto;
import org.example.labs.exceptions.InvalidIdException;
import org.example.labs.exceptions.DisciplineNotExistsException;
import org.example.labs.mapper.LabWorkMapper;
import org.example.labs.models.LabWork;
import org.example.labs.models.Discipline;
import org.example.labs.repository.LabWorkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.util.Objects;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
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
        labWork.setCreationDate(ZonedDateTime.now(ZoneOffset.UTC));
        labWork.setDiscipline(requestDto.getDiscipline() == null ? null :
                disciplineService.lockDisciplineForLab(requestDto.getDiscipline().getId()));
        LabWork saved = labWorkRepository.save(labWork);
        disciplineService.changeLabsCount(labWork.getDiscipline(), +1);
        CommitLog.record("lab.create", saved.getId(), disciplineId(saved));
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

    @Transactional(readOnly = true)
    public LabWorkResponseDto getLabWork(Long id) {
        LabWork labWork = findLabWork(id);
        return labWorkMapper.toDto(labWork);
    }

    @Transactional
    public LabWorkResponseDto update(Long id, LabWorkRequestDto request) {
        LabWork labWork = lockLabWork(id);
        changeDiscipline(labWork, request.getDiscipline() == null ? null : request.getDiscipline().getId());
        labWork.setName(request.getName());
        labWork.setCoordinates(labWorkMapper.toCoordinates(request.getCoordinates()));
        labWork.setMinimalPoint(request.getMinimalPoint());
        labWork.setDifficulty(request.getDifficulty());

        LabWork saved = labWorkRepository.save(labWork);
        CommitLog.record("lab.update", id, disciplineId(saved));
        return labWorkMapper.toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        LabWork labWork = lockLabWork(id);
        Long previous = disciplineId(labWork);
        changeDiscipline(labWork, null);
        labWorkRepository.delete(labWork);
        CommitLog.record("lab.delete", id, previous);
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

    @Transactional
    public void changeLink(long labId, long disciplineId, boolean add) {
        if (disciplineId <= 0) throw new InvalidIdException("Некорректный id дисциплины");
        LabWork lab = lockLabWork(labId);
        Long current = disciplineId(lab);
        if (add && current != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "У работы уже есть дисциплина");
        }
        if (!add && !Objects.equals(current, disciplineId)) {
            throw new EntityNotFoundException("Работа не относится к указанной дисциплине");
        }
        try {
            changeDiscipline(lab, add ? disciplineId : null);
        } catch (DisciplineNotExistsException e) {
            throw new EntityNotFoundException(e.getMessage());
        }
        CommitLog.record(add ? "lab.link" : "lab.unlink", labId, disciplineId);
    }

    private static Long disciplineId(LabWork lab) {
        return lab.getDiscipline() == null ? null : lab.getDiscipline().getId();
    }

    private void changeDiscipline(LabWork lab, Long next) {
        Long previous = disciplineId(lab);
        if (Objects.equals(previous, next)) return;
        if (previous != null && next != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Сначала отвяжите работу от текущей дисциплины");
        }
        if (previous != null) {
            Discipline current = disciplineService.lockDisciplineForLab(previous);
            lab.setDiscipline(null);
            disciplineService.changeLabsCount(current, -1);
        } else {
            Discipline target = disciplineService.lockDisciplineForLab(next);
            lab.setDiscipline(target);
            disciplineService.changeLabsCount(target, 1);
        }
    }

    private LabWork lockLabWork(long id) {
        if (id <= 0) throw new InvalidIdException("Некорректный id");
        return labWorkRepository.lockById(id).orElseThrow(() ->
                new EntityNotFoundException("Лабораторная работа с id=" + id + " не найдена"));
    }

    private LabWork findLabWork(Long id) {
        if (id <= 0) {
            throw new InvalidIdException("Некорректный id");
        }
        return labWorkRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Лабораторная работа с id=" + id + " не найдена"));
    }
}
