package com.rocketdigitaltwin.telemetry.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;

import java.time.Instant;

/**
 * Normalized telemetry contract V1 (rocket.telemetry.v1 topic)
 * Validated and enriched telemetry data
 */
public class TelemetryV1 {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("eventId")
    @NotBlank
    private String eventId;
    
    @JsonProperty("flightId")
    @NotBlank
    private String flightId;
    
    @JsonProperty("timestamp")
    @NotNull
    private Instant timestamp;
    
    @JsonProperty("tPlusMs")
    @Min(0)
    private Long tPlusMs;
    
    @JsonProperty("stage")
    @Min(1)
    @Max(2)
    private Integer stage;
    
    @JsonProperty("altitudeM")
    @Min(0)
    private Double altitudeM;
    
    @JsonProperty("velocityMS")
    @Min(0)
    private Double velocityMS;
    
    @JsonProperty("thrustN")
    @Min(0)
    private Double thrustN;
    
    @JsonProperty("propellantKg")
    @Min(0)
    private Double propellantKg;
    
    @JsonProperty("throttle")
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double throttle;
    
    // Enriched fields
    @JsonProperty("phase")
    private String phase;
    
    @JsonProperty("isValid")
    private Boolean isValid;
    
    @JsonProperty("validationErrors")
    private String validationErrors;
    
    @JsonProperty("processedAt")
    private Instant processedAt;
    
    @JsonProperty("version")
    private String version = "v1";

    // Constructors
    public TelemetryV1() {}
    
    private TelemetryV1(Builder builder) {
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
        this.version = builder.version != null ? builder.version : "v1";
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
        private String version = "v1";

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

        public TelemetryV1 build() {
            return new TelemetryV1(this);
        }
    }
}
