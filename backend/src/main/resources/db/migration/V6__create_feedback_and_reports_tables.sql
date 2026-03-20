-- V6: Create feedback and damage reports tables
CREATE TABLE feedbacks (
    id BINARY(16) NOT NULL,
    customer_id BINARY(16) NOT NULL,
    vehicle_id BINARY(16) NOT NULL,
    booking_id BINARY(16),
    rating INT NOT NULL,
    comments TEXT,
    created_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_feedbacks_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_feedbacks_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_feedbacks_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_feedbacks_vehicle ON feedbacks(vehicle_id);
CREATE INDEX idx_feedbacks_customer ON feedbacks(customer_id);

CREATE TABLE damage_reports (
    id BINARY(16) NOT NULL,
    customer_id BINARY(16) NOT NULL,
    vehicle_id BINARY(16) NOT NULL,
    booking_id BINARY(16),
    description TEXT NOT NULL,
    report_date DATETIME(6),
    created_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_damage_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_damage_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_damage_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_damage_vehicle ON damage_reports(vehicle_id);
