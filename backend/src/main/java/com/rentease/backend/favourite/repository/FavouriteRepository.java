package com.rentease.backend.favourite.repository;

import com.rentease.backend.favourite.model.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavouriteRepository extends JpaRepository<Favourite, UUID> {

    List<Favourite> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Optional<Favourite> findByUser_IdAndVehicle_Id(UUID userId, UUID vehicleId);

    @Query("SELECT f.vehicle.id FROM Favourite f WHERE f.user.id = :userId")
    List<UUID> findVehicleIdsByUserId(@Param("userId") UUID userId);
}
