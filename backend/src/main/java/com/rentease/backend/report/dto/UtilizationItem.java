package com.rentease.backend.report.dto;

public record UtilizationItem(String vehicleType, long totalVehicles, long rentedDays, long totalAvailableDays, double utilizationRate) {}
