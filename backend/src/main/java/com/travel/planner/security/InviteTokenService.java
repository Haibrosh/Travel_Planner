package com.travel.planner.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class InviteTokenService {

    public static final long INVITE_TOKEN_EXPIRATION_SECONDS = 7L * 24 * 60 * 60;
    private static final long INVITE_TOKEN_EXPIRATION_MS = INVITE_TOKEN_EXPIRATION_SECONDS * 1000L;

    @Value("${jwt.secret}")
    private String secretKey;

    public String generateInviteToken(Long tripId) {
        return generateInviteToken(tripId, InviteRole.COLLABORATOR.name());
    }

    public String generateInviteToken(Long tripId, String role) {
        if (tripId == null) {
            throw new IllegalArgumentException("tripId không được để trống.");
        }

        String normalizedRole;
        try {
            normalizedRole = InviteRole.valueOf(role == null ? "" : role.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invite role phải là COLLABORATOR, EDITOR hoặc VIEWER.");
        }

        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject("trip-invite")
                .claim("tripId", tripId)
                .claim("role", normalizedRole)
                .issuedAt(new Date(now))
                .expiration(new Date(now + INVITE_TOKEN_EXPIRATION_MS))
                .signWith(getSignInKey())
                .compact();
    }

    public String generateToken(Long tripId, String role) {
        return generateInviteToken(tripId, role);
    }

    public InviteClaims decodeInviteToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invite token không được để trống.");
        }
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!"trip-invite".equals(claims.getSubject())) {
            throw new IllegalArgumentException("JWT không phải Invite Token.");
        }

        Object tripIdValue = claims.get("tripId");
        if (tripIdValue == null) {
            throw new IllegalArgumentException("Invite token thiếu tripId.");
        }
        Long tripId;
        if (tripIdValue instanceof Number number) {
            tripId = number.longValue();
        } else {
            try {
                tripId = Long.valueOf(tripIdValue.toString());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invite token có tripId không hợp lệ.", e);
            }
        }

        String role = claims.get("role", String.class);
        if (role == null) {
            throw new IllegalArgumentException("Invite token thiếu role.");
        }
        try {
            return new InviteClaims(tripId, InviteRole.valueOf(role).name());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invite token có role không hợp lệ.", e);
        }
    }

    public InviteClaims decodeToken(String token) {
        return decodeInviteToken(token);
    }

    public InviteClaims parseInviteToken(String token) {
        return decodeInviteToken(token);
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (Exception e) {
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public enum InviteRole {
        COLLABORATOR,
        EDITOR,
        VIEWER
    }

    public record InviteClaims(Long tripId, String role) {
        public Long getTripId() {
            return tripId;
        }

        public String getRole() {
            return role;
        }
    }
}
