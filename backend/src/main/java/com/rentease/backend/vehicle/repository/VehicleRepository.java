package com.rentease.backend.vehicle.repository;

import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID>, JpaSpecificationExecutor<Vehicle> {
    List<Vehicle> findByAvailabilityStatus(AvailabilityStatus status);
    java.util.Optional<Vehicle> findByBrandAndModel(String brand, String model);
}
