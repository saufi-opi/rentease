package com.rentease.backend.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalUsers;
    private long activeFleet;
    private long todaysBookings;
    private BigDecimal monthlyRevenue;
    private BigDecimal totalRevenue;
    private Double revenueGrowthPercent;
    private BigDecimal averageBookingValue;
    private Double cancellationRate;
    private long newUsersThisMonth;
    private long pendingBookingsCount;
    private List<MonthlyDataPoint> revenueByMonth;
    private List<StatusCount> bookingsByStatus;
    private List<StatusCount> vehiclesByStatus;
}
