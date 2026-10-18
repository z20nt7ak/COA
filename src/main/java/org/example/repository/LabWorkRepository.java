package org.example.repository;

import org.example.models.LabWork;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabWorkRepository extends JpaRepository<LabWork, Long> {
}