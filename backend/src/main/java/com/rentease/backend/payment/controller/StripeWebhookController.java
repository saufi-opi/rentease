package com.rentease.backend.payment.controller;

import com.rentease.backend.payment.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

/**
 * Receives Stripe webhook events to reliably sync payment state even when the
 * browser closes before the client-side /payments/confirm call completes.
 *
 * Local testing: stripe listen --forward-to localhost:8081/api/v1/webhooks/stripe
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    private final PaymentService paymentService;

    @PostMapping("/api/v1/webhooks/stripe")
    public ResponseEntity<String> handleWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {

        try {
            byte[] payloadBytes = request.getInputStream().readAllBytes();
            String payload = new String(payloadBytes, StandardCharsets.UTF_8);

            if (webhookSecret == null || webhookSecret.isBlank()) {
                log.warn("STRIPE_WEBHOOK_SECRET not configured — webhook ignored");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook secret not configured");
            }
            if (sigHeader == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing Stripe-Signature header");
            }

            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            log.info("Stripe webhook: {}", event.getType());

            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();

            switch (event.getType()) {
                case "payment_intent.succeeded" -> {
                    if (deserializer.getObject().isPresent()) {
                        PaymentIntent intent = (PaymentIntent) deserializer.getObject().get();
                        try {
                            paymentService.confirmPayment(intent.getId());
                            log.info("Webhook confirmed payment for intent {}", intent.getId());
                        } catch (Exception e) {
                            // Payment may already be confirmed client-side — idempotent, log and continue
                            log.info("Webhook confirmPayment skipped ({}): {}", intent.getId(), e.getMessage());
                        }
                    }
                }
                case "payment_intent.payment_failed" -> {
                    if (deserializer.getObject().isPresent()) {
                        PaymentIntent intent = (PaymentIntent) deserializer.getObject().get();
                        String reason = intent.getLastPaymentError() != null
                                ? intent.getLastPaymentError().getMessage()
                                : "Payment failed";
                        paymentService.handleFailedPayment(intent.getId(), reason);
                        log.info("Webhook recorded failure for intent {}", intent.getId());
                    }
                }
                default -> log.debug("Unhandled webhook event: {}", event.getType());
            }

            return ResponseEntity.ok("Received");

        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            log.error("Stripe webhook error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook error");
        }
    }
}
