package com.rentease.backend.vehicle.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class VehicleRequest {
    @NotBlank
    private String type;

    @NotBlank
    private String brand;

    @NotBlank
    private String model;

    @NotNull
    @Positive
    private Integer year;

    @NotNull
    @Positive
    private BigDecimal rentalRate;

    @NotNull
    @Positive
    private Integer seats;

    @NotBlank
    private String fuelType;

    private MultipartFile image;

    private String availabilityStatus;

    private String description;
    private String transmission;
    private List<String> features;
    private BigDecimal discount;
}
