package com.rentease.backend.vehicle.controller;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class VehiclePage {
    private List<VehicleResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
