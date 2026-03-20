package com.rentease.backend.auth.security;

import com.rentease.backend.auth.model.AuthToken;
import com.rentease.backend.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret:verysecretkeythatshouldbelongerthan256bits}")
    private String secret;

    @Value("${app.jwt.expiration:259200000}")
    private long expiration;

    public AuthToken generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .claim("role", user.getRole().name())
                .signWith(key)
                .compact();

        return AuthToken.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expiration / 1000)
                .build();
    }

    public String getEmailFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
