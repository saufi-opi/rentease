-- V5: Create maintenance tables (merged Inspection + Task from original ERD)
CREATE TABLE maintenance_records (
    id BINARY(16) NOT NULL,
    vehicle_id BINARY(16) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by BINARY(16),
    created_at DATETIME(6),
    completed_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_maintenance_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);

CREATE TABLE maintenance_tasks (
    id BINARY(16) NOT NULL,
    maintenance_id BINARY(16) NOT NULL,
    assigned_to BINARY(16),
    description TEXT,
    scheduled_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_maintenance FOREIGN KEY (maintenance_id) REFERENCES maintenance_records(id),
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tasks_maintenance ON maintenance_tasks(maintenance_id);
