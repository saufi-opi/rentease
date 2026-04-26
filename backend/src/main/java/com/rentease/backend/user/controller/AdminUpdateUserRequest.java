package com.rentease.backend.user.controller;

import com.rentease.backend.user.model.Role;
import com.rentease.backend.user.model.UserStatus;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private Role role;
    private UserStatus status;
}
