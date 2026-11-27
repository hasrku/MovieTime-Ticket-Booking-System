package com.harsku.movietime.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class RedisSessionService {

    private static final Logger log = LoggerFactory.getLogger(RedisSessionService.class);
    private static final String REFRESH_PREFIX = "session:refresh:";
    private static final String BLACKLIST_PREFIX = "blacklist:access:";

    private final StringRedisTemplate redisTemplate;
    private final long refreshExpirationMs;

    public RedisSessionService(
            StringRedisTemplate redisTemplate,
            @Value("${app.jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMs) {
        this.redisTemplate = redisTemplate;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public void storeRefreshSession(String refreshToken, UUID userId) {
        try {
            redisTemplate.opsForValue().set(
                    REFRESH_PREFIX + refreshToken,
                    userId.toString(),
                    Duration.ofMillis(refreshExpirationMs)
            );
        } catch (Exception e) {
            log.warn("Redis unavailable while storing refresh session: {}", e.getMessage());
        }
    }

    public Optional<UUID> getUserIdByRefreshToken(String refreshToken) {
        try {
            String value = redisTemplate.opsForValue().get(REFRESH_PREFIX + refreshToken);
            if (value != null && !value.isBlank()) {
                return Optional.of(UUID.fromString(value));
            }
        } catch (Exception e) {
            log.warn("Redis unavailable while reading refresh session: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void deleteRefreshSession(String refreshToken) {
        try {
            redisTemplate.delete(REFRESH_PREFIX + refreshToken);
        } catch (Exception e) {
            log.warn("Redis unavailable while deleting refresh session: {}", e.getMessage());
        }
    }

    public void blacklistAccessToken(String jti, long remainingMs) {
        if (jti == null || remainingMs <= 0) return;
        try {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + jti,
                    "1",
                    Duration.ofMillis(remainingMs)
            );
        } catch (Exception e) {
            log.warn("Redis unavailable while blacklisting access token: {}", e.getMessage());
        }
    }

    public boolean isAccessTokenBlacklisted(String jti) {
        if (jti == null) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
        } catch (Exception e) {
            log.warn("Redis unavailable while checking blacklist: {}", e.getMessage());
            return false;
        }
    }
}
