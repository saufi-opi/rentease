-- V3: Create bookings table
CREATE TABLE bookings (
    id BINARY(16) NOT NULL,
    customer_id BINARY(16) NOT NULL,
    vehicle_id BINARY(16) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for querying bookings by customer
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
-- Index for checking vehicle availability / double-booking conflicts
CREATE INDEX idx_bookings_vehicle_dates ON bookings(vehicle_id, start_date, end_date);
