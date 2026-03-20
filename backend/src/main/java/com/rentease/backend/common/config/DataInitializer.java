package com.rentease.backend.common.config;

import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.model.UserStatus;
import com.rentease.backend.user.repository.UserRepository;
import com.rentease.backend.vehicle.model.AvailabilityStatus;
import com.rentease.backend.vehicle.model.Vehicle;
import com.rentease.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
        initializeVehicles();
    }

    private void initializeAdminUser() {
        String adminEmail = "admin@example.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("Creating default admin user...");

            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("aaAA1234"))
                    .status(UserStatus.ACTIVE)
                    .role(Role.ADMIN)
                    .fullName("System Admin")
                    .build();

            userRepository.save(admin);
            log.info("Default admin user created successfully.");
        }
    }

    private void initializeVehicles() {
        seedVehicle("Car", "Toyota", "Vios", 2023, 150, 5, "Petrol", "seeds/images/toyota_vios.png");
        seedVehicle("Car", "Toyota", "Yaris", 2023, 160, 5, "Petrol", "seeds/images/toyota_yaris.png");
        seedVehicle("Car", "Toyota", "Camry", 2023, 350, 5, "Petrol", "seeds/images/toyota_camry.png");
        seedVehicle("Car", "Toyota", "Corolla", 2023, 200, 5, "Petrol", "seeds/images/toyota_corolla.png");
        seedVehicle("Car", "Toyota", "Hilux", 2023, 250, 5, "Diesel", "seeds/images/toyota_hilux.png");
        seedVehicle("Car", "Toyota", "Vellfire", 2023, 600, 7, "Petrol", "seeds/images/toyota_vellfire.png");
        seedVehicle("Car", "Toyota", "Alphard", 2023, 650, 7, "Petrol", "seeds/images/toyota_alphard.png");
        seedVehicle("Car", "Honda", "City", 2023, 150, 5, "Petrol", "seeds/images/honda_city.png");
        seedVehicle("Car", "Honda", "Civic", 2023, 250, 5, "Petrol", "seeds/images/honda_civic.png");
        seedVehicle("Car", "Honda", "Accord", 2023, 350, 5, "Petrol", "seeds/images/honda_accord.png");
        seedVehicle("Car", "Honda", "HR-V", 2023, 220, 5, "Petrol", "seeds/images/honda_hrv.png");
        seedVehicle("Car", "Honda", "CR-V", 2023, 300, 5, "Petrol", "seeds/images/honda_crv.png");
        seedVehicle("Car", "Honda", "BR-V", 2023, 180, 7, "Petrol", "seeds/images/honda_brv.png");
        seedVehicle("Car", "Honda", "Jazz", 2023, 140, 5, "Petrol", "seeds/images/honda_jazz.png");
        seedVehicle("Car", "Perodua", "Myvi", 2023, 120, 5, "Petrol", "seeds/images/perodua_myvi.png");
    }

    private void seedVehicle(String type, String brand, String model, int year, double rate, int seats, String fuel, String imageUrl) {
        if (vehicleRepository.findByBrandAndModel(brand, model).isEmpty()) {
            log.info("Seeding vehicle: {} {}", brand, model);
            Vehicle vehicle = Vehicle.builder()
                    .type(type)
                    .brand(brand)
                    .model(model)
                    .year(year)
                    .rentalRate(BigDecimal.valueOf(rate))
                    .seats(seats)
                    .fuelType(fuel)
                    .imageUrl(imageUrl)
                    .availabilityStatus(AvailabilityStatus.AVAILABLE)
                    .build();
            vehicleRepository.save(vehicle);
        }
    }
}
