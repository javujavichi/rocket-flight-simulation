package com.rocketdigitaltwin.telemetry.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "telemetry", indexes = {
        @Index(name = "idx_flight_id", columnList = "flight_id"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_t_plus_ms", columnList = "t_plus_ms")
})
public class TelemetryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "flight_id", nullable = false)
    private String flightId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "t_plus_ms", nullable = false)
    private Long tPlusMs;

    @Column(name = "stage")
    private Integer stage;

    @Column(name = "altitude_m")
    private Double altitudeM;

    @Column(name = "velocity_ms")
    private Double velocityMS;

    @Column(name = "thrust_n")
    private Double thrustN;

    @Column(name = "propellant_kg")
    private Double propellantKg;

    @Column(name = "throttle")
    private Double throttle;

    @Column(name = "phase")
    private String phase;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid;

    @Column(name = "validation_errors", length = 1000)
    private String validationErrors;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    @Column(name = "version", nullable = false)
    private String version;

    // Constructors
    public TelemetryEntity() {}

    private TelemetryEntity(Builder builder) {
        this.id = builder.id;
        this.eventId = builder.eventId;
        this.flightId = builder.flightId;
        this.timestamp = builder.timestamp;
        this.tPlusMs = builder.tPlusMs;
        this.stage = builder.stage;
        this.altitudeM = builder.altitudeM;
        this.velocityMS = builder.velocityMS;
        this.thrustN = builder.thrustN;
        this.propellantKg = builder.propellantKg;
        this.throttle = builder.throttle;
        this.phase = builder.phase;
        this.isValid = builder.isValid;
        this.validationErrors = builder.validationErrors;
        this.processedAt = builder.processedAt;
        this.version = builder.version;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Long getTPlusMs() { return tPlusMs; }
    public void setTPlusMs(Long tPlusMs) { this.tPlusMs = tPlusMs; }

    public Integer getStage() { return stage; }
    public void setStage(Integer stage) { this.stage = stage; }

    public Double getAltitudeM() { return altitudeM; }
    public void setAltitudeM(Double altitudeM) { this.altitudeM = altitudeM; }

    public Double getVelocityMS() { return velocityMS; }
    public void setVelocityMS(Double velocityMS) { this.velocityMS = velocityMS; }

    public Double getThrustN() { return thrustN; }
    public void setThrustN(Double thrustN) { this.thrustN = thrustN; }

    public Double getPropellantKg() { return propellantKg; }
    public void setPropellantKg(Double propellantKg) { this.propellantKg = propellantKg; }

    public Double getThrottle() { return throttle; }
    public void setThrottle(Double throttle) { this.throttle = throttle; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public Boolean getIsValid() { return isValid; }
    public void setIsValid(Boolean isValid) { this.isValid = isValid; }

    public String getValidationErrors() { return validationErrors; }
    public void setValidationErrors(String validationErrors) { this.validationErrors = validationErrors; }

    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String eventId;
        private String flightId;
        private Instant timestamp;
        private Long tPlusMs;
        private Integer stage;
        private Double altitudeM;
        private Double velocityMS;
        private Double thrustN;
        private Double propellantKg;
        private Double throttle;
        private String phase;
        private Boolean isValid;
        private String validationErrors;
        private Instant processedAt;
        private String version;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder eventId(String eventId) { this.eventId = eventId; return this; }
        public Builder flightId(String flightId) { this.flightId = flightId; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public Builder tPlusMs(Long tPlusMs) { this.tPlusMs = tPlusMs; return this; }
        public Builder stage(Integer stage) { this.stage = stage; return this; }
        public Builder altitudeM(Double altitudeM) { this.altitudeM = altitudeM; return this; }
        public Builder velocityMS(Double velocityMS) { this.velocityMS = velocityMS; return this; }
        public Builder thrustN(Double thrustN) { this.thrustN = thrustN; return this; }
        public Builder propellantKg(Double propellantKg) { this.propellantKg = propellantKg; return this; }
        public Builder throttle(Double throttle) { this.throttle = throttle; return this; }
        public Builder phase(String phase) { this.phase = phase; return this; }
        public Builder isValid(Boolean isValid) { this.isValid = isValid; return this; }
        public Builder validationErrors(String validationErrors) { this.validationErrors = validationErrors; return this; }
        public Builder processedAt(Instant processedAt) { this.processedAt = processedAt; return this; }
        public Builder version(String version) { this.version = version; return this; }

        public TelemetryEntity build() {
            return new TelemetryEntity(this);
        }
    }
}
