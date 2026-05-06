package com.rentease.backend.auth.service;

import com.rentease.backend.auth.controller.LoginResponse;
import com.rentease.backend.auth.model.AuthToken;
import com.rentease.backend.auth.security.JwtTokenProvider;
import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<Role> TWO_FA_ROLES = Set.of(Role.ADMIN, Role.TOP_MANAGEMENT);

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (TWO_FA_ROLES.contains(user.getRole())) {
            otpService.generateAndSend(email, user.getFullName());
            return LoginResponse.builder()
                    .requiresOtp(true)
                    .email(email)
                    .build();
        }

        AuthToken token = tokenProvider.generateToken(user);
        return LoginResponse.builder()
                .accessToken(token.getAccessToken())
                .tokenType(token.getTokenType())
                .expiresIn(token.getExpiresIn())
                .build();
    }

    public AuthToken verifyOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return tokenProvider.generateToken(user);
    }
}
