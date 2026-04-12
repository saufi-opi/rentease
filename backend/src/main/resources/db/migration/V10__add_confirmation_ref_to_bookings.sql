-- V10: Add confirmation reference to bookings
ALTER TABLE bookings ADD COLUMN confirmation_ref VARCHAR(20);
