package com.rentease.backend.user.service;

import com.rentease.backend.common.exception.ConflictException;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.user.UserSpecification;
import com.rentease.backend.user.controller.AdminUpdateUserRequest;
import com.rentease.backend.user.controller.AdminUserResponse;
import com.rentease.backend.user.controller.UpdateProfileRequest;
import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.model.UserStatus;
import com.rentease.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Set<Role> SELF_REGISTRATION_ROLES = Set.of(Role.CUSTOMER, Role.MAINTENANCE);

    @Transactional
    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ConflictException("Email already registered");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        if (user.getRole() == null || !SELF_REGISTRATION_ROLES.contains(user.getRole())) {
            user.setRole(Role.CUSTOMER);
        }
        return userRepository.save(user);
    }

    @Transactional
    public User updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null) user.setAddress(request.getAddress());

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Page<AdminUserResponse> findAllFiltered(String search, Role role, UserStatus status, Pageable pageable) {
        Specification<User> spec = Specification
                .where(UserSpecification.searchByKeyword(search))
                .and(UserSpecification.hasRole(role))
                .and(UserSpecification.hasStatus(status));
        return userRepository.findAll(spec, pageable).map(this::mapToAdminResponse);
    }

    @Transactional
    public AdminUserResponse adminUpdateUser(UUID id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        return mapToAdminResponse(userRepository.save(user));
    }

    @Transactional
    public void adminDeleteUser(UUID id) {
        deleteUser(id);
    }

    public AdminUserResponse findAdminUserById(UUID id) {
        return userRepository.findById(id)
                .map(this::mapToAdminResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AdminUserResponse mapToAdminResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
