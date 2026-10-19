package org.example.labs.mapper;

import org.example.labs.dto.request.DisciplineRequestDto;
import org.example.labs.dto.response.DisciplineResponseDto;
import org.example.labs.models.Discipline;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface DisciplineMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "labsCount", ignore = true)
    Discipline toEntity(DisciplineRequestDto dto);
    DisciplineResponseDto toDto(Discipline discipline);
}

