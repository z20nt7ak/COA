package org.example.bars.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Configuration
public class LabsClientConfig {

    @Bean
    public RestClient labsRestClient(@Value("${labs.api.url}") String labsUrl) {
        return RestClient.builder()
                .baseUrl(labsUrl)
                .build();
    }
}