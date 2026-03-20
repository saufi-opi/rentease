package com.rentease.backend.vehicle.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class VehicleResponse {
    private UUID id;
    private String type;
    private String brand;
    private String model;
    private Integer year;

    @JsonProperty("rental_rate")
    private BigDecimal rentalRate;

    private Integer seats;

    private String fuelType;

    @JsonProperty("availability_status")
    private String availabilityStatus;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("registration_date")
    private LocalDate registrationDate;

    private String description;
    private String transmission;
    private List<String> features;
    private BigDecimal discount;

    @JsonProperty("discounted_price")
    private BigDecimal discountedPrice;
}
