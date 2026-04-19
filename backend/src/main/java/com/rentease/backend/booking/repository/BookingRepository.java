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
}
