package org.example.bars.service;

import org.example.bars.client.LabsApiClient;
import org.example.bars.dto.DisciplineDto;
import org.example.bars.dto.LabWorkDto;
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
        LabWorkDto labWork = labsApiClient.getLabWork(labWorkId);
        labsApiClient.updateLabWork(labWorkId, withDiscipline(labWork, new DisciplineDto(disciplineId)));
    }

    public void removeLabWork(long disciplineId, long labWorkId) {
        LabWorkDto labWork = labsApiClient.getLabWork(labWorkId);
        labsApiClient.updateLabWork(labWorkId, withDiscipline(labWork, null));
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