package com.rentease.backend.report;

import com.rentease.backend.booking.repository.BookingRepository;
import com.rentease.backend.payment.model.PaymentStatus;
import com.rentease.backend.payment.repository.PaymentRepository;
import com.rentease.backend.report.dto.*;
import com.rentease.backend.user.repository.UserRepository;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final String[] DAY_NAMES = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public DashboardStatsResponse getDashboardStats() {
        BigDecimal monthly = paymentRepository.sumPaidAmountsForCurrentMonth(PaymentStatus.PAID);
        BigDecimal total = paymentRepository.sumByStatus(PaymentStatus.PAID);

        LocalDate since = LocalDate.now().minusMonths(11).withDayOfMonth(1);
        List<MonthlyDataPoint> revenueByMonth = buildMonthlyRevenue(
                paymentRepository.findMonthlyRevenueSince(since), since, LocalDate.now());

        // MoM revenue growth
        Double revenueGrowthPercent = computeMoMGrowth(revenueByMonth);

        // Booking status breakdown + derived rates
        List<Object[]> statusRows = bookingRepository.countGroupByStatus();
        List<StatusCount> bookingsByStatus = statusRows.stream()
                .map(r -> new StatusCount(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();
        long totalBookings = bookingsByStatus.stream().mapToLong(StatusCount::count).sum();
        long cancelledCount = bookingsByStatus.stream()
                .filter(s -> "CANCELLED".equals(s.label())).mapToLong(StatusCount::count).sum();
        long completedCount = bookingsByStatus.stream()
                .filter(s -> "COMPLETED".equals(s.label())).mapToLong(StatusCount::count).sum();
        Double cancellationRate = totalBookings > 0
                ? round2((double) cancelledCount / totalBookings * 100) : 0.0;

        // Average booking value
        BigDecimal avgBookingValue = completedCount > 0
                ? monthly.divide(BigDecimal.valueOf(completedCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<StatusCount> vehiclesByStatus = vehicleRepository.countGroupByAvailabilityStatus()
                .stream()
                .map(r -> new StatusCount(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();

        return DashboardStatsResponse.builder()
                .totalUsers(userRepository.count())
                .activeFleet(vehicleRepository.count())
                .todaysBookings(bookingRepository.countTodaysBookings())
                .monthlyRevenue(monthly)
                .totalRevenue(total)
                .revenueGrowthPercent(revenueGrowthPercent)
                .averageBookingValue(avgBookingValue)
                .cancellationRate(cancellationRate)
                .newUsersThisMonth(userRepository.countNewCustomersThisMonth())
                .pendingBookingsCount(bookingRepository.countPendingBookings())
                .revenueByMonth(revenueByMonth)
                .bookingsByStatus(bookingsByStatus)
                .vehiclesByStatus(vehiclesByStatus)
                .build();
    }

    public ReportSummaryResponse getReportSummary(LocalDate startDate, LocalDate endDate,
                                                   String vehicleType, String status) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusMonths(11).withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        String vType = (vehicleType != null && !vehicleType.isBlank()) ? vehicleType : null;
        String bStatus = (status != null && !status.isBlank()) ? status : null;

        // Revenue
        BigDecimal revenue = nullSafe(paymentRepository.sumRevenueFiltered(start, end, vType, bStatus));

        // Previous period revenue for growth calc
        long periodDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate prevStart = start.minusDays(periodDays + 1);
        LocalDate prevEnd = start.minusDays(1);
        BigDecimal prevRevenue = nullSafe(paymentRepository.sumRevenueFiltered(prevStart, prevEnd, vType, bStatus));
        Double revenueGrowthPercent = prevRevenue.compareTo(BigDecimal.ZERO) > 0
                ? round2(revenue.subtract(prevRevenue).divide(prevRevenue, 4, RoundingMode.HALF_UP).doubleValue() * 100)
                : null;

        // Booking counts
        long totalBookings = bookingRepository.countFiltered(start, end, vType, bStatus);
        long totalAll = bookingRepository.countTotalFiltered(start, end);
        long cancelled = bookingRepository.countCancelledFiltered(start, end);
        long completed = bookingRepository.countCompletedFiltered(start, end);

        Double cancellationRate = totalAll > 0 ? round2((double) cancelled / totalAll * 100) : 0.0;
        Double completionRate = totalAll > 0 ? round2((double) completed / totalAll * 100) : 0.0;

        // Average booking value
        BigDecimal avgBookingValue = completed > 0
                ? revenue.divide(BigDecimal.valueOf(completed), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Average rental duration & lead time
        Double avgRentalDays = bookingRepository.avgRentalDays(start, end);
        Double avgLeadTimeDays = bookingRepository.avgLeadTimeDays(start, end);

        // Refunds
        BigDecimal totalRefundAmount = nullSafe(paymentRepository.sumRefundsFiltered(start, end));
        long refunded = paymentRepository.countRefundedFiltered(start, end);
        long paid = paymentRepository.countPaidFiltered(start, end);
        Double refundRate = paid > 0 ? round2((double) refunded / paid * 100) : 0.0;

        // Monthly revenue
        List<MonthlyDataPoint> revenueByMonth = buildMonthlyRevenue(
                paymentRepository.findMonthlyRevenueFiltered(start, end, vType, bStatus), start, end);

        // Booking status breakdown (filtered)
        List<StatusCount> bookingsByStatus = bookingRepository.countGroupByStatusFiltered(start, end, vType, bStatus)
                .stream()
                .map(r -> new StatusCount(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();

        // Bookings by vehicle type
        List<StatusCount> bookingsByVehicleType = bookingRepository.countByVehicleTypeFiltered(start, end)
                .stream()
                .map(r -> new StatusCount(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();

        // Payment method breakdown
        List<PaymentMethodBreakdown> revenueByPaymentMethod = paymentRepository
                .findPaymentMethodBreakdown(start, end, vType, bStatus)
                .stream()
                .map(r -> new PaymentMethodBreakdown(
                        String.valueOf(r[0]),
                        ((Number) r[1]).longValue(),
                        r[2] != null ? new BigDecimal(r[2].toString()) : BigDecimal.ZERO))
                .toList();

        // Top customers
        List<TopCustomerItem> topCustomers = bookingRepository.findTopCustomers(start, end)
                .stream()
                .map(r -> new TopCustomerItem(
                        String.valueOf(r[0]),
                        String.valueOf(r[1]),
                        ((Number) r[2]).longValue(),
                        r[3] != null ? new BigDecimal(r[3].toString()) : BigDecimal.ZERO))
                .toList();

        // Fleet utilization by vehicle type
        List<UtilizationItem> utilization = vehicleRepository.findUtilizationByVehicleType(start, end)
                .stream()
                .map(r -> {
                    String type = String.valueOf(r[0]);
                    long totalVehicles = ((Number) r[1]).longValue();
                    long rentedDays = ((Number) r[2]).longValue();
                    long totalAvailableDays = ((Number) r[3]).longValue();
                    double rate = totalAvailableDays > 0
                            ? round2((double) rentedDays / totalAvailableDays * 100)
                            : 0.0;
                    return new UtilizationItem(type, totalVehicles, rentedDays, totalAvailableDays, rate);
                })
                .toList();

        // Bookings by day of week (MySQL DAYOFWEEK: 1=Sun…7=Sat)
        Map<Integer, Long> dowMap = new LinkedHashMap<>();
        bookingRepository.countByDayOfWeek(start, end)
                .forEach(r -> dowMap.put(((Number) r[0]).intValue(), ((Number) r[1]).longValue()));
        List<StatusCount> bookingsByDayOfWeek = new ArrayList<>();
        for (int dow = 1; dow <= 7; dow++) {
            bookingsByDayOfWeek.add(new StatusCount(DAY_NAMES[dow - 1], dowMap.getOrDefault(dow, 0L)));
        }

        // Top vehicles
        List<TopVehicleItem> topVehicles = vehicleRepository.findTopVehiclesFiltered(start, end, vType, bStatus)
                .stream()
                .map(r -> new TopVehicleItem(
                        String.valueOf(r[0]),
                        String.valueOf(r[1]),
                        String.valueOf(r[2]),
                        String.valueOf(r[3]),
                        ((Number) r[4]).longValue(),
                        r[5] != null ? new BigDecimal(r[5].toString()) : BigDecimal.ZERO))
                .toList();

        return ReportSummaryResponse.builder()
                .startDate(start)
                .endDate(end)
                .vehicleType(vType)
                .status(bStatus)
                .totalRevenue(revenue)
                .totalBookings(totalBookings)
                .averageBookingValue(avgBookingValue)
                .cancellationRate(cancellationRate)
                .completionRate(completionRate)
                .averageRentalDays(avgRentalDays)
                .averageLeadTimeDays(avgLeadTimeDays)
                .revenueGrowthPercent(revenueGrowthPercent)
                .previousPeriodRevenue(prevRevenue)
                .totalRefundAmount(totalRefundAmount)
                .refundRate(refundRate)
                .revenueByMonth(revenueByMonth)
                .bookingsByStatus(bookingsByStatus)
                .bookingsByVehicleType(bookingsByVehicleType)
                .bookingsByDayOfWeek(bookingsByDayOfWeek)
                .revenueByPaymentMethod(revenueByPaymentMethod)
                .topCustomers(topCustomers)
                .utilizationByVehicleType(utilization)
                .topVehicles(topVehicles)
                .build();
    }

    private List<MonthlyDataPoint> buildMonthlyRevenue(List<Object[]> rows, LocalDate from, LocalDate to) {
        Map<String, BigDecimal> dataMap = new HashMap<>();
        for (Object[] row : rows) {
            int yr = ((Number) row[0]).intValue();
            int mo = ((Number) row[1]).intValue();
            BigDecimal amount = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            dataMap.put(yr + "-" + mo, amount);
        }

        List<MonthlyDataPoint> result = new ArrayList<>();
        LocalDate cursor = from.withDayOfMonth(1);
        LocalDate endCursor = to.withDayOfMonth(1);
        while (!cursor.isAfter(endCursor)) {
            int yr = cursor.getYear();
            int mo = cursor.getMonthValue();
            String label = Month.of(mo).getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + yr;
            BigDecimal amount = dataMap.getOrDefault(yr + "-" + mo, BigDecimal.ZERO);
            result.add(new MonthlyDataPoint(yr, mo, label, amount));
            cursor = cursor.plusMonths(1);
        }
        return result;
    }

    private Double computeMoMGrowth(List<MonthlyDataPoint> points) {
        if (points.size() < 2) return null;
        MonthlyDataPoint current = points.get(points.size() - 1);
        MonthlyDataPoint previous = points.get(points.size() - 2);
        if (previous.amount().compareTo(BigDecimal.ZERO) == 0) return null;
        return round2(current.amount().subtract(previous.amount())
                .divide(previous.amount(), 4, RoundingMode.HALF_UP)
                .doubleValue() * 100);
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
