package com.rentease.backend.auth.controller;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType;
    private Long expiresIn;
    private Boolean requiresOtp;
    private String email;
}
