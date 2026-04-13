package com.rentease.backend.payment.controller;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private String confirmationRef;
    private String customerName;
    private String vehicleName;
    private BigDecimal amount;
    private String status;
    private String paymentType;
    private String gatewayTransactionId;
    private LocalDateTime paymentDate;
    private BigDecimal refundAmount;
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;
}
