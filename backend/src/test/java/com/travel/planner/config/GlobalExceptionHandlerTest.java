package com.travel.planner.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travel.planner.dto.ErrorResponse;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.FieldError;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;
    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .setControllerAdvice(handler)
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    @DisplayName("1. MethodArgumentNotValidException -> 400 với { status, message, timestamp }")
    void handleValidation_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("name: Tên không được để trống"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("2. HandlerMethodValidationException -> 400 với { status, message, timestamp }")
    void handleMethodValidation_returnsUnifiedErrorResponse() {
        HandlerMethodValidationException ex = mock(HandlerMethodValidationException.class);
        FieldError fieldError = new FieldError("reorderItemRequest", "itemId", "ID không được null");
        when(ex.getAllErrors()).thenAnswer(inv -> List.of(fieldError));

        ResponseEntity<ErrorResponse> response = handler.handleMethodValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).isEqualTo("itemId: ID không được null");
        assertThat(response.getBody().getTimestamp()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Validation Error");
    }

    @Test
    @DisplayName("3. HttpMessageNotReadableException -> 400 với { status, message, timestamp }")
    void handleNotReadable_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Dữ liệu gửi lên không đúng định dạng JSON hoặc sai cấu trúc."))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("4. MissingServletRequestParameterException -> 400 với { status, message, timestamp }")
    void handleMissingParam_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/param"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Thiếu tham số bắt buộc: q"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("5. MethodArgumentTypeMismatchException -> 400 với { status, message, timestamp }")
    void handleTypeMismatch_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/items/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Tham số 'id' không đúng định dạng."))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("6. BadCredentialsException -> 401 với { status, message, timestamp }")
    void handleBadCredentials_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/bad-credentials"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác."))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("7. AuthenticationException -> 401 với { status, message, timestamp }")
    void handleAuthenticationException_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/auth-error"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Token không hợp lệ"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("8. AccessDeniedException -> 403 với { status, message, timestamp }")
    void handleAccessDenied_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Không có quyền truy cập"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("9. EntityNotFoundException -> 404 với { status, message, timestamp }")
    void handleEntityNotFound_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Không tìm thấy chuyến đi"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("10. NoResourceFoundException -> 404 với { status, message, timestamp }")
    void handleNoResourceFound_returnsUnifiedErrorResponse() {
        ResponseEntity<ErrorResponse> response = handler.handleNoResourceFound(
                new NoResourceFoundException(HttpMethod.GET, "/api/unknown"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getMessage()).isEqualTo("Không tìm thấy tài nguyên yêu cầu.");
        assertThat(response.getBody().getTimestamp()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Not Found");
    }

    @Test
    @DisplayName("11. IllegalArgumentException -> 400 với { status, message, timestamp }")
    void handleIllegalArgument_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/illegal-arg"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Email đã tồn tại"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("12. Exception chưa xử lý (cả khi message null) -> 500 với fallback message đồng nhất")
    void handleGeneralException_returnsUnifiedErrorResponseWithFallback() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Lỗi bất ngờ"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("IllegalStateException"));

        mockMvc.perform(get("/test/runtime-null"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("NullPointerException"));
    }

    @Test
    @DisplayName("13. JwtException -> 400 với { status, message, timestamp }")
    void handleJwtException_returnsUnifiedErrorResponse() throws Exception {
        mockMvc.perform(get("/test/jwt-error"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Token sai định dạng"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @RestController
    static class DummyController {

        @PostMapping("/test/validate")
        String validate(@Valid @RequestBody DummyRequest request) {
            return request.name;
        }

        @GetMapping("/test/param")
        String param(@RequestParam("q") String q) {
            return q;
        }

        @GetMapping("/test/items/{id}")
        Long item(@PathVariable("id") Long id) {
            return id;
        }

        @GetMapping("/test/bad-credentials")
        void badCredentials() {
            throw new BadCredentialsException("Bad credentials");
        }

        @GetMapping("/test/auth-error")
        void authError() {
            throw new InsufficientAuthenticationException("Token không hợp lệ");
        }

        @GetMapping("/test/forbidden")
        void forbidden() {
            throw new AccessDeniedException("Không có quyền truy cập");
        }

        @GetMapping("/test/not-found")
        void notFound() {
            throw new EntityNotFoundException("Không tìm thấy chuyến đi");
        }

        @GetMapping("/test/illegal-arg")
        void illegalArg() {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        @GetMapping("/test/runtime")
        void runtime() {
            throw new IllegalStateException("Lỗi bất ngờ");
        }

        @GetMapping("/test/runtime-null")
        void runtimeNull() {
            throw new NullPointerException();
        }

        @GetMapping("/test/jwt-error")
        void jwtError() {
            throw new MalformedJwtException("Token sai định dạng");
        }
    }

    static class DummyRequest {
        @NotBlank(message = "Tên không được để trống")
        public String name;
    }
}
