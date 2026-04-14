package com.rentease.backend.booking.service;

import com.rentease.backend.booking.model.Booking;
import com.rentease.backend.booking.model.BookingStatus;
import com.rentease.backend.booking.repository.BookingRepository;
import com.rentease.backend.payment.model.PaymentStatus;
import com.rentease.backend.payment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cancels PENDING bookings that have received no successful payment within
 * 30 minutes of creation. Voids the associated Stripe PaymentIntent so the
 * customer cannot pay after expiry.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpirationJob {

    private static final int EXPIRY_MINUTES = 30;

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @Scheduled(fixedRate = 3_600_000) // runs every hour
    @Transactional
    public void expireUnpaidBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(EXPIRY_MINUTES);

        List<Booking> candidates = bookingRepository
                .findByStatusAndCreatedAtBefore(BookingStatus.PENDING, cutoff);

        if (candidates.isEmpty()) return;

        log.info("Expiration job: checking {} PENDING bookings older than {} minutes",
                candidates.size(), EXPIRY_MINUTES);

        for (Booking booking : candidates) {
            paymentRepository.findByBookingId(booking.getId()).ifPresentOrElse(payment -> {
                // Skip if payment already succeeded
                if (payment.getStatus() == PaymentStatus.PAID) return;

                // Void the Stripe intent so it can no longer be paid
                if (payment.getStatus() == PaymentStatus.PENDING
                        && payment.getGatewayTransactionId() != null) {
                    try {
                        PaymentIntent.retrieve(payment.getGatewayTransactionId()).cancel();
                    } catch (StripeException e) {
                        log.warn("Could not cancel Stripe intent {}: {}",
                                payment.getGatewayTransactionId(), e.getMessage());
                    }
                }

                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment not received within " + EXPIRY_MINUTES + " minutes");
                paymentRepository.save(payment);

                expireBooking(booking);
            }, () -> expireBooking(booking)); // no payment record — cancel booking directly
        }
    }

    private void expireBooking(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        log.info("Expired booking {} ({})", booking.getConfirmationRef(), booking.getId());
    }
}
