package com.travel.planner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.dto.ReorderItemRequest;
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
import org.mockito.ArgumentCaptor;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
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

    @Test
    @DisplayName("6. PUT /api/v1/trips/{tripId}/itinerary/reorder với JSON array -> 200 OK")
    void reorderItinerary_arrayPayload_shouldReturnUpdatedList() throws Exception {
        List<ReorderItemRequest> request = List.of(
                ReorderItemRequest.builder().itemId(2L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(1L).dayNumber(2).orderIndex(1.0).build()
        );

        List<ItineraryItemResponse> updated = List.of(
                ItineraryItemResponse.builder().itemId(2L).tripId(10L).dayNumber(1).orderIndex(1.0).build(),
                ItineraryItemResponse.builder().itemId(1L).tripId(10L).dayNumber(2).orderIndex(1.0).build()
        );

        when(itineraryService.reorderItinerary(eq(10L), anyList(), any(User.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/trips/10/itinerary/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(2))
                .andExpect(jsonPath("$[0].dayNumber").value(1))
                .andExpect(jsonPath("$[0].orderIndex").value(1.0))
                .andExpect(jsonPath("$[1].itemId").value(1))
                .andExpect(jsonPath("$[1].dayNumber").value(2))
                .andExpect(jsonPath("$[1].orderIndex").value(1.0));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ReorderItemRequest>> captor = ArgumentCaptor.forClass(List.class);
        verify(itineraryService).reorderItinerary(eq(10L), captor.capture(), any(User.class));
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue().get(0).getItemId()).isEqualTo(2L);
        assertThat(captor.getValue().get(0).getDayNumber()).isEqualTo(1);
        assertThat(captor.getValue().get(0).getOrderIndex()).isEqualTo(1.0);
        assertThat(captor.getValue().get(1).getItemId()).isEqualTo(1L);
        assertThat(captor.getValue().get(1).getDayNumber()).isEqualTo(2);
        assertThat(captor.getValue().get(1).getOrderIndex()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("7. PUT /api/v1/trips/{tripId}/itinerary/reorder với wrapper object { items: [...] } -> 200 OK")
    void reorderItinerary_wrapperObjectPayload_shouldReturnUpdatedList() throws Exception {
        Map<String, Object> wrapperPayload = Map.of(
                "items", List.of(
                        Map.of("itemId", 3, "dayNumber", 1, "orderIndex", 1.0),
                        Map.of("itemId", 1, "dayNumber", 1, "orderIndex", 2.0)
                ),
                "itemId", 3,
                "targetDayNumber", 1
        );

        List<ItineraryItemResponse> updated = List.of(
                ItineraryItemResponse.builder().itemId(3L).tripId(10L).dayNumber(1).orderIndex(1.0).build(),
                ItineraryItemResponse.builder().itemId(1L).tripId(10L).dayNumber(1).orderIndex(2.0).build()
        );

        when(itineraryService.reorderItinerary(eq(10L), anyList(), any(User.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/trips/10/itinerary/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapperPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(3))
                .andExpect(jsonPath("$[0].orderIndex").value(1.0))
                .andExpect(jsonPath("$[1].itemId").value(1))
                .andExpect(jsonPath("$[1].orderIndex").value(2.0));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ReorderItemRequest>> captor = ArgumentCaptor.forClass(List.class);
        verify(itineraryService).reorderItinerary(eq(10L), captor.capture(), any(User.class));
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue().get(0).getItemId()).isEqualTo(3L);
        assertThat(captor.getValue().get(0).getDayNumber()).isEqualTo(1);
        assertThat(captor.getValue().get(0).getOrderIndex()).isEqualTo(1.0);
        assertThat(captor.getValue().get(1).getItemId()).isEqualTo(1L);
        assertThat(captor.getValue().get(1).getDayNumber()).isEqualTo(1);
        assertThat(captor.getValue().get(1).getOrderIndex()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("8. PUT /api/v1/trips/{tripId}/itinerary/reorder thiếu itemId -> 400 Validation Error")
    void reorderItinerary_missingItemId_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/trips/10/itinerary/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"dayNumber\":1,\"orderIndex\":1.0}]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("9. PUT /api/v1/trips/{tripId}/itinerary/reorder với object không có mảng items -> 400 Bad Request")
    void reorderItinerary_objectWithoutItems_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/trips/10/itinerary/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemId\":3,\"targetDayNumber\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }
}
