package com.travel.planner.service;

import com.travel.planner.dto.AuthRequest;
import com.travel.planner.dto.AuthResponse;
import com.travel.planner.dto.RegisterRequest;
import com.travel.planner.model.User;
import com.travel.planner.repository.UserRepository;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("1. Đăng ký thành công với username hợp lệ (trim khoảng trắng, băm mật khẩu, trả JWT)")
    void register_withProvidedUsername_success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("hong.travel@example.com")
                .username("  Hong Nguyen  ")
                .password("secret123")
                .build();

        when(userRepository.existsByEmail("hong.travel@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("$2a$10$encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("jwt-token-123");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("hong.travel@example.com");
        assertThat(savedUser.getUsername()).isEqualTo("Hong Nguyen");
        assertThat(savedUser.getPassword()).isEqualTo("$2a$10$encodedPassword");

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token-123");
        assertThat(response.getEmail()).isEqualTo("hong.travel@example.com");
        assertThat(response.getUsername()).isEqualTo("Hong Nguyen");
    }

    @Test
    @DisplayName("2. Đăng ký thành công khi username là null -> tự sinh username từ email")
    void register_nullUsername_generatesFromEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("alice.wonder@example.com")
                .username(null)
                .password("secret123")
                .build();

        when(userRepository.existsByEmail("alice.wonder@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("jwt-token-alice");

        AuthResponse response = authService.register(request);

        assertThat(response.getUsername()).isEqualTo("alice.wonder");
        assertThat(response.getToken()).isEqualTo("jwt-token-alice");
    }

    @Test
    @DisplayName("3. Đăng ký thành công khi username chỉ gồm khoảng trắng -> tự sinh username từ email")
    void register_blankUsername_generatesFromEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("bob@travel.vn")
                .username("   ")
                .password("secret123")
                .build();

        when(userRepository.existsByEmail("bob@travel.vn")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("jwt-token-bob");

        AuthResponse response = authService.register(request);

        assertThat(response.getUsername()).isEqualTo("bob");
    }

    @Test
    @DisplayName("4. Đăng ký thất bại khi email đã được sử dụng -> ném IllegalArgumentException")
    void register_duplicateEmail_throwsIllegalArgumentException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("used@example.com")
                .username("useduser")
                .password("secret123")
                .build();

        when(userRepository.existsByEmail("used@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email này đã được sử dụng");

        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("5. Đăng nhập thành công -> xác thực qua AuthenticationManager và trả về JWT token")
    void login_success() {
        AuthRequest request = AuthRequest.builder()
                .email("user@travel.com")
                .password("password123")
                .build();

        User user = User.builder()
                .userId(1L)
                .email("user@travel.com")
                .username("traveler")
                .password("$2a$10$hashed")
                .build();

        when(userRepository.findByEmail("user@travel.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("login-jwt-token");

        AuthResponse response = authService.login(request);

        verify(authenticationManager).authenticate(
                new UsernamePasswordAuthenticationToken("user@travel.com", "password123")
        );
        assertThat(response.getToken()).isEqualTo("login-jwt-token");
        assertThat(response.getEmail()).isEqualTo("user@travel.com");
        assertThat(response.getUsername()).isEqualTo("traveler");
    }

    @Test
    @DisplayName("6. Đăng nhập thất bại khi sai email/mật khẩu -> ném BadCredentialsException")
    void login_badCredentials_throwsBadCredentialsException() {
        AuthRequest request = AuthRequest.builder()
                .email("user@travel.com")
                .password("wrong-pass")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("7. Đăng nhập thất bại khi không tìm thấy user trong DB sau bước xác thực -> ném IllegalArgumentException")
    void login_userNotFoundAfterAuth_throwsIllegalArgumentException() {
        AuthRequest request = AuthRequest.builder()
                .email("ghost@travel.com")
                .password("password123")
                .build();

        when(userRepository.findByEmail("ghost@travel.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy thông tin tài khoản");

        verifyNoInteractions(jwtService);
    }
}
