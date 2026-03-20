package com.rentease.backend.vehicle.repository;

import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import org.springframework.data.jpa.domain.Specification;

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
}
