package com.rentease.backend.booking.service;

import com.rentease.backend.auth.security.SecurityUtils;
import com.rentease.backend.booking.controller.BookingRequest;
import com.rentease.backend.booking.controller.BookingResponse;
import com.rentease.backend.booking.model.Booking;
import com.rentease.backend.booking.model.BookingStatus;
import com.rentease.backend.booking.repository.BookingRepository;
import com.rentease.backend.common.exception.ConflictException;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.payment.repository.PaymentRepository;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.repository.UserRepository;
import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();

        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        if (vehicle.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
            throw new ConflictException("Vehicle is not available for booking");
        }

        long conflicts = bookingRepository.countConflicts(
                vehicle.getId(), request.getStartDate(), request.getEndDate(),
                List.of(BookingStatus.CANCELLED));
        if (conflicts > 0) {
            throw new ConflictException("Vehicle is already booked for the selected dates");
        }

        User customer = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        BigDecimal dailyRate = calculateDailyRate(vehicle);
        BigDecimal totalCost = dailyRate.multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP);

        String confirmationRef = "RB-" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 8).toUpperCase();

        Booking booking = Booking.builder()
                .customer(customer)
                .vehicle(vehicle)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalCost(totalCost)
                .status(BookingStatus.PENDING)
                .confirmationRef(confirmationRef)
                .build();

        return mapToResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getMyBookings() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return bookingRepository.findByCustomer_IdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    public BookingResponse getBookingById(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        return mapToResponse(booking);
    }

    @Transactional
    public void cancelBooking(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only PENDING or CONFIRMED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    public Page<BookingResponse> getAllBookings(String statusFilter, Pageable pageable) {
        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                BookingStatus status = BookingStatus.valueOf(statusFilter.toUpperCase());
                return bookingRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                        .map(this::mapToResponse);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return bookingRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToResponse);
    }

    @Transactional
    public BookingResponse updateBookingStatus(UUID id, String newStatusStr) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid booking status: " + newStatusStr);
        }

        Vehicle vehicle = booking.getVehicle();

        if (newStatus == BookingStatus.ACTIVE) {
            vehicle.setAvailabilityStatus(AvailabilityStatus.BOOKED);
            vehicleRepository.save(vehicle);
        } else if ((newStatus == BookingStatus.COMPLETED || newStatus == BookingStatus.CANCELLED)
                && booking.getStatus() == BookingStatus.ACTIVE) {
            vehicle.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        booking.setStatus(newStatus);
        return mapToResponse(bookingRepository.save(booking));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private BigDecimal calculateDailyRate(Vehicle vehicle) {
        if (vehicle.getDiscount() != null && vehicle.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal multiplier = BigDecimal.ONE.subtract(
                    vehicle.getDiscount().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            return vehicle.getRentalRate().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        }
        return vehicle.getRentalRate();
    }

    private BookingResponse mapToResponse(Booking booking) {
        Vehicle vehicle = booking.getVehicle();
        User customer = booking.getCustomer();
        long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate());

        String imageUrl = vehicle.getImageUrl();
        if (imageUrl != null && !imageUrl.startsWith("http") && !imageUrl.startsWith("/assets")) {
            try {
                imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                        .path("/uploads/").path(imageUrl).toUriString();
            } catch (Exception e) {
                imageUrl = "/uploads/" + imageUrl;
            }
        }

        String paymentStatus = paymentRepository.findByBookingId(booking.getId())
                .map(p -> p.getStatus().name())
                .orElse(null);

        return BookingResponse.builder()
                .id(booking.getId())
                .vehicleId(vehicle.getId().toString())
                .vehicleBrand(vehicle.getBrand())
                .vehicleModel(vehicle.getModel())
                .vehicleType(vehicle.getType())
                .vehicleImageUrl(imageUrl)
                .vehicleRentalRate(vehicle.getRentalRate())
                .customerId(customer.getId().toString())
                .customerName(customer.getFullName())
                .customerEmail(customer.getEmail())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .rentalDays((int) days)
                .totalCost(booking.getTotalCost())
                .status(booking.getStatus().name())
                .paymentStatus(paymentStatus)
                .confirmationRef(booking.getConfirmationRef())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
