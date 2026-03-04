package com.rocketdigitaltwin.telemetry.repository;

import com.rocketdigitaltwin.telemetry.entity.TelemetryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TelemetryRepository extends JpaRepository<TelemetryEntity, Long> {
    
    Optional<TelemetryEntity> findByEventId(String eventId);
    
    @Query("SELECT t FROM TelemetryEntity t WHERE t.flightId = ?1 ORDER BY t.tPlusMs ASC")
    List<TelemetryEntity> findByFlightIdOrderByTPlus(String flightId);
    
    List<TelemetryEntity> findByFlightIdAndIsValid(String flightId, Boolean isValid);
    
    @Query("SELECT COUNT(t) FROM TelemetryEntity t WHERE t.flightId = ?1")
    long countByFlightId(String flightId);
    
    @Query("SELECT COUNT(t) FROM TelemetryEntity t WHERE t.isValid = false")
    long countInvalid();
    
    List<TelemetryEntity> findByTimestampBetween(Instant start, Instant end);
}
