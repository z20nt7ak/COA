package org.example.labs.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "disciplines")
public class Discipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "practice_hours", nullable = false)
    private long practiceHours;

    @Column(name = "labs_count", nullable = false)
    private Long labsCount = 0L;
}