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
        // Toyota
        seedVehicle("Car", "Toyota", "Vios", 2023, 150, 5, "Petrol", "toyota_vios.png");
        seedVehicle("Car", "Toyota", "Yaris", 2023, 160, 5, "Petrol", "toyota_yaris.png");
        seedVehicle("Car", "Toyota", "Camry", 2023, 350, 5, "Petrol", "toyota_camry.png");
        seedVehicle("Car", "Toyota", "Corolla", 2023, 200, 5, "Petrol", "toyota_corolla.png");
        seedVehicle("Car", "Toyota", "Hilux", 2023, 250, 5, "Diesel", "toyota_hilux.png");
        seedVehicle("MPV", "Toyota", "Vellfire", 2023, 600, 7, "Petrol", "toyota_vellfire.png");
        seedVehicle("MPV", "Toyota", "Alphard", 2023, 650, 7, "Petrol", "toyota_alphard.png");

        // Honda
        seedVehicle("Car", "Honda", "City", 2023, 150, 5, "Petrol", "honda_city.png");
        seedVehicle("Car", "Honda", "Civic", 2023, 250, 5, "Petrol", "honda_civic.png");
        seedVehicle("Car", "Honda", "Accord", 2023, 350, 5, "Petrol", "honda_accord.png");
        seedVehicle("SUV", "Honda", "HR-V", 2023, 220, 5, "Petrol", "honda_hrv.png");
        seedVehicle("SUV", "Honda", "CR-V", 2023, 300, 5, "Petrol", "honda_crv.png");
        seedVehicle("MPV", "Honda", "BR-V", 2023, 180, 7, "Petrol", "honda_brv.png");
        seedVehicle("Hatchback", "Honda", "Jazz", 2023, 140, 5, "Petrol", "honda_jazz.png");

        // Perodua
        seedVehicle("Hatchback", "Perodua", "Myvi", 2023, 120, 5, "Petrol", "perodua_myvi.png");
        seedVehicle("Hatchback", "Perodua", "Axia", 2023, 100, 5, "Petrol", "perodua_axia.png");
        seedVehicle("Car", "Perodua", "Bezza", 2023, 130, 5, "Petrol", "perodua_bezza.png");
        seedVehicle("MPV", "Perodua", "Alza", 2023, 180, 7, "Petrol", "perodua_alza.png");
        seedVehicle("SUV", "Perodua", "Ativa", 2023, 170, 5, "Petrol", "perodua_ativa.png");
        seedVehicle("SUV", "Perodua", "Aruz", 2023, 200, 7, "Petrol", "perodua_aruz.png");

        // Proton
        seedVehicle("Car", "Proton", "Saga", 2023, 110, 5, "Petrol", "proton_saga.png");
        seedVehicle("Car", "Proton", "Persona", 2023, 150, 5, "Petrol", "proton_persona.png");
        seedVehicle("SUV", "Proton", "X50", 2023, 220, 5, "Petrol", "proton_x50.png");
        seedVehicle("SUV", "Proton", "X70", 2023, 300, 5, "Petrol", "proton_x70.png");
        seedVehicle("SUV", "Proton", "X90", 2023, 400, 7, "Petrol", "proton_x90.png");
        seedVehicle("Hatchback", "Proton", "Iriz", 2023, 130, 5, "Petrol", "proton_iriz.png");
        seedVehicle("MPV", "Proton", "Exora", 2023, 180, 7, "Petrol", "proton_exora.png");

        // BMW
        seedVehicle("Car", "BMW", "3 Series", 2023, 450, 5, "Petrol", "bmw_3series.png");
        seedVehicle("Car", "BMW", "5 Series", 2023, 650, 5, "Petrol", "bmw_5series.png");
        seedVehicle("SUV", "BMW", "X3", 2023, 550, 5, "Petrol", "bmw_x3.png");
        seedVehicle("SUV", "BMW", "X5", 2023, 750, 5, "Diesel", "bmw_x5.png");
        seedVehicle("Car", "BMW", "7 Series", 2023, 1200, 5, "Petrol", "bmw_7series.png");

        // Mercedes-Benz
        seedVehicle("Car", "Mercedes-Benz", "C-Class", 2023, 480, 5, "Petrol", "mercedes_cclass.png");
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
