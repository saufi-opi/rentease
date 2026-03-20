-- V4: Create payments table
CREATE TABLE payments (
    id BINARY(16) NOT NULL,
    booking_id BINARY(16) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME(6),
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_booking ON payments(booking_id);
