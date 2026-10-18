package org.example.mapper;

import org.example.dto.request.CoordinatesRequestDto;
import org.example.dto.request.LabWorkRequestDto;
import org.example.dto.responce.LabWorkResponseDto;
import org.example.models.Coordinates;
import org.example.models.LabWork;
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