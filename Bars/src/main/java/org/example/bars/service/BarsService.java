package org.example.bars.service;

import org.example.bars.client.LabsApiClient;
import org.example.bars.dto.DisciplineDto;
import org.example.bars.dto.LabWorkDto;
import org.example.bars.exceptions.InvalidIdException;
import org.example.bars.exceptions.LabWorkAlreadyHasDisciplineException;
import org.example.bars.exceptions.LabWorkNotInDisciplineException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BarsService {

    private final LabsApiClient labsApiClient;

    @Autowired
    public BarsService(LabsApiClient labsApiClient) {
        this.labsApiClient = labsApiClient;
    }

    public void addLabWork(long disciplineId, long labWorkId) {
        checkId(disciplineId);
        checkId(labWorkId);
        labsApiClient.checkDisciplineExists(disciplineId);
        LabWorkDto labWork = labsApiClient.getLabWork(labWorkId);
        checkHasNoDiscipline(labWork, labWorkId);
        labsApiClient.updateLabWork(labWorkId, withDiscipline(labWork, new DisciplineDto(disciplineId)));
    }

    public void removeLabWork(long disciplineId, long labWorkId) {
        checkId(disciplineId);
        checkId(labWorkId);
        LabWorkDto labWork = labsApiClient.getLabWork(labWorkId);
        checkBelongsToDiscipline(labWork, disciplineId, labWorkId);
        labsApiClient.updateLabWork(labWorkId, withDiscipline(labWork, null));
    }

    private void checkId(long id) {
        if (id <= 0) {
            throw new InvalidIdException("Некорректный id: " + id);
        }
    }

    private void checkHasNoDiscipline(LabWorkDto labWork, long labWorkId) {
        if (labWork.discipline() != null) {
            throw new LabWorkAlreadyHasDisciplineException(
                    "У лабораторной id=" + labWorkId + " уже есть дисциплина id=" + labWork.discipline().id());
        }
    }

    private void checkBelongsToDiscipline(LabWorkDto labWork, long disciplineId, long labWorkId) {
        if (labWork.discipline() == null || labWork.discipline().id() != disciplineId) {
            throw new LabWorkNotInDisciplineException(
                    "Лабораторная id=" + labWorkId + " не относится к дисциплине id=" + disciplineId);
        }
    }

    private LabWorkDto withDiscipline(LabWorkDto labWork, DisciplineDto discipline) {
        return new LabWorkDto(
                labWork.name(),
                labWork.coordinates(),
                labWork.minimalPoint(),
                labWork.difficulty(),
                discipline
        );
    }
}