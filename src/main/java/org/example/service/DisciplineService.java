package org.example.service;
import jakarta.persistence.EntityNotFoundException;
import org.example.dto.request.DisciplineRequestDto;
import org.example.dto.responce.DisciplineResponseDto;
import org.example.mapper.DisciplineMapper;
import org.example.models.Discipline;
import org.example.repository.DisciplineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
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
        discipline.setLabsCount(request.getLabsCount());
        Discipline saved = disciplineRepository.save(discipline);
        return disciplineMapper.toDto(saved);
    }

    public Discipline findDiscipline(Long id) {
        return disciplineRepository.findById(id).orElseThrow(() ->
                new EntityNotFoundException("Дисциплина с id=" + id + " не найдена"));
    }
}
