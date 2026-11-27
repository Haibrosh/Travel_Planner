package com.travel.planner.config;

import com.travel.planner.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;

/**
 * Chức năng: Bắt tất cả Exception trong hệ thống và chuẩn hóa thành phản hồi JSON đồng nhất { status, message, timestamp }.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bắt lỗi nhập liệu từ Client (@NotBlank, @Email...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst()
                .orElse("Dữ liệu đầu vào không hợp lệ");
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", msg, "Dữ liệu đầu vào không hợp lệ");
    }

    // Bắt lỗi validate từng phần tử khi @RequestBody là danh sách (ví dụ: @Valid List<ReorderItemRequest>)
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(HandlerMethodValidationException ex) {
        String msg = ex.getAllErrors().stream()
                .map(err -> err instanceof FieldError fieldError
                        ? fieldError.getField() + ": " + fieldError.getDefaultMessage()
                        : err.getDefaultMessage())
                .findFirst()
                .orElse("Dữ liệu đầu vào không hợp lệ");
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", msg, "Dữ liệu đầu vào không hợp lệ");
    }

    // Bắt lỗi body JSON sai định dạng hoặc sai cấu trúc (không parse được)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        String customMessage = extractIllegalArgumentMessage(ex);
        String msg = customMessage != null
                ? customMessage
                : "Dữ liệu gửi lên không đúng định dạng JSON hoặc sai cấu trúc.";
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                msg,
                "Dữ liệu gửi lên không đúng định dạng JSON hoặc sai cấu trúc."
        );
    }

    private String extractIllegalArgumentMessage(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof IllegalArgumentException && current.getMessage() != null && !current.getMessage().isBlank()) {
                return current.getMessage();
            }
            current = current.getCause();
        }
        return null;
    }

    // Bắt lỗi thiếu query parameter bắt buộc (@RequestParam)
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "Thiếu tham số bắt buộc: " + ex.getParameterName(),
                "Thiếu tham số bắt buộc."
        );
    }

    // Bắt lỗi sai kiểu dữ liệu của path variable hoặc query parameter
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "Tham số '" + ex.getName() + "' không đúng định dạng.",
                "Tham số không đúng định dạng."
        );
    }

    // Bắt lỗi sai thông tin đăng nhập (email hoặc mật khẩu sai)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                "Email hoặc mật khẩu không chính xác.",
                "Email hoặc mật khẩu không chính xác."
        );
    }

    // Bắt các lỗi xác thực khác từ Spring Security
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                ex.getMessage(),
                "Xác thực không thành công. Vui lòng đăng nhập lại."
        );
    }

    // Bắt lỗi không đủ quyền truy cập (ví dụ: xem hoặc xóa trip của người khác -> trả về 403 Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                ex.getMessage(),
                "Bạn không có quyền thực hiện thao tác này."
        );
    }

    // Bắt lỗi không tìm thấy dữ liệu trong DB (ví dụ: tripId hoặc destinationId không tồn tại -> trả về 404 Not Found)
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Not Found",
                ex.getMessage(),
                "Không tìm thấy dữ liệu yêu cầu."
        );
    }

    // Bắt lỗi gọi sai endpoint hoặc không tìm thấy tài nguyên tĩnh (404 Not Found)
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Not Found",
                "Không tìm thấy tài nguyên yêu cầu.",
                "Không tìm thấy tài nguyên yêu cầu."
        );
    }

    // Bắt các lỗi nghiệp vụ logic (trùng email, ngày kết thúc nhỏ hơn ngày bắt đầu...)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                ex.getMessage(),
                "Yêu cầu không hợp lệ."
        );
    }

    // Bắt tất cả các lỗi runtime chưa xử lý
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unhandled exception caught by GlobalExceptionHandler", ex);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getClass().getSimpleName(),
                ex.getMessage(),
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."
        );
    }

    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status,
            String error,
            String message,
            String fallbackMessage
    ) {
        String resolvedMessage = (message == null || message.isBlank()) ? fallbackMessage : message;
        ErrorResponse response = ErrorResponse.builder()
                .status(status.value())
                .message(resolvedMessage)
                .timestamp(LocalDateTime.now())
                .error(error)
                .build();
        return ResponseEntity.status(status).body(response);
    }
}
