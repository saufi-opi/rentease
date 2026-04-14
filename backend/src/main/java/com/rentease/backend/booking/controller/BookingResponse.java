package com.rentease.backend.booking.controller;

import com.rentease.backend.booking.model.BookingStatus;
import com.rentease.backend.payment.model.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class BookingResponse {
    private UUID id;
    private String vehicleId;
    private String vehicleBrand;
    private String vehicleModel;
    private String vehicleType;
    private String vehicleImageUrl;
    private BigDecimal vehicleRentalRate;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private int rentalDays;
    private BigDecimal totalCost;
    private BookingStatus status;
    private PaymentStatus paymentStatus;
    private String confirmationRef;
    private LocalDateTime createdAt;
}
