package com.rentease.backend.auth.model;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthToken {
    private String accessToken;
    private String tokenType;
    private long expiresIn;
}
