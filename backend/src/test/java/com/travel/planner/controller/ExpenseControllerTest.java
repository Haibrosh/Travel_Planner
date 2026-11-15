package com.travel.planner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travel.planner.dto.ExpenseRequest;
import com.travel.planner.dto.ExpenseResponse;
import com.travel.planner.dto.ExpenseSplitResponse;
import com.travel.planner.model.User;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtAuthenticationFilter;
import com.travel.planner.security.JwtService;
import com.travel.planner.service.ExpenseService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExpenseController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExpenseService expenseService;

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
    @DisplayName("1. GET /api/v1/trips/{tripId}/budgets và /expenses -> 200 OK")
    void getExpenses_bothRoutes_returnList() throws Exception {
        ExpenseResponse expense = ExpenseResponse.builder()
                .expenseId(100L)
                .tripId(10L)
                .paidByUserId(1L)
                .paidByUsername("testuser")
                .title("Khách sạn")
                .category("Lưu trú")
                .amount(new BigDecimal("1800000"))
                .splitMethod("EQUAL")
                .expenseDate(LocalDate.of(2026, 11, 15))
                .splits(List.of(
                        ExpenseSplitResponse.builder()
                                .splitId(1L)
                                .userId(1L)
                                .username("testuser")
                                .splitAmount(new BigDecimal("1800000"))
                                .build()
                ))
                .build();

        when(expenseService.getExpenses(eq(10L), any(User.class))).thenReturn(List.of(expense));

        mockMvc.perform(get("/api/v1/trips/10/budgets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].expenseId").value(100))
                .andExpect(jsonPath("$[0].amount").value(1800000))
                .andExpect(jsonPath("$[0].splits[0].splitAmount").value(1800000));

        mockMvc.perform(get("/api/v1/trips/10/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].expenseId").value(100));
    }

    @Test
    @DisplayName("2. POST /api/v1/trips/{tripId}/budgets -> 201 Created")
    void createExpense_returnsCreated() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .title("Vé xe")
                .category("Di chuyển")
                .amount(new BigDecimal("700000"))
                .build();

        ExpenseResponse created = ExpenseResponse.builder()
                .expenseId(101L)
                .tripId(10L)
                .title("Vé xe")
                .category("Di chuyển")
                .amount(new BigDecimal("700000"))
                .splitMethod("EQUAL")
                .build();

        when(expenseService.createExpense(eq(10L), any(ExpenseRequest.class), any(User.class)))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/trips/10/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expenseId").value(101))
                .andExpect(jsonPath("$.amount").value(700000));
    }

    @Test
    @DisplayName("3. POST /api/v1/trips/{tripId}/expenses với amount <= 0 -> 400 Bad Request")
    void createExpense_invalidAmount_returnsBadRequest() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .title("Vé xe")
                .amount(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/v1/trips/10/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("4. PUT /api/v1/trips/{tripId}/budgets/{expenseId} -> 200 OK")
    void updateExpense_returnsUpdated() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .title("Vé xe khứ hồi")
                .amount(new BigDecimal("800000"))
                .build();

        ExpenseResponse updated = ExpenseResponse.builder()
                .expenseId(101L)
                .tripId(10L)
                .title("Vé xe khứ hồi")
                .amount(new BigDecimal("800000"))
                .build();

        when(expenseService.updateExpense(eq(10L), eq(101L), any(ExpenseRequest.class), any(User.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/trips/10/budgets/101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Vé xe khứ hồi"))
                .andExpect(jsonPath("$.amount").value(800000));
    }

    @Test
    @DisplayName("5. DELETE /api/v1/trips/{tripId}/expenses/{expenseId} -> 200 OK")
    void deleteExpense_returnsOkMessage() throws Exception {
        doNothing().when(expenseService).deleteExpense(eq(10L), eq(101L), any(User.class));

        mockMvc.perform(delete("/api/v1/trips/10/expenses/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa khoản chi thành công."));
    }
}
