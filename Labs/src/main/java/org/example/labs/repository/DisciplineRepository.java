package org.example.labs.repository;

import org.example.labs.models.Discipline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

public interface DisciplineRepository extends JpaRepository<Discipline, Long>, JpaSpecificationExecutor<Discipline> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Discipline d where d.id = :id")
    Optional<Discipline> lockById(@Param("id") long id);

}
