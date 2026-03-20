-- V2: Create vehicles table
CREATE TABLE vehicles (
    id BINARY(16) NOT NULL,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    rental_rate DECIMAL(10, 2) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    image_url VARCHAR(500),
    registration_date DATE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
