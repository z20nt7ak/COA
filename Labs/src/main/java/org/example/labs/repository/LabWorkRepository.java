package org.example.labs.repository;

import org.example.labs.models.LabWork;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabWorkRepository extends JpaRepository<LabWork, Long> {
}