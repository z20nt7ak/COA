package org.example.models;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.enums.Difficulty;

import java.time.ZonedDateTime;

@Getter
@Setter
@Entity
public class LabWork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Embedded
    private Coordinates coordinates;

    @Column(name = "creation_date", nullable = false)
    private ZonedDateTime creationDate;

    @Column(name = "minimal_point", nullable = false)
    private int minimalPoint;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty")
    private Difficulty difficulty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discipline_id", referencedColumnName = "id")
    private Discipline discipline;
}