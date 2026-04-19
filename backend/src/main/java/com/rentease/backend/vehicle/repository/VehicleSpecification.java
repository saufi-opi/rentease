package com.rentease.backend.vehicle.repository;

import com.rentease.backend.booking.model.Booking;
import com.rentease.backend.booking.model.BookingStatus;
import com.rentease.backend.maintenance.model.MaintenanceRecord;
import com.rentease.backend.maintenance.model.MaintenanceStatus;
import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;

public class VehicleSpecification {

    public static Specification<Vehicle> hasType(String type) {
        return (root, query, cb) -> {
            if (type == null || type.isBlank()) return null;
            return cb.equal(cb.lower(root.get("type")), type.toLowerCase());
        };
    }

    public static Specification<Vehicle> hasBrand(String brand) {
        return (root, query, cb) -> {
            if (brand == null || brand.isBlank()) return null;
            return cb.equal(cb.lower(root.get("brand")), brand.toLowerCase());
        };
    }

    public static Specification<Vehicle> hasStatus(AvailabilityStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            return cb.equal(root.get("availabilityStatus"), status);
        };
    }

    public static Specification<Vehicle> searchByKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("brand")), pattern),
                cb.like(cb.lower(root.get("model")), pattern),
                cb.like(cb.lower(root.get("type")), pattern)
            );
        };
    }

    public static Specification<Vehicle> isAvailableForCustomer() {
        return (root, query, cb) ->
            cb.equal(root.get("availabilityStatus"), AvailabilityStatus.AVAILABLE);
    }

    /**
     * Excludes vehicles that have any non-cancelled booking overlapping [startDate, endDate).
     * Used when the customer provides a date range on the browse page.
     */
    public static Specification<Vehicle> isAvailableForDates(LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            if (startDate == null || endDate == null) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            Root<Booking> bookingRoot = sub.from(Booking.class);
            sub.select(cb.literal(1L));
            sub.where(cb.and(
                    cb.equal(bookingRoot.get("vehicle").get("id"), root.get("id")),
                    cb.notEqual(bookingRoot.get("status"), BookingStatus.CANCELLED),
                    cb.lessThan(bookingRoot.get("startDate"), endDate),
                    cb.greaterThan(bookingRoot.get("endDate"), startDate)
            ));
            return cb.not(cb.exists(sub));
        };
    }

    /**
     * Excludes vehicles with a SCHEDULED or IN_PROGRESS maintenance record
     * whose window overlaps [startDate, endDate). Applied alongside isAvailableForDates.
     */
    public static Specification<Vehicle> hasNoMaintenanceInWindow(LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            if (startDate == null || endDate == null) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            Root<MaintenanceRecord> mRoot = sub.from(MaintenanceRecord.class);
            sub.select(cb.literal(1L));
            sub.where(cb.and(
                    cb.equal(mRoot.get("vehicle").get("id"), root.get("id")),
                    cb.or(
                            cb.equal(mRoot.get("status"), MaintenanceStatus.SCHEDULED),
                            cb.equal(mRoot.get("status"), MaintenanceStatus.IN_PROGRESS)
                    ),
                    cb.lessThan(mRoot.get("scheduledStartDate"), endDate),
                    cb.greaterThan(mRoot.get("estimatedEndDate"), startDate)
            ));
            return cb.not(cb.exists(sub));
        };
    }

    public static Specification<Vehicle> hasPriceRange(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        return (root, query, cb) -> {
            if (minPrice == null && maxPrice == null) return null;
            if (minPrice != null && maxPrice != null)
                return cb.between(root.get("rentalRate"), minPrice, maxPrice);
            if (minPrice != null)
                return cb.greaterThanOrEqualTo(root.get("rentalRate"), minPrice);
            return cb.lessThanOrEqualTo(root.get("rentalRate"), maxPrice);
        };
    }
}
