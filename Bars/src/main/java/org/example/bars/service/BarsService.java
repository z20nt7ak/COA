package org.example.bars.service;

import org.example.bars.client.LabsApiClient;
import org.example.bars.exceptions.InvalidIdException;
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
        labsApiClient.changeLink(labWorkId, disciplineId, true);
    }

    public void removeLabWork(long disciplineId, long labWorkId) {
        checkId(disciplineId);
        checkId(labWorkId);
        labsApiClient.changeLink(labWorkId, disciplineId, false);
    }

    private void checkId(long id) {
        if (id <= 0) {
            throw new InvalidIdException("Некорректный id: " + id);
        }
    }
}
