package com.rentease.backend.favourite.service;

import com.rentease.backend.auth.security.SecurityUtils;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.favourite.controller.FavouriteToggleResponse;
import com.rentease.backend.favourite.model.Favourite;
import com.rentease.backend.favourite.repository.FavouriteRepository;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.repository.UserRepository;
import com.rentease.backend.vehicle.controller.VehicleResponse;
import com.rentease.backend.vehicle.model.Vehicle;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import com.rentease.backend.vehicle.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavouriteService {

    private final FavouriteRepository favouriteRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;

    @Transactional
    public FavouriteToggleResponse toggle(UUID vehicleId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Optional<Favourite> existing = favouriteRepository.findByUser_IdAndVehicle_Id(userId, vehicleId);
        if (existing.isPresent()) {
            favouriteRepository.delete(existing.get());
            return new FavouriteToggleResponse(false);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        favouriteRepository.save(Favourite.builder().user(user).vehicle(vehicle).build());
        return new FavouriteToggleResponse(true);
    }

    public List<VehicleResponse> getFavourites() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return favouriteRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(f -> vehicleService.getVehicleById(f.getVehicle().getId()))
                .toList();
    }

    public List<UUID> getFavouriteIds() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return favouriteRepository.findVehicleIdsByUserId(userId);
    }
}
