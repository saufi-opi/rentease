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
}
