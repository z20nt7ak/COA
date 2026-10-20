package org.example.bars.client;

import org.example.bars.dto.LabWorkDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class LabsApiClient {

    private final RestClient labsRestClient;

    @Autowired
    public LabsApiClient(RestClient labsRestClient) {
        this.labsRestClient = labsRestClient;
    }

    public LabWorkDto getLabWork(long id) {
        return labsRestClient.get()
                .uri("/lab-works/{id}", id)
                .retrieve()
                .body(LabWorkDto.class);
    }

    public void checkDisciplineExists(long id) {
        labsRestClient.get()
                .uri("/disciplines/{id}", id)
                .retrieve()
                .toBodilessEntity();
    }

    public void updateLabWork(long id, LabWorkDto labWork) {
        labsRestClient.put()
                .uri("/lab-works/{id}", id)
                .body(labWork)
                .retrieve()
                .toBodilessEntity();
    }
}