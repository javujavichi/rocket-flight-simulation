package com.rocketdigitaltwin.telemetry.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rocketdigitaltwin.telemetry.dto.TelemetryV1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class TelemetryProducer {

    private static final Logger log = LoggerFactory.getLogger(TelemetryProducer.class);
    
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.normalized-telemetry}")
    private String topic;
    
    public TelemetryProducer(KafkaTemplate<String, String> kafkaTemplate,
                             ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void send(TelemetryV1 telemetry) {
        try {
            String payload = objectMapper.writeValueAsString(telemetry);
            String key = telemetry.getFlightId() + "-" + telemetry.getTPlusMs();

            CompletableFuture<SendResult<String, String>> future =
                    kafkaTemplate.send(topic, key, payload);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.debug("Published to {}: flightId={}, tPlusMs={}, partition={}, offset={}",
                            topic,
                            telemetry.getFlightId(),
                            telemetry.getTPlusMs(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                } else {
                    log.error("Failed to publish telemetry: flightId={}, error={}",
                            telemetry.getFlightId(), ex.getMessage());
                }
            });

        } catch (Exception e) {
            log.error("Error serializing telemetry: {}", e.getMessage(), e);
        }
    }
}
