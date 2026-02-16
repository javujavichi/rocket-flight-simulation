package com.rocketdigitaltwin.telemetry.service;

import com.rocketdigitaltwin.telemetry.dto.TelemetryRaw;
import com.rocketdigitaltwin.telemetry.dto.TelemetryV1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class TelemetryValidationService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryValidationService.class);

    @Value("${app.validation.max-altitude-m}")
    private Double maxAltitude;

    @Value("${app.validation.max-velocity-ms}")
    private Double maxVelocity;

    @Value("${app.validation.max-thrust-n}")
    private Double maxThrust;

    @Value("${app.validation.max-propellant-kg}")
    private Double maxPropellant;

    /**
     * Validates and normalizes raw telemetry to V1 contract
     */
    public TelemetryV1 validateAndNormalize(TelemetryRaw raw) {
        List<String> errors = new ArrayList<>();
        boolean isValid = true;

        // Validate required fields
        if (raw.getFlightId() == null || raw.getFlightId().isBlank()) {
            errors.add("flightId is required");
            isValid = false;
        }

        if (raw.getTPlusMs() == null || raw.getTPlusMs() < 0) {
            errors.add("tPlusMs must be >= 0");
            isValid = false;
        }

        if (raw.getStage() == null || raw.getStage() < 1 || raw.getStage() > 2) {
            errors.add("stage must be 1 or 2");
            isValid = false;
        }

        // Validate ranges
        if (raw.getAltitudeM() != null) {
            if (raw.getAltitudeM() < 0) {
                errors.add("altitude must be >= 0");
                isValid = false;
            }
            if (raw.getAltitudeM() > maxAltitude) {
                errors.add("altitude exceeds maximum: " + maxAltitude);
                isValid = false;
            }
        }

        if (raw.getVerticalVelocityMS() != null && raw.getVerticalVelocityMS() > maxVelocity) {
            errors.add("velocity exceeds maximum: " + maxVelocity);
            isValid = false;
        }

        if (raw.getThrustN() != null) {
            if (raw.getThrustN() < 0) {
                errors.add("thrust must be >= 0");
                isValid = false;
            }
            if (raw.getThrustN() > maxThrust) {
                errors.add("thrust exceeds maximum: " + maxThrust);
                isValid = false;
            }
        }

        if (raw.getPropellantKg() != null) {
            if (raw.getPropellantKg() < 0) {
                errors.add("propellant must be >= 0");
                isValid = false;
            }
            if (raw.getPropellantKg() > maxPropellant) {
                errors.add("propellant exceeds maximum: " + maxPropellant);
                isValid = false;
            }
        }

        if (raw.getThrottle() != null && (raw.getThrottle() < 0 || raw.getThrottle() > 1)) {
            errors.add("throttle must be between 0 and 1");
            isValid = false;
        }

        // Determine flight phase
        String phase = determinePhase(raw);

        // Build normalized telemetry
        return TelemetryV1.builder()
                .eventId(raw.getEventId())
                .flightId(raw.getFlightId())
                .timestamp(parseTimestamp(raw.getTs()))
                .tPlusMs(raw.getTPlusMs())
                .stage(raw.getStage())
                .altitudeM(raw.getAltitudeM())
                .velocityMS(raw.getVerticalVelocityMS())
                .thrustN(raw.getThrustN())
                .propellantKg(raw.getPropellantKg())
                .throttle(raw.getThrottle())
                .phase(phase)
                .isValid(isValid)
                .validationErrors(errors.isEmpty() ? null : String.join("; ", errors))
                .processedAt(Instant.now())
                .version("v1")
                .build();
    }

    private String determinePhase(TelemetryRaw raw) {
        if (raw.getTPlusMs() == null) return "UNKNOWN";
        
        long t = raw.getTPlusMs();
        
        if (t < 1000) return "LIFTOFF";
        if (t < 55000) return "ASCENT_STAGE1";
        if (t < 80000) return "MAX_Q";
        if (t < 83000) return "STAGE_SEPARATION";
        if (t < 260000) return "ASCENT_STAGE2";
        if (t < 263000) return "ORBIT_INSERTION";
        return "ORBIT";
    }

    private Instant parseTimestamp(String ts) {
        try {
            return Instant.parse(ts);
        } catch (Exception e) {
            log.warn("Failed to parse timestamp: {}, using current time", ts);
            return Instant.now();
        }
    }
}
