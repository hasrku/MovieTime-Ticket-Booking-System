package com.harsku.movietime.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            String email,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password
    ) {}

    public record LoginRequest(
            @NotBlank String identifier,
            @NotBlank String password
    ) {}

    public record RefreshRequest(
            @NotBlank String refreshToken
    ) {}

    public record LogoutRequest(
            String refreshToken
    ) {}

    public record UserDto(
            UUID id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String role
    ) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            long expiresInMs,
            UserDto user
    ) {}
}
