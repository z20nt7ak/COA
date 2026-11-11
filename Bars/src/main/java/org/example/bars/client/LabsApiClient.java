package org.example.bars.client;

import org.springframework.http.HttpMethod;
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

    public void changeLink(long labWorkId, long disciplineId, boolean add) {
        labsRestClient.method(add ? HttpMethod.PUT : HttpMethod.DELETE)
                .uri("/lab-works/{id}/discipline/{disciplineId}", labWorkId, disciplineId)
                .retrieve()
                .toBodilessEntity();
    }
}
