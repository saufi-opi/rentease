-- V9: Update vehicle fields and create features table
ALTER TABLE vehicles ADD COLUMN description TEXT;
ALTER TABLE vehicles ADD COLUMN transmission VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE vehicles ADD COLUMN discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00;

CREATE TABLE vehicle_features (
    vehicle_id BINARY(16) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    PRIMARY KEY (vehicle_id, feature),
    CONSTRAINT fk_vehicle_features_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
