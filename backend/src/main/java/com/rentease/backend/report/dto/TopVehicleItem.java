package com.rentease.backend.report.dto;

import java.math.BigDecimal;

public record TopVehicleItem(String vehicleId, String brand, String model, String type, long bookingCount, BigDecimal revenue) {}
