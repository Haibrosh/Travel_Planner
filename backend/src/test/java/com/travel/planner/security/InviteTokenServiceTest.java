package com.travel.planner.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class InviteTokenServiceTest {

    private InviteTokenService inviteTokenService;

    @BeforeEach
    void setUp() {
        inviteTokenService = new InviteTokenService();
        ReflectionTestUtils.setField(inviteTokenService, "secretKey",
                "84518923c5837651a51187493a3848b61c15f91752b5757b32d20b601f2f8118");
    }

    @Test
    void generateAndDecodeInviteToken() {
        long beforeGeneration = System.currentTimeMillis();
        String token = inviteTokenService.generateInviteToken(42L, "EDITOR");

        InviteTokenService.InviteClaims claims = inviteTokenService.decodeInviteToken(token);

        assertEquals(42L, claims.tripId());
        assertEquals("EDITOR", claims.role());

        Date expiration = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(
                        Decoders.BASE64.decode(
                                "84518923c5837651a51187493a3848b61c15f91752b5757b32d20b601f2f8118")))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        assertEquals(7L * 24 * 60 * 60 * 1000, expiration.getTime() - beforeGeneration, 1_000);
    }

    @Test
    void rejectsUnsupportedRole() {
        assertThrows(IllegalArgumentException.class,
                () -> inviteTokenService.generateInviteToken(42L, "OWNER"));
    }

    @Test
    void rejectsTamperedToken() {
        String token = inviteTokenService.generateInviteToken(42L, "VIEWER");

        assertThrows(JwtException.class,
                () -> inviteTokenService.decodeInviteToken(token + "tampered"));
    }
}
