package com.rocketdigitaltwin.telemetry.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rocketdigitaltwin.telemetry.dto.TelemetryRaw;
import com.rocketdigitaltwin.telemetry.dto.TelemetryV1;
import com.rocketdigitaltwin.telemetry.service.TelemetryPersistenceService;
import com.rocketdigitaltwin.telemetry.service.TelemetryValidationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
public class TelemetryConsumer {

    private static final Logger log = LoggerFactory.getLogger(TelemetryConsumer.class);
    
    private final TelemetryValidationService validationService;
    private final TelemetryPersistenceService persistenceService;
    private final TelemetryProducer producer;
    private final ObjectMapper objectMapper;
    
    public TelemetryConsumer(TelemetryValidationService validationService,
                             TelemetryPersistenceService persistenceService,
                             TelemetryProducer producer,
                             ObjectMapper objectMapper) {
        this.validationService = validationService;
        this.persistenceService = persistenceService;
        this.producer = producer;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.raw-telemetry}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment
    ) {
        try {
            log.debug("Received message from partition {} at offset {}", partition, offset);

            // Parse raw telemetry
            TelemetryRaw raw = objectMapper.readValue(message, TelemetryRaw.class);

            // Validate and normalize
            TelemetryV1 normalized = validationService.validateAndNormalize(raw);

            // Persist to database
            TelemetryV1 saved = persistenceService.save(normalized);

            // Produce to v1 topic
            producer.send(saved);

            // Acknowledge message
            acknowledgment.acknowledge();

            if (!normalized.getIsValid()) {
                log.warn("Invalid telemetry processed: flightId={}, errors={}",
                        normalized.getFlightId(), normalized.getValidationErrors());
            }

        } catch (Exception e) {
            log.error("Error processing telemetry message at offset {}: {}",
                    offset, e.getMessage(), e);
            // Don't acknowledge - message will be retried
        }
    }
}
