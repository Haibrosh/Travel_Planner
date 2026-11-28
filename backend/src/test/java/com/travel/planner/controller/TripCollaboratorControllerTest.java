package com.travel.planner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.planner.dto.CollaboratorResponse;
import com.travel.planner.dto.InviteLinkResponse;
import com.travel.planner.dto.JoinTripResponse;
import com.travel.planner.model.User;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtAuthenticationFilter;
import com.travel.planner.security.JwtService;
import com.travel.planner.service.TripCollaboratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TripCollaboratorController.class)
@AutoConfigureMockMvc(addFilters = false)
class TripCollaboratorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TripCollaboratorService tripCollaboratorService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        User user = User.builder()
                .userId(1L)
                .email("owner@travel.com")
                .username("owneruser")
                .build();
        CustomUserDetails customUserDetails = new CustomUserDetails(user);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities())
        );
    }

    @Test
    @DisplayName("1. POST /api/v1/trips/{tripId}/invite-link -> 200 OK")
    void createInviteLink_returnsInvitePayload() throws Exception {
        InviteLinkResponse response = InviteLinkResponse.builder()
                .tripId(10L)
                .token("jwt-7d")
                .inviteLink("http://localhost:3000/trips/join?token=jwt-7d")
                .role("COLLABORATOR")
                .expiresInSeconds(604800L)
                .expiresAt(LocalDateTime.of(2026, 12, 5, 10, 0))
                .build();

        when(tripCollaboratorService.createInviteLink(eq(10L), isNull(), any(User.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/trips/10/invite-link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(10))
                .andExpect(jsonPath("$.token").value("jwt-7d"))
                .andExpect(jsonPath("$.role").value("COLLABORATOR"))
                .andExpect(jsonPath("$.expiresInSeconds").value(604800));
    }

    @Test
    @DisplayName("2. POST /api/v1/trips/join?token=... -> 200 OK")
    void joinTrip_queryParamAndBodyFallback_returnJoinedMember() throws Exception {
        JoinTripResponse response = JoinTripResponse.builder()
                .tripId(10L)
                .tripName("Đà Nẵng")
                .userId(2L)
                .username("collab")
                .email("collab@travel.com")
                .role("COLLABORATOR")
                .status("ACTIVE")
                .alreadyMember(false)
                .message("Tham gia chuyến đi thành công.")
                .build();

        when(tripCollaboratorService.joinTripByToken(eq("jwt-7d"), any(User.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/trips/join").param("token", "jwt-7d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(10))
                .andExpect(jsonPath("$.role").value("COLLABORATOR"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.alreadyMember").value(false));

        mockMvc.perform(post("/api/v1/trips/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("token", "jwt-7d"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(10));
    }

    @Test
    @DisplayName("3. GET /api/v1/trips/{tripId}/collaborators -> 200 OK")
    void getCollaborators_returnsActiveMemberList() throws Exception {
        CollaboratorResponse ownerMember = CollaboratorResponse.builder()
                .tripId(10L)
                .userId(1L)
                .username("owneruser")
                .email("owner@travel.com")
                .role("OWNER")
                .status("ACTIVE")
                .isOwner(true)
                .build();
        CollaboratorResponse collabMember = CollaboratorResponse.builder()
                .tripId(10L)
                .userId(2L)
                .username("collab")
                .email("collab@travel.com")
                .role("COLLABORATOR")
                .status("ACTIVE")
                .isOwner(false)
                .build();

        when(tripCollaboratorService.getCollaborators(eq(10L), any(User.class)))
                .thenReturn(List.of(ownerMember, collabMember));

        mockMvc.perform(get("/api/v1/trips/10/collaborators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("OWNER"))
                .andExpect(jsonPath("$[0].isOwner").value(true))
                .andExpect(jsonPath("$[1].role").value("COLLABORATOR"))
                .andExpect(jsonPath("$[1].userId").value(2));
    }

    @Test
    @DisplayName("4. DELETE /api/v1/trips/{tripId}/collaborators/{userId} -> 200 OK")
    void removeCollaborator_returnsOkMessage() throws Exception {
        doNothing().when(tripCollaboratorService).removeCollaborator(eq(10L), eq(2L), any(User.class));

        mockMvc.perform(delete("/api/v1/trips/10/collaborators/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành viên khỏi chuyến đi thành công."));
    }
}
