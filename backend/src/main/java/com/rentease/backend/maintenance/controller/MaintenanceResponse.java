package com.rentease.backend.maintenance.controller;

import com.rentease.backend.maintenance.model.MaintenanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class MaintenanceResponse {
    private UUID id;
    private String vehicleId;
    private String vehicleBrand;
    private String vehicleModel;
    private String vehicleType;
    private String maintenanceType;
    private String description;
    private LocalDate scheduledStartDate;
    private LocalDate estimatedEndDate;
    private MaintenanceStatus status;
    private String createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String remark;
}
