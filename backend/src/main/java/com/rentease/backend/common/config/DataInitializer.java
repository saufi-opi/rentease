package com.rentease.backend.common.config;

import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.model.UserStatus;
import com.rentease.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
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
        } else {
            log.info("Admin user already exists. Skipping initialization.");
        }
    }
}
