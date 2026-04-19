package com.rentease.backend.booking.controller;

import com.rentease.backend.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── Customer endpoints ─────────────────────────────────────────────────

    @PostMapping("/api/v1/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    @GetMapping("/api/v1/bookings")
    public List<BookingResponse> getMyBookings() {
        return bookingService.getMyBookings();
    }

    @GetMapping("/api/v1/bookings/{id}")
    public BookingResponse getBookingById(@PathVariable UUID id) {
        return bookingService.getBookingById(id);
    }

    @DeleteMapping("/api/v1/bookings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelBooking(@PathVariable UUID id) {
        bookingService.cancelBooking(id);
    }

    // ── Admin endpoints ────────────────────────────────────────────────────

    @GetMapping("/api/v1/admin/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<BookingResponse> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String vehicleId
    ) {
        return bookingService.getAllBookings(status, vehicleId, PageRequest.of(page, size));
    }

    @PutMapping("/api/v1/admin/bookings/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse updateBookingStatus(
            @PathVariable UUID id,
            @Valid @RequestBody BookingStatusUpdateRequest request
    ) {
        return bookingService.updateBookingStatus(id, request.getStatus());
    }
}
