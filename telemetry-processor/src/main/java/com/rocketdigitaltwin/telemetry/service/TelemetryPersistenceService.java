package com.rocketdigitaltwin.telemetry.service;

import com.rocketdigitaltwin.telemetry.dto.TelemetryV1;
import com.rocketdigitaltwin.telemetry.entity.TelemetryEntity;
import com.rocketdigitaltwin.telemetry.repository.TelemetryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TelemetryPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryPersistenceService.class);
    
    private final TelemetryRepository repository;
    
    public TelemetryPersistenceService(TelemetryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TelemetryV1 save(TelemetryV1 telemetry) {
        try {
            TelemetryEntity entity = toEntity(telemetry);
            TelemetryEntity saved = repository.save(entity);
            log.debug("Persisted telemetry: id={}, flightId={}, tPlusMs={}",
                    saved.getId(), saved.getFlightId(), saved.getTPlusMs());
            
            // Return with generated ID
            return toDto(saved);
        } catch (Exception e) {
            log.error("Error persisting telemetry: flightId={}, error={}",
                    telemetry.getFlightId(), e.getMessage());
            throw e;
        }
    }

    private TelemetryEntity toEntity(TelemetryV1 dto) {
        return TelemetryEntity.builder()
                .eventId(dto.getEventId())
                .flightId(dto.getFlightId())
                .timestamp(dto.getTimestamp())
                .tPlusMs(dto.getTPlusMs())
                .stage(dto.getStage())
                .altitudeM(dto.getAltitudeM())
                .velocityMS(dto.getVelocityMS())
                .thrustN(dto.getThrustN())
                .propellantKg(dto.getPropellantKg())
                .throttle(dto.getThrottle())
                .phase(dto.getPhase())
                .isValid(dto.getIsValid())
                .validationErrors(dto.getValidationErrors())
                .processedAt(dto.getProcessedAt())
                .version(dto.getVersion())
                .build();
    }

    private TelemetryV1 toDto(TelemetryEntity entity) {
        return TelemetryV1.builder()
                .id(entity.getId())
                .eventId(entity.getEventId())
                .flightId(entity.getFlightId())
                .timestamp(entity.getTimestamp())
                .tPlusMs(entity.getTPlusMs())
                .stage(entity.getStage())
                .altitudeM(entity.getAltitudeM())
                .velocityMS(entity.getVelocityMS())
                .thrustN(entity.getThrustN())
                .propellantKg(entity.getPropellantKg())
                .throttle(entity.getThrottle())
                .phase(entity.getPhase())
                .isValid(entity.getIsValid())
                .validationErrors(entity.getValidationErrors())
                .processedAt(entity.getProcessedAt())
                .version(entity.getVersion())
                .build();
    }
}
