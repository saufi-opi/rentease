package com.rentease.backend.payment.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class ConfirmPaymentRequest {
    @NotBlank
    private String paymentIntentId;
}
