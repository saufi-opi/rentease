package com.rentease.backend.payment.controller;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.UUID;

@Getter
public class CreatePaymentIntentRequest {
    @NotNull
    private UUID bookingId;
}
