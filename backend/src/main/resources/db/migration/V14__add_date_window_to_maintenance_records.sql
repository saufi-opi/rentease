ALTER TABLE maintenance_records
    ADD COLUMN scheduled_start_date DATE NOT NULL DEFAULT (CURDATE()),
    ADD COLUMN estimated_end_date   DATE NOT NULL DEFAULT (DATE_ADD(CURDATE(), INTERVAL 1 DAY));

CREATE INDEX idx_maintenance_dates
    ON maintenance_records (vehicle_id, scheduled_start_date, estimated_end_date, status);
