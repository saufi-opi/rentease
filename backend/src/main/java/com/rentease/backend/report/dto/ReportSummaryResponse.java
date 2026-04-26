package com.rentease.backend.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ReportSummaryResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private String vehicleType;
    private String status;

    // Core KPIs
    private BigDecimal totalRevenue;
    private long totalBookings;
    private BigDecimal averageBookingValue;
    private Double cancellationRate;
    private Double completionRate;
    private Double averageRentalDays;
    private Double averageLeadTimeDays;

    // Growth
    private Double revenueGrowthPercent;
    private BigDecimal previousPeriodRevenue;

    // Refunds
    private BigDecimal totalRefundAmount;
    private Double refundRate;

    // Charts & tables
    private List<MonthlyDataPoint> revenueByMonth;
    private List<StatusCount> bookingsByStatus;
    private List<StatusCount> bookingsByVehicleType;
    private List<StatusCount> bookingsByDayOfWeek;
    private List<PaymentMethodBreakdown> revenueByPaymentMethod;
    private List<UtilizationItem> utilizationByVehicleType;
    private List<TopCustomerItem> topCustomers;
    private List<TopVehicleItem> topVehicles;
}
