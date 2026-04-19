package com.rentease.backend.vehicle.service;

import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.vehicle.controller.VehiclePage;
import com.rentease.backend.vehicle.controller.VehicleRequest;
import com.rentease.backend.vehicle.controller.VehicleResponse;
import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.TransmissionType;
import com.rentease.backend.vehicle.model.Vehicle;
import com.rentease.backend.vehicle.model.VehicleFeature;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import com.rentease.backend.vehicle.repository.VehicleSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.rentease.backend.common.service.FileStorageService;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final FileStorageService fileStorageService;

    /**
     * Browse vehicles with pagination, filtering, and search.
     * Used by both customers (only AVAILABLE) and admins (all statuses).
     */
    @SuppressWarnings("removal")
    public VehiclePage getVehicles(int page, int size, String type, String brand,
                                   String status, String search, String sortBy, boolean customerOnly,
                                   BigDecimal minPrice, BigDecimal maxPrice,
                                   LocalDate availableFrom, LocalDate availableTo) {
        Sort sort = resolveSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Vehicle> spec = Specification.where(null);

        if (customerOnly) {
            spec = spec.and(VehicleSpecification.isAvailableForCustomer());
        } else if (status != null && !status.isBlank()) {
            try {
                AvailabilityStatus avStatus = AvailabilityStatus.valueOf(status.toUpperCase());
                spec = spec.and(VehicleSpecification.hasStatus(avStatus));
            } catch (IllegalArgumentException ignored) {
                // Invalid status filter, ignore
            }
        }

        spec = spec.and(VehicleSpecification.hasType(type));
        spec = spec.and(VehicleSpecification.hasBrand(brand));
        spec = spec.and(VehicleSpecification.searchByKeyword(search));
        spec = spec.and(VehicleSpecification.hasPriceRange(minPrice, maxPrice));
        spec = spec.and(VehicleSpecification.isAvailableForDates(availableFrom, availableTo));
        spec = spec.and(VehicleSpecification.hasNoMaintenanceInWindow(availableFrom, availableTo));

        Page<Vehicle> vehiclePage = vehicleRepository.findAll(spec, pageable);

        return VehiclePage.builder()
                .content(vehiclePage.getContent().stream().map(this::mapToResponse).toList())
                .page(vehiclePage.getNumber())
                .size(vehiclePage.getSize())
                .totalElements(vehiclePage.getTotalElements())
                .totalPages(vehiclePage.getTotalPages())
                .last(vehiclePage.isLast())
                .build();
    }

    public VehicleResponse getVehicleById(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        return mapToResponse(vehicle);
    }

    public List<VehicleResponse> getPopularVehicles(int limit) {
        return vehicleRepository.findPopularVehicles(Math.min(limit, 20))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public java.util.Map<String, java.util.List<String>> getVehicleSuggestions() {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.ClassPathResource("vehicle-suggestions.json");
            return mapper.readValue(resource.getInputStream(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, java.util.List<String>>>() {});
        } catch (java.io.IOException e) {
            return java.util.Collections.emptyMap();
        }
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request) {
        String finalImageUrl = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            finalImageUrl = fileStorageService.storeFile(request.getImage());
        }

        Vehicle vehicle = Vehicle.builder()
                .type(request.getType())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .rentalRate(request.getRentalRate())
                .seats(request.getSeats())
                .fuelType(request.getFuelType())
                .imageUrl(finalImageUrl)
                .availabilityStatus(resolveStatus(request.getAvailabilityStatus()))
                .description(request.getDescription())
                .transmission(resolveTransmission(request.getTransmission()))
                .features(mapFeatures(request.getFeatures()))
                .discount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO)
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToResponse(saved);
    }

    @Transactional
    public VehicleResponse updateVehicle(UUID id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        vehicle.setType(request.getType());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setRentalRate(request.getRentalRate());
        
        if (request.getSeats() != null) vehicle.setSeats(request.getSeats());
        if (request.getFuelType() != null && !request.getFuelType().isBlank()) vehicle.setFuelType(request.getFuelType());
        
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String newImageUrl = fileStorageService.storeFile(request.getImage());
            vehicle.setImageUrl(newImageUrl);
        }
        
        if (request.getAvailabilityStatus() != null) {
            vehicle.setAvailabilityStatus(resolveStatus(request.getAvailabilityStatus()));
        }

        if (request.getDescription() != null) vehicle.setDescription(request.getDescription());
        if (request.getTransmission() != null) vehicle.setTransmission(resolveTransmission(request.getTransmission()));
        if (request.getFeatures() != null) vehicle.setFeatures(mapFeatures(request.getFeatures()));
        if (request.getDiscount() != null) vehicle.setDiscount(request.getDiscount());

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteVehicle(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        
        String imageUrl = vehicle.getImageUrl();
        if (imageUrl != null) {
            fileStorageService.deleteFile(imageUrl);
        }
        
        vehicleRepository.deleteById(id);
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        String finalImageUrl = vehicle.getImageUrl();
        if (finalImageUrl != null && !finalImageUrl.startsWith("http") && !finalImageUrl.startsWith("/assets")) {
            try {
                finalImageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                        .path("/uploads/")
                        .path(finalImageUrl)
                        .toUriString();
            } catch (Exception e) {
                finalImageUrl = "/uploads/" + finalImageUrl;
            }
        }

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .type(vehicle.getType())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .rentalRate(vehicle.getRentalRate())
                .seats(vehicle.getSeats())
                .fuelType(vehicle.getFuelType())
                .availabilityStatus(vehicle.getAvailabilityStatus().name())
                .imageUrl(finalImageUrl)
                .registrationDate(vehicle.getRegistrationDate())
                .description(vehicle.getDescription())
                .transmission(vehicle.getTransmission() != null ? vehicle.getTransmission().name() : null)
                .features(vehicle.getFeatures() != null ? vehicle.getFeatures().stream().map(Enum::name).collect(Collectors.toList()) : null)
                .discount(vehicle.getDiscount())
                .discountedPrice(calculateDiscountedPrice(vehicle.getRentalRate(), vehicle.getDiscount()))
                .build();
    }

    private AvailabilityStatus resolveStatus(String status) {
        if (status == null || status.isBlank()) return AvailabilityStatus.AVAILABLE;
        try {
            return AvailabilityStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return AvailabilityStatus.AVAILABLE;
        }
    }

    private TransmissionType resolveTransmission(String transmission) {
        if (transmission == null || transmission.isBlank()) return TransmissionType.MANUAL;
        try {
            return TransmissionType.valueOf(transmission.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TransmissionType.MANUAL;
        }
    }

    private List<VehicleFeature> mapFeatures(List<String> featureStrings) {
        if (featureStrings == null) return null;
        return featureStrings.stream()
                .map(s -> {
                    try {
                        return VehicleFeature.valueOf(s.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(f -> f != null)
                .collect(Collectors.toList());
    }

    private BigDecimal calculateDiscountedPrice(BigDecimal rentalRate, BigDecimal discountPercent) {
        if (rentalRate == null) return null;
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return rentalRate;
        }
        BigDecimal multiplier = BigDecimal.ONE.subtract(discountPercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        return rentalRate.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private Sort resolveSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sortBy.toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "rentalRate");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "rentalRate");
            case "year_desc" -> Sort.by(Sort.Direction.DESC, "year");
            case "year_asc" -> Sort.by(Sort.Direction.ASC, "year");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "brand").and(Sort.by(Sort.Direction.ASC, "model"));
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "brand").and(Sort.by(Sort.Direction.DESC, "model"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
