package com.harsku.movietime.service;

import com.harsku.movietime.dto.AuthDtos.*;
import com.harsku.movietime.entity.Session;
import com.harsku.movietime.entity.User;
import com.harsku.movietime.repository.SessionRepository;
import com.harsku.movietime.repository.UserRepository;
import com.harsku.movietime.security.JwtService;
import com.harsku.movietime.security.RedisSessionService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RedisSessionService redisSessionService;
    private final long refreshExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RedisSessionService redisSessionService,
            @Value("${app.jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMs) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.redisSessionService = redisSessionService;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.email() != null && !req.email().isBlank() && userRepository.existsByEmailIgnoreCase(req.email().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (userRepository.existsByPhone(req.phone().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        User user = new User();
        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setEmail(req.email() != null && !req.email().isBlank() ? req.email().trim().toLowerCase() : null);
        user.setPhone(req.phone().trim());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole("user");

        user = userRepository.save(user);
        return createSessionAndTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String id = req.identifier().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(id);
        }

        User user = userOpt.orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return createSessionAndTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        String refreshToken = req.refreshToken().trim();

        UUID userId = redisSessionService.getUserIdByRefreshToken(refreshToken).orElse(null);
        Session dbSession = sessionRepository.findByToken(refreshToken).orElse(null);

        if (dbSession == null || dbSession.getExpiresAt().isBefore(OffsetDateTime.now())) {
            if (dbSession != null) {
                sessionRepository.delete(dbSession);
            }
            redisSessionService.deleteRefreshSession(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired or invalid");
        }

        if (userId == null) {
            userId = dbSession.getUser().getId();
            redisSessionService.storeRefreshSession(refreshToken, userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String newAccessToken = jwtService.generateAccessToken(user);
        return new AuthResponse(newAccessToken, refreshToken, jwtService.getAccessExpirationMs(), toUserDto(user));
    }

    @Transactional
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parseToken(accessToken.substring(7));
                long remainingMs = claims.getExpiration().getTime() - System.currentTimeMillis();
                redisSessionService.blacklistAccessToken(claims.getId(), remainingMs);
            } catch (Exception ignored) {
            }
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            redisSessionService.deleteRefreshSession(refreshToken);
            sessionRepository.deleteByToken(refreshToken);
        }
    }

    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserDto(user);
    }

    private AuthResponse createSessionAndTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = generateOpaqueToken();

        Session session = new Session();
        session.setUser(user);
        session.setToken(refreshToken);
        session.setExpiresAt(OffsetDateTime.now().plus(refreshExpirationMs, ChronoUnit.MILLIS));
        sessionRepository.save(session);

        redisSessionService.storeRefreshSession(refreshToken, user.getId());

        return new AuthResponse(accessToken, refreshToken, jwtService.getAccessExpirationMs(), toUserDto(user));
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }
}
