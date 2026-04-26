package com.rentease.backend.report.dto;

import java.math.BigDecimal;

public record TopCustomerItem(String customerId, String customerName, long bookingCount, BigDecimal totalSpend) {}
