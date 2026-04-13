package com.rentease.backend.payment.controller;

import com.rentease.backend.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ── Customer endpoints ─────────────────────────────────────────────────

    @PostMapping("/api/v1/payments/create-intent")
    public PaymentIntentResponse createPaymentIntent(@Valid @RequestBody CreatePaymentIntentRequest request) {
        return paymentService.createPaymentIntent(request.getBookingId());
    }

    @PostMapping("/api/v1/payments/confirm")
    public PaymentResponse confirmPayment(@Valid @RequestBody ConfirmPaymentRequest request) {
        return paymentService.confirmPayment(request.getPaymentIntentId());
    }

    @PostMapping("/api/v1/payments/failed")
    public void handleFailedPayment(@Valid @RequestBody FailedPaymentRequest request) {
        paymentService.handleFailedPayment(request.getPaymentIntentId(), request.getReason());
    }

    @GetMapping("/api/v1/payments/booking/{bookingId}")
    public PaymentResponse getPaymentByBooking(@PathVariable UUID bookingId) {
        return paymentService.getByBookingId(bookingId);
    }

    // ── Admin endpoints ────────────────────────────────────────────────────

    @GetMapping("/api/v1/admin/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<PaymentResponse> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return paymentService.getAllPayments(PageRequest.of(page, size));
    }

    @PostMapping("/api/v1/admin/payments/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse refund(
            @PathVariable UUID id,
            @RequestBody(required = false) RefundRequest request
    ) {
        return paymentService.refund(id, request != null ? request.getAmount() : null);
    }

    @GetMapping("/api/v1/admin/payments/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public RevenueResponse getRevenue() {
        return paymentService.getRevenue();
    }
}
