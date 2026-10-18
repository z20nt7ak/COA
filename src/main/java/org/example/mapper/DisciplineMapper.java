package org.example.mapper;

import org.example.dto.request.DisciplineRequestDto;
import org.example.dto.responce.DisciplineResponseDto;
import org.example.models.Discipline;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface DisciplineMapper {
    @Mapping(target = "id", ignore = true)
    Discipline toEntity(DisciplineRequestDto dto);
    DisciplineResponseDto toDto(Discipline discipline);
}

