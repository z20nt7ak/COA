package org.example.mapper;

import javax.annotation.processing.Generated;
import org.example.dto.request.DisciplineRequestDto;
import org.example.dto.responce.DisciplineResponseDto;
import org.example.models.Discipline;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-18T20:40:28+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (Eclipse Adoptium)"
)
@Component
public class DisciplineMapperImpl implements DisciplineMapper {

    @Override
    public Discipline toEntity(DisciplineRequestDto dto) {
        if ( dto == null ) {
            return null;
        }

        Discipline discipline = new Discipline();

        discipline.setName( dto.getName() );
        if ( dto.getPracticeHours() != null ) {
            discipline.setPracticeHours( dto.getPracticeHours() );
        }
        discipline.setLabsCount( dto.getLabsCount() );

        return discipline;
    }

    @Override
    public DisciplineResponseDto toDto(Discipline discipline) {
        if ( discipline == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        long practiceHours = 0L;
        Long labsCount = null;

        id = discipline.getId();
        name = discipline.getName();
        practiceHours = discipline.getPracticeHours();
        labsCount = discipline.getLabsCount();

        DisciplineResponseDto disciplineResponseDto = new DisciplineResponseDto( id, name, practiceHours, labsCount );

        return disciplineResponseDto;
    }
}
