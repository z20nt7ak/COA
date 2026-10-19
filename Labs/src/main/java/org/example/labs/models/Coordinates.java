package org.example.labs.models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Embeddable
public class Coordinates {

    @Column(name = "coordinate_x", nullable = false)
    private int x;

    @Column(name = "coordinate_y", nullable = false)
    private Double y;
}