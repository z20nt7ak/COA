package org.example.labs.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.labs.dto.request.DisciplineRequestDto;
import org.example.labs.dto.response.DisciplineResponseDto;
import org.example.labs.exceptions.DisciplineInUseException;
import org.example.labs.mapper.DisciplineMapper;
import org.example.labs.models.Discipline;
import org.example.labs.repository.DisciplineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DisciplineService {

    private final DisciplineRepository disciplineRepository;

    private final DisciplineMapper disciplineMapper;

    @Autowired
    public DisciplineService(DisciplineRepository disciplineRepository, DisciplineMapper disciplineMapper) {
        this.disciplineRepository = disciplineRepository;
        this.disciplineMapper = disciplineMapper;

    }

    public DisciplineResponseDto saveDiscipline(DisciplineRequestDto requestDto) {
        Discipline discipline = disciplineMapper.toEntity(requestDto);
        disciplineRepository.save(discipline);
        return disciplineMapper.toDto(discipline);
    }

    public void delete(Long id) {
        Discipline discipline = findDiscipline(id);
        if (discipline.getLabsCount() > 0) {
            throw new DisciplineInUseException("Нельзя удалить дисциплину id=" + id
                    + ": к ней привязано лабораторных: " + discipline.getLabsCount());
        }
        disciplineRepository.delete(discipline);
    }

    public DisciplineResponseDto getDiscipline(Long id) {
        Discipline discipline = findDiscipline(id);
        return disciplineMapper.toDto(discipline);
    }

    public DisciplineResponseDto update(Long id, DisciplineRequestDto request) {
        Discipline discipline = findDiscipline(id);
        discipline.setName(request.getName());
        discipline.setPracticeHours(request.getPracticeHours());
        Discipline saved = disciplineRepository.save(discipline);
        return disciplineMapper.toDto(saved);
    }

    public Discipline findDiscipline(Long id) {
        return disciplineRepository.findById(id).orElseThrow(() ->
                new EntityNotFoundException("Дисциплина с id=" + id + " не найдена"));
    }

    public void changeLabsCount(Discipline discipline, int numberOfLabs) {
        if (discipline != null) {
            discipline.setLabsCount(discipline.getLabsCount() + numberOfLabs);
        }
    }


}
