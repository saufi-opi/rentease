package com.rentease.backend.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy");

    @Async
    public void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} | subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            // Swallow — email failures must not roll back business transactions
        }
    }

    public void sendBookingCreatedEmail(
            String toEmail, String customerName, String confirmationRef,
            String vehicleBrand, String vehicleModel,
            LocalDate startDate, LocalDate endDate, BigDecimal totalCost) {

        String subject = "Booking Received — " + confirmationRef + " | RentEase";
        String body = """
                <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:auto">
                  <div style="background:#f97316;padding:24px;border-radius:8px 8px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">Booking Received</h1>
                  </div>
                  <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Your booking has been received and is <strong>pending payment</strong>.</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0">
                      <tr><td style="padding:8px;color:#6b7280">Confirmation Ref</td>
                          <td style="padding:8px;font-weight:bold">%s</td></tr>
                      <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Vehicle</td>
                          <td style="padding:8px">%s %s</td></tr>
                      <tr><td style="padding:8px;color:#6b7280">Rental Period</td>
                          <td style="padding:8px">%s → %s</td></tr>
                      <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Total Cost</td>
                          <td style="padding:8px;font-weight:bold">RM %.2f</td></tr>
                    </table>
                    <p style="color:#6b7280;font-size:13px">
                      Please complete your payment within 30 minutes to confirm the booking.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px">RentEase — Your trusted car rental partner</p>
                  </div>
                </body></html>
                """.formatted(
                customerName, confirmationRef,
                vehicleBrand, vehicleModel,
                startDate.format(DATE_FMT), endDate.format(DATE_FMT),
                totalCost
        );
        send(toEmail, subject, body);
    }

    public void sendPaymentConfirmedEmail(
            String toEmail, String customerName, String confirmationRef,
            BigDecimal amount, String paymentMethod) {

        String subject = "Payment Confirmed — " + confirmationRef + " | RentEase";
        String body = """
                <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:auto">
                  <div style="background:#16a34a;padding:24px;border-radius:8px 8px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">Payment Receipt</h1>
                  </div>
                  <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi <strong>%s</strong>, your payment was successful!</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0">
                      <tr><td style="padding:8px;color:#6b7280">Confirmation Ref</td>
                          <td style="padding:8px;font-weight:bold">%s</td></tr>
                      <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Amount Paid</td>
                          <td style="padding:8px;font-weight:bold;color:#16a34a">RM %.2f</td></tr>
                      <tr><td style="padding:8px;color:#6b7280">Payment Method</td>
                          <td style="padding:8px">%s</td></tr>
                    </table>
                    <p>Your booking is now <strong>CONFIRMED</strong>. See you on your rental day!</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px">RentEase — Your trusted car rental partner</p>
                  </div>
                </body></html>
                """.formatted(
                customerName, confirmationRef, amount,
                paymentMethod != null ? paymentMethod : "Online Payment"
        );
        send(toEmail, subject, body);
    }

    public void sendBookingCancelledEmail(
            String toEmail, String customerName, String confirmationRef,
            String reason, BigDecimal refundAmount) {

        String refundInfo = (refundAmount != null && refundAmount.compareTo(BigDecimal.ZERO) > 0)
                ? "<p>A refund of <strong>RM " + String.format("%.2f", refundAmount)
                  + "</strong> has been initiated and will appear in 3–5 business days.</p>"
                : "<p>No refund is applicable for this cancellation.</p>";

        String subject = "Booking Cancelled — " + confirmationRef + " | RentEase";
        String body = """
                <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:auto">
                  <div style="background:#dc2626;padding:24px;border-radius:8px 8px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">Booking Cancelled</h1>
                  </div>
                  <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Your booking <strong>%s</strong> has been cancelled.</p>
                    <p style="color:#6b7280">Reason: %s</p>
                    %s
                    <hr style="border:none;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px">RentEase — Your trusted car rental partner</p>
                  </div>
                </body></html>
                """.formatted(
                customerName, confirmationRef,
                reason != null ? reason : "Cancelled by customer",
                refundInfo
        );
        send(toEmail, subject, body);
    }

    public void sendBookingStatusChangedEmail(
            String toEmail, String customerName, String confirmationRef, String newStatus) {

        boolean isActive = "ACTIVE".equalsIgnoreCase(newStatus);
        String color = isActive ? "#2563eb" : "#6b7280";
        String headline = isActive ? "Your Rental Has Started!" : "Booking Completed";
        String message = isActive
                ? "Your rental is now <strong>ACTIVE</strong>. Enjoy your drive!"
                : "Your rental has been marked <strong>COMPLETED</strong>. Thank you for choosing RentEase!";

        String subject = headline + " — " + confirmationRef + " | RentEase";
        String body = """
                <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:auto">
                  <div style="background:%s;padding:24px;border-radius:8px 8px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">%s</h1>
                  </div>
                  <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Booking reference: <strong>%s</strong></p>
                    <p>%s</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px">RentEase — Your trusted car rental partner</p>
                  </div>
                </body></html>
                """.formatted(color, headline, customerName, confirmationRef, message);
        send(toEmail, subject, body);
    }

    public void sendOtpEmail(String toEmail, String fullName, String code, int expiryMinutes) {
        String subject = "Your RentEase Login Code";
        String body = """
                <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:auto">
                  <div style="background:#f97316;padding:24px;border-radius:8px 8px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:22px">Two-Factor Authentication</h1>
                  </div>
                  <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Your one-time login code is:</p>
                    <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;
                                background:#f3f4f6;padding:20px;border-radius:8px;margin:16px 0">
                      %s
                    </div>
                    <p style="color:#6b7280">This code expires in <strong>%d minutes</strong>. Do not share it.</p>
                    <p style="color:#6b7280;font-size:13px">
                      If you did not request this, please contact your system administrator.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px">RentEase Admin Portal</p>
                  </div>
                </body></html>
                """.formatted(fullName, code, expiryMinutes);
        send(toEmail, subject, body);
    }
}
