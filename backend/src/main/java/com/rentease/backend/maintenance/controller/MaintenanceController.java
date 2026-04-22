package com.rentease.backend.maintenance.controller;

import com.rentease.backend.maintenance.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping("/api/v1/admin/maintenance")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE')")
    public MaintenanceResponse createMaintenance(@Valid @RequestBody MaintenanceRequest request) {
        return maintenanceService.createMaintenance(request);
    }

    @GetMapping("/api/v1/admin/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE')")
    public Page<MaintenanceResponse> getAllMaintenance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String vehicleId
    ) {
        return maintenanceService.getAllMaintenance(status, vehicleId, PageRequest.of(page, size));
    }

    @GetMapping("/api/v1/admin/maintenance/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE')")
    public MaintenanceResponse getMaintenanceById(@PathVariable UUID id) {
        return maintenanceService.getMaintenanceById(id);
    }

    @GetMapping("/api/v1/vehicles/{vehicleId}/maintenance")
    public Page<MaintenanceResponse> getMaintenanceForVehicle(
            @PathVariable UUID vehicleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return maintenanceService.getAllMaintenance(null, vehicleId.toString(), PageRequest.of(page, size));
    }

    @PutMapping("/api/v1/admin/maintenance/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE')")
    public MaintenanceResponse updateMaintenanceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceStatusUpdateRequest request
    ) {
        return maintenanceService.updateStatus(id, request.getStatus(), request.getRemark());
    }
}
