package com.rentease.backend.payment.repository;

import com.rentease.backend.payment.model.Payment;
import com.rentease.backend.payment.model.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBookingId(UUID bookingId);

    Optional<Payment> findByGatewayTransactionId(String gatewayTransactionId);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status AND MONTH(p.paymentDate) = MONTH(CURRENT_DATE) AND YEAR(p.paymentDate) = YEAR(CURRENT_DATE)")
    BigDecimal sumPaidAmountsForCurrentMonth(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumByStatus(PaymentStatus status);

    @Query(value = """
            SELECT YEAR(p.payment_date) AS yr, MONTH(p.payment_date) AS mo,
                   COALESCE(SUM(p.amount), 0) AS amount
            FROM payments p
            WHERE p.status = 'PAID' AND p.payment_date >= :since
            GROUP BY yr, mo ORDER BY yr, mo
            """, nativeQuery = true)
    List<Object[]> findMonthlyRevenueSince(@Param("since") LocalDate since);

    @Query(value = """
            SELECT YEAR(p.payment_date) AS yr, MONTH(p.payment_date) AS mo,
                   COALESCE(SUM(p.amount), 0) AS amount
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE p.status = 'PAID'
            AND (:startDate IS NULL OR p.payment_date >= :startDate)
            AND (:endDate IS NULL OR p.payment_date <= :endDate)
            AND (:vehicleType IS NULL OR v.type = :vehicleType)
            AND (:status IS NULL OR b.status = :status)
            GROUP BY yr, mo ORDER BY yr, mo
            """, nativeQuery = true)
    List<Object[]> findMonthlyRevenueFiltered(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM payments p " +
                   "JOIN bookings b ON p.booking_id = b.id " +
                   "JOIN vehicles v ON b.vehicle_id = v.id " +
                   "WHERE p.status = 'PAID' " +
                   "AND (:startDate IS NULL OR p.payment_date >= :startDate) " +
                   "AND (:endDate IS NULL OR p.payment_date <= :endDate) " +
                   "AND (:vehicleType IS NULL OR v.type = :vehicleType) " +
                   "AND (:status IS NULL OR b.status = :status)", nativeQuery = true)
    BigDecimal sumRevenueFiltered(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = """
            SELECT COALESCE(p.payment_type, 'UNKNOWN') AS method,
                   COUNT(p.id) AS cnt,
                   COALESCE(SUM(p.amount), 0) AS total
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE p.status = 'PAID'
            AND (:start IS NULL OR p.payment_date >= :start)
            AND (:end IS NULL OR p.payment_date <= :end)
            AND (:vehicleType IS NULL OR v.type = :vehicleType)
            AND (:status IS NULL OR b.status = :status)
            GROUP BY method ORDER BY total DESC
            """, nativeQuery = true)
    List<Object[]> findPaymentMethodBreakdown(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = "SELECT COALESCE(SUM(p.refund_amount), 0) FROM payments p " +
                   "WHERE p.refund_amount IS NOT NULL " +
                   "AND (:start IS NULL OR p.payment_date >= :start) " +
                   "AND (:end IS NULL OR p.payment_date <= :end)", nativeQuery = true)
    BigDecimal sumRefundsFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(p.id) FROM payments p " +
                   "WHERE p.refund_amount IS NOT NULL AND p.refund_amount > 0 " +
                   "AND (:start IS NULL OR p.payment_date >= :start) " +
                   "AND (:end IS NULL OR p.payment_date <= :end)", nativeQuery = true)
    long countRefundedFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(p.id) FROM payments p WHERE p.status = 'PAID' " +
                   "AND (:start IS NULL OR p.payment_date >= :start) " +
                   "AND (:end IS NULL OR p.payment_date <= :end)", nativeQuery = true)
    long countPaidFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
