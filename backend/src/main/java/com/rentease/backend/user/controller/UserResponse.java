package com.rentease.backend.user.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rentease.backend.user.model.UserStatus;
import lombok.Builder;
import lombok.Getter;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private UserStatus status;
    @JsonProperty("full_name")
    private String fullName;
    @JsonProperty("phone_number")
    private String phoneNumber;
    private String address;
    private Set<String> roles;
}
