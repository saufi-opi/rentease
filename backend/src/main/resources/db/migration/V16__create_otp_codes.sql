CREATE TABLE otp_codes (
    id         BINARY(16)   NOT NULL,
    email      VARCHAR(150) NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    created_at DATETIME(6)  NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_otp_codes_email ON otp_codes(email);
