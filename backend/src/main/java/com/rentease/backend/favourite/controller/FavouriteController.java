package com.rentease.backend.favourite.controller;

import com.rentease.backend.favourite.service.FavouriteService;
import com.rentease.backend.vehicle.controller.VehicleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FavouriteController {

    private final FavouriteService favouriteService;

    @PostMapping("/api/v1/favourites/{vehicleId}")
    public FavouriteToggleResponse toggle(@PathVariable UUID vehicleId) {
        return favouriteService.toggle(vehicleId);
    }

    @GetMapping("/api/v1/favourites")
    public List<VehicleResponse> getFavourites() {
        return favouriteService.getFavourites();
    }

    @GetMapping("/api/v1/favourites/ids")
    public List<UUID> getFavouriteIds() {
        return favouriteService.getFavouriteIds();
    }
}
