package com.travel.planner.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Channel Interceptor xác thực JWT cho kết nối WebSocket STOMP.
 *
 * <p>Luồng hoạt động:</p>
 * <ol>
 *   <li><b>CONNECT</b>: Client gửi JWT trong STOMP header {@code Authorization: Bearer <token>}.
 *       Interceptor trích xuất, xác minh token, và gắn {@code Authentication} vào header
 *       để các message sau đó đều mang danh tính user.</li>
 *   <li><b>SUBSCRIBE</b>: Khi client đăng ký kênh {@code /topic/trips/{tripId}},
 *       interceptor kiểm tra user đã authenticate và là thành viên ACTIVE của trip đó.
 *       Nếu không hợp lệ, subscription bị từ chối.</li>
 * </ol>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TripSecurityService tripSecurityService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        switch (command) {
            case CONNECT -> handleConnect(accessor);
            case SUBSCRIBE -> handleSubscribe(accessor);
            default -> { /* không xử lý các command khác */ }
        }

        return message;
    }

    // ===================== CONNECT: Xác thực JWT =====================

    /**
     * Trích xuất JWT từ STOMP CONNECT header {@code Authorization},
     * xác minh tính hợp lệ, rồi gắn {@link UsernamePasswordAuthenticationToken}
     * vào accessor để mọi frame sau đều có danh tính user.
     */
    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT bị từ chối: thiếu hoặc sai định dạng Authorization header");
            throw new IllegalArgumentException("Thiếu JWT token trong STOMP CONNECT header.");
        }

        String token = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(token, userDetails)) {
                log.warn("WebSocket CONNECT bị từ chối: JWT không hợp lệ cho user '{}'", username);
                throw new IllegalArgumentException("JWT token không hợp lệ hoặc đã hết hạn.");
            }

            // Gắn Authentication vào accessor → tất cả các frame trong session này
            // đều có thể truy xuất Principal thông qua accessor.getUser()
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
            accessor.setUser(authToken);

            log.info("WebSocket CONNECT thành công cho user '{}'", username);
        } catch (Exception e) {
            log.error("WebSocket CONNECT lỗi xác thực JWT: {}", e.getMessage());
            throw new IllegalArgumentException("Xác thực JWT thất bại: " + e.getMessage());
        }
    }

    // ===================== SUBSCRIBE: Kiểm tra quyền truy cập Trip =====================

    /**
     * Kiểm tra quyền khi client đăng ký kênh {@code /topic/trips/{tripId}}.
     * Chỉ cho phép user đã authenticate VÀ là thành viên ACTIVE (hoặc owner) của trip.
     */
    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();

        if (destination == null || !destination.startsWith("/topic/trips/")) {
            // Không phải kênh trip → cho qua (ví dụ: /topic/public)
            return;
        }

        // Kiểm tra user đã authenticate chưa
        if (accessor.getUser() == null) {
            log.warn("SUBSCRIBE bị từ chối: user chưa authenticate, destination='{}'", destination);
            throw new IllegalArgumentException("Bạn cần đăng nhập trước khi đăng ký lắng nghe kênh trip.");
        }

        // Trích xuất tripId từ destination: /topic/trips/{tripId} hoặc /topic/trips/{tripId}/...
        Long tripId = extractTripId(destination);
        if (tripId == null) {
            log.warn("SUBSCRIBE bị từ chối: không parse được tripId từ destination='{}'", destination);
            throw new IllegalArgumentException("Định dạng kênh không hợp lệ: " + destination);
        }

        // Lấy userId từ Authentication principal
        Long userId = extractUserId(accessor);

        // Kiểm tra user có phải thành viên của trip hay không
        if (!tripSecurityService.isMember(tripId, userId)) {
            log.warn("SUBSCRIBE bị từ chối: user {} không phải thành viên trip {}", userId, tripId);
            throw new IllegalArgumentException(
                    "Bạn không có quyền truy cập chuyến đi với ID: " + tripId);
        }

        log.info("SUBSCRIBE thành công: user {} → /topic/trips/{}", userId, tripId);
    }

    // ===================== Hàm tiện ích =====================

    /**
     * Trích xuất tripId từ destination dạng {@code /topic/trips/123} hoặc {@code /topic/trips/123/expenses}.
     */
    private Long extractTripId(String destination) {
        try {
            // Bỏ prefix "/topic/trips/" → lấy phần còn lại
            String remaining = destination.substring("/topic/trips/".length());
            // Nếu còn sub-path (ví dụ: "123/expenses") → chỉ lấy segment đầu tiên
            int slashIndex = remaining.indexOf('/');
            String tripIdStr = (slashIndex > 0) ? remaining.substring(0, slashIndex) : remaining;
            return Long.parseLong(tripIdStr);
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            return null;
        }
    }

    /**
     * Trích xuất userId từ Authentication principal đã gắn ở bước CONNECT.
     */
    private Long extractUserId(StompHeaderAccessor accessor) {
        UsernamePasswordAuthenticationToken auth =
                (UsernamePasswordAuthenticationToken) accessor.getUser();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        return userDetails.getUserId();
    }
}

