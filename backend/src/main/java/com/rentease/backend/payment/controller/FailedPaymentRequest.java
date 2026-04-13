package com.rentease.backend.payment.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class FailedPaymentRequest {
    @NotBlank
    private String paymentIntentId;
    private String reason;
}
