package com.rentease.backend.maintenance.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class MaintenanceStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String remark;
}
