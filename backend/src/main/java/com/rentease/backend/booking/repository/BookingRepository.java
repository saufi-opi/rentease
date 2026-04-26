package com.rentease.backend.booking.repository;

import com.rentease.backend.booking.model.Booking;
import com.rentease.backend.booking.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(UUID customerId);

    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status, Pageable pageable);

    /**
     * Count bookings for a vehicle that overlap the given date range,
     * excluding bookings with the specified statuses (e.g. CANCELLED).
     * Overlap condition: existing.start < newEnd AND existing.end > newStart
     */
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.createdAt < :cutoff")
    List<Booking> findByStatusAndCreatedAtBefore(@Param("status") BookingStatus status,
                                                  @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.vehicle.id = :vehicleId " +
           "AND b.status NOT IN :excludedStatuses " +
           "AND b.startDate < :endDate " +
           "AND b.endDate > :startDate")
    long countConflicts(@Param("vehicleId") UUID vehicleId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("excludedStatuses") List<BookingStatus> excludedStatuses);

    @Query("SELECT b.confirmationRef FROM Booking b " +
           "WHERE b.vehicle.id = :vehicleId " +
           "AND b.status NOT IN :excludedStatuses " +
           "AND b.startDate < :endDate " +
           "AND b.endDate > :startDate")
    List<String> findConflictingRefs(@Param("vehicleId") UUID vehicleId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate,
                                      @Param("excludedStatuses") List<BookingStatus> excludedStatuses);

    Page<Booking> findByVehicle_IdOrderByCreatedAtDesc(UUID vehicleId, Pageable pageable);

    Page<Booking> findByVehicle_IdAndStatusOrderByCreatedAtDesc(UUID vehicleId, BookingStatus status, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE DATE(b.createdAt) = CURRENT_DATE")
    long countTodaysBookings();

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countGroupByStatus();

    @Query(value = """
            SELECT b.status, COUNT(b.id) AS cnt
            FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id
            WHERE (:start IS NULL OR b.created_at >= :start)
            AND (:end IS NULL OR b.created_at <= :end)
            AND (:vehicleType IS NULL OR v.type = :vehicleType)
            AND (:status IS NULL OR b.status = :status)
            GROUP BY b.status
            """, nativeQuery = true)
    List<Object[]> countGroupByStatusFiltered(
            @Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = """
            SELECT COUNT(b.id) FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE b.status NOT IN ('CANCELLED', 'PAYMENT_FAILED')
            AND (:start IS NULL OR b.created_at >= :start)
            AND (:end IS NULL OR b.created_at <= :end)
            AND (:vehicleType IS NULL OR v.type = :vehicleType)
            AND (:status IS NULL OR b.status = :status)
            """, nativeQuery = true)
    long countFiltered(
            @Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = """
            SELECT v.type, COUNT(b.id) AS cnt
            FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id
            WHERE b.status NOT IN ('CANCELLED', 'PAYMENT_FAILED')
            AND (:start IS NULL OR b.created_at >= :start)
            AND (:end IS NULL OR b.created_at <= :end)
            GROUP BY v.type ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> countByVehicleTypeFiltered(
            @Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'PENDING'")
    long countPendingBookings();

    @Query(value = "SELECT AVG(DATEDIFF(b.end_date, b.start_date)) FROM bookings b " +
                   "WHERE b.status NOT IN ('CANCELLED','PAYMENT_FAILED') " +
                   "AND (:start IS NULL OR b.created_at >= :start) " +
                   "AND (:end IS NULL OR b.created_at <= :end)", nativeQuery = true)
    Double avgRentalDays(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT AVG(DATEDIFF(b.start_date, DATE(b.created_at))) FROM bookings b " +
                   "WHERE b.status NOT IN ('CANCELLED','PAYMENT_FAILED') " +
                   "AND (:start IS NULL OR b.created_at >= :start) " +
                   "AND (:end IS NULL OR b.created_at <= :end)", nativeQuery = true)
    Double avgLeadTimeDays(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(b.id) FROM bookings b WHERE b.status = 'CANCELLED' " +
                   "AND (:start IS NULL OR b.created_at >= :start) " +
                   "AND (:end IS NULL OR b.created_at <= :end)", nativeQuery = true)
    long countCancelledFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(b.id) FROM bookings b WHERE b.status = 'COMPLETED' " +
                   "AND (:start IS NULL OR b.created_at >= :start) " +
                   "AND (:end IS NULL OR b.created_at <= :end)", nativeQuery = true)
    long countCompletedFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(b.id) FROM bookings b " +
                   "WHERE (:start IS NULL OR b.created_at >= :start) " +
                   "AND (:end IS NULL OR b.created_at <= :end)", nativeQuery = true)
    long countTotalFiltered(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = """
            SELECT b.customer_id, u.full_name,
                   COUNT(b.id) AS booking_count,
                   COALESCE(SUM(p.amount), 0) AS total_spend
            FROM bookings b
            JOIN users u ON u.id = b.customer_id
            LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'PAID'
            WHERE b.status NOT IN ('CANCELLED','PAYMENT_FAILED')
            AND (:start IS NULL OR b.created_at >= :start)
            AND (:end IS NULL OR b.created_at <= :end)
            GROUP BY b.customer_id, u.full_name
            ORDER BY total_spend DESC LIMIT 5
            """, nativeQuery = true)
    List<Object[]> findTopCustomers(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = """
            SELECT DAYOFWEEK(b.created_at) AS dow, COUNT(b.id) AS cnt
            FROM bookings b
            WHERE (:start IS NULL OR b.created_at >= :start)
            AND (:end IS NULL OR b.created_at <= :end)
            GROUP BY dow ORDER BY dow
            """, nativeQuery = true)
    List<Object[]> countByDayOfWeek(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
