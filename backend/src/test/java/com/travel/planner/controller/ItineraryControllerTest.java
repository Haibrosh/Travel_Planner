package com.travel.planner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.dto.ReorderItineraryItemRequest;
import com.travel.planner.dto.UpdateItineraryItemRequest;
import com.travel.planner.model.User;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtAuthenticationFilter;
import com.travel.planner.security.JwtService;
import com.travel.planner.service.ItineraryService;
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

import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ItineraryController.class)
@AutoConfigureMockMvc(addFilters = false)
class ItineraryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ItineraryService itineraryService;

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
        objectMapper.registerModule(new JavaTimeModule());

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
    @DisplayName("1. GET /api/v1/trips/{tripId}/itinerary -> 200 OK")
    void getItinerary_shouldReturnList() throws Exception {
        ItineraryItemResponse item = ItineraryItemResponse.builder()
                .itemId(1L)
                .tripId(10L)
                .dayNumber(1)
                .orderIndex(1.0)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .place(PlaceDetailResponse.builder().id(100L).name("Chùa Cầu").build())
                .build();

        when(itineraryService.getItinerary(eq(10L), any(User.class))).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/trips/10/itinerary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(1))
                .andExpect(jsonPath("$[0].orderIndex").value(1.0))
                .andExpect(jsonPath("$[0].place.name").value("Chùa Cầu"));
    }

    @Test
    @DisplayName("2. POST /api/v1/trips/{tripId}/itinerary/items -> 201 Created")
    void addItem_shouldReturnCreated() throws Exception {
        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(1)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .build();

        ItineraryItemResponse created = ItineraryItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .dayNumber(1)
                .orderIndex(2.0)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .build();

        when(itineraryService.addItineraryItem(eq(10L), any(CreateItineraryItemRequest.class), any(User.class)))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/trips/10/itinerary/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemId").value(5))
                .andExpect(jsonPath("$.orderIndex").value(2.0));
    }

    @Test
    @DisplayName("3. PUT /api/v1/trips/{tripId}/itinerary/items/{itemId} -> 200 OK")
    void updateItem_shouldReturnUpdated() throws Exception {
        UpdateItineraryItemRequest request = UpdateItineraryItemRequest.builder()
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        ItineraryItemResponse updated = ItineraryItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .dayNumber(1)
                .orderIndex(2.0)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        when(itineraryService.updateItineraryItem(eq(10L), eq(5L), any(UpdateItineraryItemRequest.class), any(User.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/trips/10/itinerary/items/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(5))
                .andExpect(jsonPath("$.startTime").value("10:00:00"))
                .andExpect(jsonPath("$.endTime").value("12:00:00"));
    }

    @Test
    @DisplayName("4. DELETE /api/v1/trips/{tripId}/itinerary/items/{itemId} -> 200 OK")
    void deleteItem_shouldReturnOkMessage() throws Exception {
        doNothing().when(itineraryService).deleteItineraryItem(eq(10L), eq(5L), any(User.class));

        mockMvc.perform(delete("/api/v1/trips/10/itinerary/items/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa địa điểm khỏi lịch trình thành công."));
    }

    @Test
    @DisplayName("5. PATCH /api/v1/trips/{tripId}/itinerary/items/{itemId}/reorder -> 200 OK")
    void reorderItem_shouldReturnUpdated() throws Exception {
        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(1L)
                .nextItemId(2L)
                .build();

        ItineraryItemResponse reordered = ItineraryItemResponse.builder()
                .itemId(5L)
                .tripId(10L)
                .dayNumber(1)
                .orderIndex(1.5)
                .build();

        when(itineraryService.reorderItineraryItem(eq(10L), eq(5L), any(ReorderItineraryItemRequest.class), any(User.class)))
                .thenReturn(reordered);

        mockMvc.perform(patch("/api/v1/trips/10/itinerary/items/5/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(5))
                .andExpect(jsonPath("$.orderIndex").value(1.5));
    }
}
