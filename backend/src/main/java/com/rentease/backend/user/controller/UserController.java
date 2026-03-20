package com.rentease.backend.user.controller;

import com.rentease.backend.auth.security.SecurityUtils;
import com.rentease.backend.common.exception.ResourceNotFoundException;
import com.rentease.backend.user.model.User;
import com.rentease.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody UserRegistrationRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .build();

        User savedUser = userService.registerUser(user);
        return mapToResponse(savedUser);
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User updatedUser = userService.updateProfile(userId, request);
        return mapToResponse(updatedUser);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        userService.deleteUser(userId);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .status(user.getStatus())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().name())
                .build();
    }
}
