package com.rentease.backend.booking.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;
}
