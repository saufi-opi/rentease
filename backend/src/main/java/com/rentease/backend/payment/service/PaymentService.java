package com.rentease.backend.payment.service;

import com.rentease.backend.booking.model.Booking;
import com.rentease.backend.booking.repository.BookingRepository;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.payment.controller.*;
import com.rentease.backend.payment.model.Payment;
import com.rentease.backend.payment.model.PaymentStatus;
import com.rentease.backend.payment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.publishable-key}")
    private String stripePublishableKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @Transactional
    public PaymentIntentResponse createPaymentIntent(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // If a pending payment already exists for this booking, return its intent
        paymentRepository.findByBookingId(bookingId).ifPresent(existing -> {
            if (existing.getStatus() == PaymentStatus.PENDING) {
                paymentRepository.delete(existing);
            }
        });

        BigDecimal amount = booking.getTotalCost();
        // Stripe uses smallest currency unit (cents). MYR: multiply by 100
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("myr")
                    .addAllPaymentMethodType(List.of("card", "fpx"))
                    .putMetadata("bookingId", bookingId.toString())
                    .putMetadata("confirmationRef", booking.getConfirmationRef())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            Payment payment = Payment.builder()
                    .booking(booking)
                    .amount(amount)
                    .status(PaymentStatus.PENDING)
                    .gatewayTransactionId(intent.getId())
                    .build();
            payment = paymentRepository.save(payment);

            return PaymentIntentResponse.builder()
                    .clientSecret(intent.getClientSecret())
                    .publishableKey(stripePublishableKey)
                    .paymentId(payment.getId())
                    .amount(amount)
                    .build();

        } catch (StripeException e) {
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
        }
    }

    @Transactional
    public PaymentResponse confirmPayment(String paymentIntentId) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

            if (!"succeeded".equals(intent.getStatus())) {
                throw new RuntimeException("Payment has not succeeded. Current status: " + intent.getStatus());
            }

            Payment payment = paymentRepository.findByGatewayTransactionId(paymentIntentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

            String chargeId = intent.getLatestCharge();
            String paymentMethodType = intent.getPaymentMethodTypes() != null && !intent.getPaymentMethodTypes().isEmpty()
                    ? intent.getPaymentMethodTypes().get(0).toUpperCase()
                    : null;

            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.now());
            payment.setGatewayRef(chargeId);
            payment.setPaymentType(paymentMethodType);
            payment.setPaymentMethod(paymentMethodType);

            return mapToResponse(paymentRepository.save(payment));

        } catch (StripeException e) {
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void handleFailedPayment(String paymentIntentId, String reason) {
        paymentRepository.findByGatewayTransactionId(paymentIntentId).ifPresent(payment -> {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(reason != null ? reason : "Payment declined");
            paymentRepository.save(payment);
        });
    }

    public PaymentResponse getByBookingId(UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for this booking"));
        return mapToResponse(payment);
    }

    public Page<PaymentResponse> getAllPayments(Pageable pageable) {
        return paymentRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToResponse);
    }

    @Transactional
    public PaymentResponse refund(UUID paymentId, BigDecimal refundAmount) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new RuntimeException("Only PAID payments can be refunded");
        }
        if (payment.getGatewayTransactionId() == null) {
            throw new RuntimeException("No gateway transaction ID on this payment");
        }

        BigDecimal amountToRefund = refundAmount != null ? refundAmount : payment.getAmount();
        long amountInCents = amountToRefund.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();

        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getGatewayTransactionId())
                    .setAmount(amountInCents)
                    .build();

            Refund stripeRefund = Refund.create(params);

            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundId(stripeRefund.getId());
            payment.setRefundAmount(amountToRefund);
            payment.setRefundedAt(LocalDateTime.now());

            return mapToResponse(paymentRepository.save(payment));

        } catch (StripeException e) {
            throw new RuntimeException("Failed to process refund: " + e.getMessage(), e);
        }
    }

    public RevenueResponse getRevenue() {
        BigDecimal monthly = paymentRepository.sumPaidAmountsForCurrentMonth(PaymentStatus.PAID);
        BigDecimal total = paymentRepository.sumByStatus(PaymentStatus.PAID);
        return RevenueResponse.builder()
                .monthlyRevenue(monthly)
                .totalRevenue(total)
                .build();
    }

    private PaymentResponse mapToResponse(Payment payment) {
        Booking booking = payment.getBooking();
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(booking.getId())
                .confirmationRef(booking.getConfirmationRef())
                .customerName(booking.getCustomer().getFullName())
                .vehicleName(booking.getVehicle().getBrand() + " " + booking.getVehicle().getModel())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .paymentType(payment.getPaymentType())
                .gatewayTransactionId(payment.getGatewayTransactionId())
                .paymentDate(payment.getPaymentDate())
                .refundAmount(payment.getRefundAmount())
                .refundedAt(payment.getRefundedAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
