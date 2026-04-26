package com.rentease.backend.user.controller;

import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.UserStatus;
import com.rentease.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public Page<AdminUserResponse> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Role roleEnum = parseEnum(Role.class, role);
        UserStatus statusEnum = parseEnum(UserStatus.class, status);
        return userService.findAllFiltered(search, roleEnum, statusEnum,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public AdminUserResponse getUser(@PathVariable UUID id) {
        return userService.findAdminUserById(id);
    }

    @PatchMapping("/{id}")
    public AdminUserResponse updateUser(@PathVariable UUID id,
                                        @RequestBody AdminUpdateUserRequest request) {
        return userService.adminUpdateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        userService.adminDeleteUser(id);
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null || value.isBlank()) return null;
        try { return Enum.valueOf(type, value.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
