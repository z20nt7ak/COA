package org.example.labs.mapper;

import org.example.labs.dto.request.CoordinatesRequestDto;
import org.example.labs.dto.request.LabWorkRequestDto;
import org.example.labs.dto.response.LabWorkResponseDto;
import org.example.labs.models.Coordinates;
import org.example.labs.models.LabWork;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface LabWorkMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "discipline", ignore = true)
    LabWork toEntity(LabWorkRequestDto dto);
    LabWorkResponseDto toDto(LabWork labWork);
    Coordinates toCoordinates(CoordinatesRequestDto dto);
}