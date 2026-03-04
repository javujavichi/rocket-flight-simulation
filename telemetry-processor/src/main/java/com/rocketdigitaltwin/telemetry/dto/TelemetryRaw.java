package com.rocketdigitaltwin.telemetry.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Raw telemetry data from simulator (rocket.telemetry.raw topic)
 */
public class TelemetryRaw {
    @JsonProperty("eventId")
    private String eventId;
    
    @JsonProperty("flightId")
    private String flightId;
    
    @JsonProperty("ts")
    private String ts;
    
    @JsonProperty("tPlusMs")
    private Long tPlusMs;
    
    @JsonProperty("stage")
    private Integer stage;
    
    @JsonProperty("altitudeM")
    private Double altitudeM;
    
    @JsonProperty("verticalVelocityMS")
    private Double verticalVelocityMS;
    
    @JsonProperty("thrustN")
    private Double thrustN;
    
    @JsonProperty("propellantKg")
    private Double propellantKg;
    
    @JsonProperty("throttle")
    private Double throttle;

    // Getters and Setters
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    
    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }
    
    public String getTs() { return ts; }
    public void setTs(String ts) { this.ts = ts; }
    
    public Long getTPlusMs() { return tPlusMs; }
    public void setTPlusMs(Long tPlusMs) { this.tPlusMs = tPlusMs; }
    
    public Integer getStage() { return stage; }
    public void setStage(Integer stage) { this.stage = stage; }
    
    public Double getAltitudeM() { return altitudeM; }
    public void setAltitudeM(Double altitudeM) { this.altitudeM = altitudeM; }
    
    public Double getVerticalVelocityMS() { return verticalVelocityMS; }
    public void setVerticalVelocityMS(Double verticalVelocityMS) { this.verticalVelocityMS = verticalVelocityMS; }
    
    public Double getThrustN() { return thrustN; }
    public void setThrustN(Double thrustN) { this.thrustN = thrustN; }
    
    public Double getPropellantKg() { return propellantKg; }
    public void setPropellantKg(Double propellantKg) { this.propellantKg = propellantKg; }
    
    public Double getThrottle() { return throttle; }
    public void setThrottle(Double throttle) { this.throttle = throttle; }
}
