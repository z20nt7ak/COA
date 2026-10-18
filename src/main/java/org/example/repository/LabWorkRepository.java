package org.example.repository;


import org.example.models.Discipline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabWorkRepository extends JpaRepository<Discipline, Long> {
}