package com.travel.planner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.planner.dto.ChecklistItemRequest;
import com.travel.planner.dto.ChecklistItemResponse;
import com.travel.planner.model.User;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtAuthenticationFilter;
import com.travel.planner.security.JwtService;
import com.travel.planner.service.ChecklistService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChecklistController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChecklistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChecklistService checklistService;

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
                .email("test@travel.com")
                .username("testuser")
                .build();
        CustomUserDetails customUserDetails = new CustomUserDetails(user);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities())
        );
    }

    @Test
    @DisplayName("1. GET /api/v1/trips/{tripId}/checklists -> 200 OK & trả về field isCompleted")
    void getChecklistItems_returnsList() throws Exception {
        ChecklistItemResponse item = ChecklistItemResponse.builder()
                .itemId(1L)
                .tripId(10L)
                .name("CCCD bản gốc")
                .category("Giấy tờ")
                .isCompleted(true)
                .build();

        when(checklistService.getChecklistItems(eq(10L), any(User.class))).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/trips/10/checklists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(1))
                .andExpect(jsonPath("$[0].name").value("CCCD bản gốc"))
                .andExpect(jsonPath("$[0].isCompleted").value(true));
    }

    @Test
    @DisplayName("2. POST /api/v1/trips/{tripId}/checklists -> 201 Created")
    void createChecklistItem_returnsCreated() throws Exception {
        ChecklistItemRequest request = ChecklistItemRequest.builder()
                .name("Sạc dự phòng")
                .category("Công nghệ")
                .build();

        ChecklistItemResponse created = ChecklistItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .name("Sạc dự phòng")
                .category("Công nghệ")
                .isCompleted(false)
                .build();

        when(checklistService.createChecklistItem(eq(10L), any(ChecklistItemRequest.class), any(User.class)))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/trips/10/checklists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemId").value(5))
                .andExpect(jsonPath("$.isCompleted").value(false));
    }

    @Test
    @DisplayName("3. POST /api/v1/trips/{tripId}/checklists với name rỗng -> 400 Bad Request")
    void createChecklistItem_blankName_returnsBadRequest() throws Exception {
        ChecklistItemRequest request = ChecklistItemRequest.builder()
                .name("   ")
                .build();

        mockMvc.perform(post("/api/v1/trips/10/checklists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("4. PUT /api/v1/trips/{tripId}/checklists/{itemId} -> 200 OK")
    void updateChecklistItem_returnsUpdated() throws Exception {
        ChecklistItemRequest request = ChecklistItemRequest.builder()
                .name("Áo mưa")
                .category("Cá nhân")
                .isCompleted(true)
                .build();

        ChecklistItemResponse updated = ChecklistItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .name("Áo mưa")
                .category("Cá nhân")
                .isCompleted(true)
                .build();

        when(checklistService.updateChecklistItem(eq(10L), eq(5L), any(ChecklistItemRequest.class), any(User.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/trips/10/checklists/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Áo mưa"))
                .andExpect(jsonPath("$.isCompleted").value(true));
    }

    @Test
    @DisplayName("5. PATCH /api/v1/trips/{tripId}/checklists/{itemId}/toggle và /{itemId} -> 200 OK")
    void toggleChecklistItem_bothRoutes_returnUpdated() throws Exception {
        ChecklistItemResponse toggled = ChecklistItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .name("Sạc dự phòng")
                .category("Công nghệ")
                .isCompleted(true)
                .build();

        when(checklistService.toggleChecklistItem(eq(10L), eq(5L), any(User.class))).thenReturn(toggled);

        mockMvc.perform(patch("/api/v1/trips/10/checklists/5/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCompleted").value(true));

        mockMvc.perform(patch("/api/v1/trips/10/checklists/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCompleted").value(true));
    }

    @Test
    @DisplayName("6. DELETE /api/v1/trips/{tripId}/checklists/{itemId} -> 200 OK")
    void deleteChecklistItem_returnsMessage() throws Exception {
        doNothing().when(checklistService).deleteChecklistItem(eq(10L), eq(5L), any(User.class));

        mockMvc.perform(delete("/api/v1/trips/10/checklists/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa mục hành lý thành công."));
    }
}
