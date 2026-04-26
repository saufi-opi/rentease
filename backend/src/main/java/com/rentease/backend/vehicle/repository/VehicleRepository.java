package com.rentease.backend.vehicle.repository;

import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID>, JpaSpecificationExecutor<Vehicle> {
    List<Vehicle> findByAvailabilityStatus(AvailabilityStatus status);
    java.util.Optional<Vehicle> findByBrandAndModel(String brand, String model);

    @Query(value = """
            SELECT v.* FROM vehicles v
            INNER JOIN bookings b ON b.vehicle_id = v.id
            WHERE b.status NOT IN ('CANCELLED', 'PAYMENT_FAILED')
            GROUP BY v.id
            ORDER BY COUNT(b.id) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Vehicle> findPopularVehicles(@Param("limit") int limit);

    @Query("SELECT v.availabilityStatus, COUNT(v) FROM Vehicle v GROUP BY v.availabilityStatus")
    List<Object[]> countGroupByAvailabilityStatus();

    @Query(value = """
            SELECT v.id, v.brand, v.model, v.type,
                   COUNT(b.id) AS booking_count,
                   COALESCE(SUM(p.amount), 0) AS revenue
            FROM vehicles v
            LEFT JOIN bookings b ON b.vehicle_id = v.id
              AND b.status NOT IN ('CANCELLED', 'PAYMENT_FAILED')
              AND (:start IS NULL OR b.created_at >= :start)
              AND (:end IS NULL OR b.created_at <= :end)
              AND (:status IS NULL OR b.status = :status)
            LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'PAID'
            WHERE (:vehicleType IS NULL OR v.type = :vehicleType)
            GROUP BY v.id, v.brand, v.model, v.type
            ORDER BY booking_count DESC LIMIT 10
            """, nativeQuery = true)
    List<Object[]> findTopVehiclesFiltered(
            @Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end,
            @Param("vehicleType") String vehicleType,
            @Param("status") String status);

    @Query(value = """
            SELECT v.type,
                   COUNT(DISTINCT v.id) AS total_vehicles,
                   COALESCE(SUM(DATEDIFF(b.end_date, b.start_date)), 0) AS rented_days,
                   COUNT(DISTINCT v.id) * GREATEST(DATEDIFF(:end, :start), 1) AS total_available_days
            FROM vehicles v
            LEFT JOIN bookings b ON b.vehicle_id = v.id
              AND b.status IN ('ACTIVE','COMPLETED')
              AND b.start_date <= :end
              AND b.end_date >= :start
            GROUP BY v.type
            """, nativeQuery = true)
    List<Object[]> findUtilizationByVehicleType(
            @Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end);
}
