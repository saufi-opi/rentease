package com.rentease.backend.auth.repository;

import com.rentease.backend.auth.model.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    Optional<OtpCode> findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, LocalDateTime now);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.email = :email")
    void deleteAllByEmail(String email);
}
