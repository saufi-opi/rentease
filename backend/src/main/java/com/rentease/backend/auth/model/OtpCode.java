package com.rentease.backend.auth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "otp_codes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpCode {

    @Id
    private UUID id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }
}
