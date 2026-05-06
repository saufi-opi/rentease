package com.rentease.backend.auth.service;

import com.rentease.backend.auth.model.OtpCode;
import com.rentease.backend.auth.repository.OtpCodeRepository;
import com.rentease.backend.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Transactional
    public void generateAndSend(String email, String fullName) {
        otpCodeRepository.deleteAllByEmail(email);

        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();

        otpCodeRepository.save(OtpCode.builder()
                .email(email)
                .code(code)
                .createdAt(now)
                .expiresAt(now.plusMinutes(expiryMinutes))
                .used(false)
                .build());

        emailService.sendOtpEmail(email, fullName, code, expiryMinutes);
    }

    @Transactional
    public boolean verifyOtp(String email, String code) {
        return otpCodeRepository
                .findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, LocalDateTime.now())
                .filter(otp -> otp.getCode().equals(code))
                .map(otp -> {
                    otp.setUsed(true);
                    otpCodeRepository.save(otp);
                    return true;
                })
                .orElse(false);
    }
}
