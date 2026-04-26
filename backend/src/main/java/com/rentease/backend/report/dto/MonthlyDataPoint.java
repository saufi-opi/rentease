package com.rentease.backend.report.dto;

import java.math.BigDecimal;

public record MonthlyDataPoint(int year, int month, String label, BigDecimal amount) {}
