package com.rentease.backend.payment.controller;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RefundRequest {
    /** Optional. If null, full refund is issued. */
    private BigDecimal amount;
}
