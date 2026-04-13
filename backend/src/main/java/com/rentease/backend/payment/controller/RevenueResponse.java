package com.rentease.backend.payment.controller;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RevenueResponse {
    private BigDecimal monthlyRevenue;
    private BigDecimal totalRevenue;
}
