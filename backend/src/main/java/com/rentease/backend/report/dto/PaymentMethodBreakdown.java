package com.rentease.backend.report.dto;

import java.math.BigDecimal;

public record PaymentMethodBreakdown(String method, long count, BigDecimal amount) {}
