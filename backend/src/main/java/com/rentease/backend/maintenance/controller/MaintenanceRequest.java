package com.rentease.backend.maintenance.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
public class MaintenanceRequest {

    @NotNull(message = "Vehicle ID is required")
    private UUID vehicleId;

    @NotBlank(message = "Maintenance type is required")
    private String maintenanceType;

    private String description;

    @NotNull(message = "Scheduled start date is required")
    private LocalDate scheduledStartDate;

    @NotNull(message = "Estimated end date is required")
    private LocalDate estimatedEndDate;
}
