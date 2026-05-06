package com.rentease.backend.auth.controller;

import com.rentease.backend.auth.model.AuthToken;
import com.rentease.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.getEmail(), request.getPassword());
    }

    @PostMapping("/verify-otp")
    public AuthToken verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyOtp(request.getEmail(), request.getOtp());
    }
}
