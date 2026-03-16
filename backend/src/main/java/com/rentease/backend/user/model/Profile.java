package com.rentease.backend.user.model;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Profile {
    private String fullName;
    private String phoneNumber;
    private String address;
}
