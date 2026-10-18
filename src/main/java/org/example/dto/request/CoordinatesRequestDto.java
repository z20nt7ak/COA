package org.example.dto.request;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CoordinatesRequestDto {
    @NotNull
    Integer x;
    @NotNull
    Double y;
}