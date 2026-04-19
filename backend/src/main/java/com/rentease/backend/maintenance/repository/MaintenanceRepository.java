package com.rentease.backend.maintenance.repository;

import com.rentease.backend.maintenance.model.MaintenanceRecord;
import com.rentease.backend.maintenance.model.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, UUID> {

    Page<MaintenanceRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<MaintenanceRecord> findByStatusOrderByCreatedAtDesc(MaintenanceStatus status, Pageable pageable);

    Page<MaintenanceRecord> findByVehicle_IdOrderByCreatedAtDesc(UUID vehicleId, Pageable pageable);

    boolean existsByVehicle_IdAndStatusNotIn(UUID vehicleId, List<MaintenanceStatus> terminalStatuses);

    @Query("SELECT COUNT(m) FROM MaintenanceRecord m " +
           "WHERE m.vehicle.id = :vehicleId " +
           "AND m.status IN :activeStatuses " +
           "AND m.scheduledStartDate < :endDate " +
           "AND m.estimatedEndDate > :startDate")
    long countMaintenanceConflicts(@Param("vehicleId") UUID vehicleId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("activeStatuses") List<MaintenanceStatus> activeStatuses);
}
