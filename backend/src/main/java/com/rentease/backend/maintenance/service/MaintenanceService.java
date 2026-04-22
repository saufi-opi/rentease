package com.rentease.backend.maintenance.service;

import com.rentease.backend.auth.security.SecurityUtils;
import com.rentease.backend.booking.model.BookingStatus;
import com.rentease.backend.booking.repository.BookingRepository;
import com.rentease.backend.common.exception.ConflictException;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.maintenance.controller.MaintenanceRequest;
import com.rentease.backend.maintenance.controller.MaintenanceResponse;
import com.rentease.backend.maintenance.model.MaintenanceRecord;
import com.rentease.backend.maintenance.model.MaintenanceStatus;
import com.rentease.backend.maintenance.repository.MaintenanceRepository;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.repository.UserRepository;
import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    private static final Map<MaintenanceStatus, Set<MaintenanceStatus>> ALLOWED_TRANSITIONS = Map.of(
            MaintenanceStatus.SCHEDULED, Set.of(MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED),
            MaintenanceStatus.IN_PROGRESS, Set.of(MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED)
    );

    private static final List<MaintenanceStatus> TERMINAL_STATUSES =
            List.of(MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED);

    @Transactional
    public MaintenanceResponse createMaintenance(MaintenanceRequest request) {
        LocalDate start = request.getScheduledStartDate();
        LocalDate end = request.getEstimatedEndDate();

        if (!start.isBefore(end)) {
            throw new RuntimeException("Scheduled start date must be before estimated end date");
        }
        if (start.isBefore(LocalDate.now())) {
            throw new RuntimeException("Scheduled start date cannot be in the past");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        if (maintenanceRepository.existsByVehicle_IdAndStatusNotIn(vehicle.getId(), TERMINAL_STATUSES)) {
            throw new ConflictException("Vehicle already has an active maintenance record");
        }

        List<BookingStatus> excludedStatuses = List.of(BookingStatus.CANCELLED, BookingStatus.PAYMENT_FAILED);
        List<String> conflictingRefs = bookingRepository.findConflictingRefs(
                vehicle.getId(), start, end, excludedStatuses);
        if (!conflictingRefs.isEmpty()) {
            throw new ConflictException(
                    "Vehicle has " + conflictingRefs.size() + " booking(s) overlapping the maintenance window: "
                    + String.join(", ", conflictingRefs));
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .maintenanceType(request.getMaintenanceType())
                .description(request.getDescription())
                .scheduledStartDate(start)
                .estimatedEndDate(end)
                .status(MaintenanceStatus.SCHEDULED)
                .createdBy(admin)
                .build();

        maintenanceRepository.save(record);
        // Vehicle stays AVAILABLE at SCHEDULED state — it is locked only when IN_PROGRESS

        return mapToResponse(record);
    }

    public Page<MaintenanceResponse> getAllMaintenance(String statusFilter, String vehicleIdFilter, Pageable pageable) {
        if (vehicleIdFilter != null && !vehicleIdFilter.isBlank()) {
            try {
                UUID vehicleId = UUID.fromString(vehicleIdFilter);
                return maintenanceRepository.findByVehicle_IdOrderByCreatedAtDesc(vehicleId, pageable)
                        .map(this::mapToResponse);
            } catch (IllegalArgumentException ignored) {
            }
        }

        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                MaintenanceStatus status = MaintenanceStatus.valueOf(statusFilter.toUpperCase());
                return maintenanceRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                        .map(this::mapToResponse);
            } catch (IllegalArgumentException ignored) {
            }
        }

        return maintenanceRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToResponse);
    }

    public MaintenanceResponse getMaintenanceById(UUID id) {
        MaintenanceRecord record = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found"));
        return mapToResponse(record);
    }

    @Transactional
    public MaintenanceResponse updateStatus(UUID id, String newStatusStr, String remark) {
        MaintenanceRecord record = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found"));

        MaintenanceStatus newStatus;
        try {
            newStatus = MaintenanceStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid maintenance status: " + newStatusStr);
        }

        Set<MaintenanceStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(record.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new RuntimeException(
                    "Cannot transition from " + record.getStatus() + " to " + newStatus);
        }

        if (newStatus == MaintenanceStatus.IN_PROGRESS) {
            Vehicle vehicle = record.getVehicle();
            vehicle.setAvailabilityStatus(AvailabilityStatus.UNDER_MAINTENANCE);
            vehicleRepository.save(vehicle);
        }

        if (newStatus == MaintenanceStatus.COMPLETED || newStatus == MaintenanceStatus.CANCELLED) {
            record.setCompletedAt(LocalDateTime.now());
            Vehicle vehicle = record.getVehicle();
            vehicle.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        record.setStatus(newStatus);
        if (remark != null && !remark.isBlank()) {
            record.setRemark(remark);
        }
        return mapToResponse(maintenanceRepository.save(record));
    }

    private MaintenanceResponse mapToResponse(MaintenanceRecord record) {
        Vehicle vehicle = record.getVehicle();
        User createdBy = record.getCreatedBy();

        return MaintenanceResponse.builder()
                .id(record.getId())
                .vehicleId(vehicle.getId().toString())
                .vehicleBrand(vehicle.getBrand())
                .vehicleModel(vehicle.getModel())
                .vehicleType(vehicle.getType())
                .maintenanceType(record.getMaintenanceType())
                .description(record.getDescription())
                .scheduledStartDate(record.getScheduledStartDate())
                .estimatedEndDate(record.getEstimatedEndDate())
                .status(record.getStatus())
                .createdById(createdBy != null ? createdBy.getId().toString() : null)
                .createdByName(createdBy != null ? createdBy.getFullName() : null)
                .createdAt(record.getCreatedAt())
                .completedAt(record.getCompletedAt())
                .remark(record.getRemark())
                .build();
    }
}
