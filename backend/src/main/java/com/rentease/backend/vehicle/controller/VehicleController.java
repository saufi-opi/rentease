package com.rentease.backend.vehicle.controller;

import com.rentease.backend.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    // =============================================
    // PUBLIC ENDPOINTS — Customer Browse
    // =============================================

    /**
     * Browse available vehicles with pagination, filtering, and search.
     * Only returns AVAILABLE vehicles for customers.
     */
    @GetMapping("/api/v1/vehicles")
    public VehiclePage browseVehicles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, name = "sort_by") String sortBy,
            @RequestParam(required = false, name = "min_price") BigDecimal minPrice,
            @RequestParam(required = false, name = "max_price") BigDecimal maxPrice,
            @RequestParam(required = false, name = "available_from") LocalDate availableFrom,
            @RequestParam(required = false, name = "available_to") LocalDate availableTo
    ) {
        return vehicleService.getVehicles(page, size, type, brand, null, search, sortBy, true,
                minPrice, maxPrice, availableFrom, availableTo);
    }

    /**
     * Get a single vehicle by ID (public).
     */
    @GetMapping("/api/v1/vehicles/{id}")
    public VehicleResponse getVehicle(@PathVariable UUID id) {
        return vehicleService.getVehicleById(id);
    }

    // =============================================
    // ADMIN ENDPOINTS — Vehicle CRUD
    // =============================================

    /**
     * List all vehicles (admin view, includes all statuses).
     */
    @GetMapping("/api/v1/admin/vehicles")
    @PreAuthorize("hasRole('ADMIN')")
    public VehiclePage listVehicles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, name = "sort_by") String sortBy
    ) {
        return vehicleService.getVehicles(page, size, type, brand, status, search, sortBy, false, null, null, null, null);
    }

    @PostMapping(value = "/api/v1/admin/vehicles", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse createVehicle(@Valid @ModelAttribute VehicleRequest request) {
        return vehicleService.createVehicle(request);
    }

    @PutMapping(value = "/api/v1/admin/vehicles/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public VehicleResponse updateVehicle(@PathVariable UUID id, @Valid @ModelAttribute VehicleRequest request) {
        return vehicleService.updateVehicle(id, request);
    }

    @DeleteMapping("/api/v1/admin/vehicles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVehicle(@PathVariable UUID id) {
        vehicleService.deleteVehicle(id);
    }

    /**
     * Get auto-complete suggestions for vehicle brands and models.
     */
    @GetMapping("/api/v1/vehicles/suggestions")
    public java.util.Map<String, java.util.List<String>> getVehicleSuggestions() {
        return vehicleService.getVehicleSuggestions();
    }
}
