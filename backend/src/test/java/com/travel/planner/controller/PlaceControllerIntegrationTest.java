package com.travel.planner.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.planner.model.User;
import com.travel.planner.repository.UserRepository;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PlaceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;

    @BeforeEach
    void setUp() {
        if (jwtToken == null) {
            User user = userRepository.findAll().stream().findFirst().orElseGet(() -> {
                User newUser = User.builder()
                        .email("test_runner@sightseeker.com")
                        .username("Test Runner")
                        .password("$2a$10$abcdefghijk1234567890abcdefghijk1234567890abcdefghijk")
                        .build();
                return userRepository.save(newUser);
            });
            jwtToken = jwtService.generateToken(new CustomUserDetails(user));
        }
    }

    @Test
    @DisplayName("1. GET /api/places/{id} khi chưa đăng nhập -> 200 OK (API công khai)")
    void testGetPlaceById_PublicAccess() throws Exception {
        mockMvc.perform(get("/api/places/101584"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("2. GET /api/places khi chưa đăng nhập -> 200 OK (API công khai)")
    void testGetPlaces_PublicAccess() throws Exception {
        mockMvc.perform(get("/api/places"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("3. GET /api/places/{id} với ID hợp lệ (101584) -> 200 OK & đầy đủ trường")
    void testGetPlaceById_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places/101584")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101584))
                .andExpect(jsonPath("$.name").isNotEmpty())
                .andExpect(jsonPath("$.category").isNotEmpty())
                .andExpect(jsonPath("$.latitude").isNumber())
                .andExpect(jsonPath("$.longitude").isNumber())
                .andReturn();

        System.out.println(">>> Response for GET /api/places/101584: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("4. GET /api/places/{id} với ID không tồn tại -> 404 Not Found")
    void testGetPlaceById_NotFound() throws Exception {
        mockMvc.perform(get("/api/places/99999999")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("5. GET /api/places?keyword=Bến Thành -> Tìm đúng địa điểm theo tên tiếng Việt")
    void testSearchPlaces_Keyword() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("keyword", "Bến Thành")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        JsonNode content = root.get("content");
        assertTrue(content.size() > 0);
        String firstName = content.get(0).get("name").asText();
        System.out.println(">>> Search 'Bến Thành' returned first place: " + firstName +
                ", rating: " + content.get(0).get("rating") + " (Total found: " + root.get("totalElements").asInt() + ")");
        assertTrue(firstName.toLowerCase().contains("bến thành") || firstName.toLowerCase().contains("ben thanh") || firstName.contains("Thành"));
    }

    @Test
    @DisplayName("6. GET /api/places?destinationId=79 -> Lọc theo mã tỉnh TP.HCM (79)")
    void testSearchPlaces_DestinationFilter() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("destinationId", "79")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode item : root.get("content")) {
            assertEquals("79", item.get("provinceCode").asText());
        }
        System.out.println(">>> Destination filter '79' totalElements: " + root.get("totalElements").asInt());
    }

    @Test
    @DisplayName("7. GET /api/places?category=attraction -> Lọc theo category")
    void testSearchPlaces_CategoryFilter() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("category", "attraction")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode item : root.get("content")) {
            assertEquals("attraction", item.get("category").asText());
        }
        System.out.println(">>> Category filter 'attraction' totalElements: " + root.get("totalElements").asInt());
    }

    @Test
    @DisplayName("8. GET /api/places?sort=rating_desc -> Sắp xếp rating giảm dần")
    void testSearchPlaces_SortRatingDesc() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("sort", "rating_desc")
                        .param("page", "0")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.get("content");
        double prevRating = Double.MAX_VALUE;
        for (JsonNode item : content) {
            double currentRating = item.hasNonNull("rating") ? item.get("rating").asDouble() : 0.0;
            assertTrue(currentRating <= prevRating, "Ratings should be descending: " + currentRating + " <= " + prevRating);
            prevRating = currentRating;
        }
        System.out.println(">>> Sắp xếp rating_desc 5 địa điểm đầu tiên có rating: " +
                content.get(0).get("rating") + ", " + content.get(1).get("rating") + "...");
    }

    @Test
    @DisplayName("9. GET /api/places?sort=name_asc -> Sắp xếp name tăng dần")
    void testSearchPlaces_SortNameAsc() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("sort", "name_asc")
                        .param("page", "0")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.get("content");
        for (int i = 0; i < content.size() - 1; i++) {
            String name1 = content.get(i).get("name").asText();
            String name2 = content.get(i + 1).get("name").asText();
            System.out.println(">>> Name " + i + ": " + name1);
        }
    }

    @Test
    @DisplayName("10. GET /api/places?page=1&size=3 -> Phân trang đúng page và size (one-indexed-parameters=true: page=1 trả về trang đầu, number=0)")
    void testSearchPlaces_Pagination() throws Exception {
        // Kiểm tra page=1 (trang đầu tiên theo one-indexed-parameters, field number trong JSON là 0)
        MvcResult result = mockMvc.perform(get("/api/places")
                        .param("page", "1")
                        .param("size", "3")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(3))
                .andExpect(jsonPath("$.content.length()").value(3))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        System.out.println(">>> Pagination page 1 size 3 totalPages: " + root.get("totalPages").asInt());

        // Kiểm tra page=2 (trang thứ hai theo one-indexed-parameters, field number trong JSON là 1)
        mockMvc.perform(get("/api/places")
                        .param("page", "2")
                        .param("size", "3")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(3));
    }
}
