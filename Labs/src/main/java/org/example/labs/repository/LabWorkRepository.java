package org.example.labs.repository;

import org.example.labs.models.LabWork;
import org.example.labs.dto.response.NameGroupResponseDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface LabWorkRepository extends JpaRepository<LabWork, Long>, JpaSpecificationExecutor<LabWork> {
    @Override
    @EntityGraph(attributePaths = "discipline")
    Page<LabWork> findAll(Specification<LabWork> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "discipline")
    List<LabWork> findAll(Sort sort);

    @EntityGraph(attributePaths = "discipline")
    Optional<LabWork> findFirstByOrderByIdAsc();

    @EntityGraph(attributePaths = "discipline")
    @Query("""
            select l from LabWork l
            where l.difficulty is not null
            order by case
                when l.difficulty = org.example.labs.enums.Difficulty.TERRIBLE then 4
                when l.difficulty = org.example.labs.enums.Difficulty.VERY_HARD then 3
                when l.difficulty = org.example.labs.enums.Difficulty.EASY then 2
                when l.difficulty = org.example.labs.enums.Difficulty.VERY_EASY then 1
                else 0 end desc, l.id asc
            """)
    List<LabWork> findByMaximumDifficulty(Pageable pageable);

    @Query("""
            select new org.example.labs.dto.response.NameGroupResponseDto(l.name, count(l))
            from LabWork l group by l.name order by l.name asc
            """)
    List<NameGroupResponseDto> countGroupedByName();
}
