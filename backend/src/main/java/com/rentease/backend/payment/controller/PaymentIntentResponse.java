package com.rentease.backend.payment.controller;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class PaymentIntentResponse {
    private String clientSecret;
    private String publishableKey;
    private UUID paymentId;
    private BigDecimal amount;
}
