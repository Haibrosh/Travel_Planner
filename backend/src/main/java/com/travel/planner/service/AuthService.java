package com.travel.planner.service;

import com.travel.planner.dto.AuthRequest;
import com.travel.planner.dto.AuthResponse;
import com.travel.planner.dto.RegisterRequest;
import com.travel.planner.model.User;
import com.travel.planner.repository.UserRepository;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Xử lý nghiệp vụ Đăng ký tài khoản (băm mật khẩu, sinh username) và Đăng nhập (trả JWT Token).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra email đã được đăng ký chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email này đã được sử dụng. Vui lòng chọn email khác.");
        }

        // 2. Tự động sinh username nếu client không gửi lên
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = request.getEmail().split("@")[0];
        } else {
            username = username.trim();
        }

        // 3. Tạo Entity User và băm mật khẩu bằng BCrypt
        User user = User.builder()
                .email(request.getEmail())
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER") // Gán quyền mặc định là ROLE_USER
                .build();

        userRepository.save(user);

        // 4. Sinh JWT Token và đóng gói response
        String jwtToken = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        // 1. Spring Security kiểm tra email và mật khẩu (Nếu sai sẽ ném BadCredentialsException)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Lấy thông tin User từ Database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản"));

        // 3. Sinh JWT Token mới và trả về
        String jwtToken = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}
