package org.example.service;
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
}
