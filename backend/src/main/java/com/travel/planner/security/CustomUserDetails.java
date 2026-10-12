package com.travel.planner.security;

import com.travel.planner.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Chức năng: Lớp chuyển đổi (Adapter) đưa User entity của hệ thống về chuẩn UserDetails của Spring Security.
 */
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Tạm thời cấp quyền ROLE_USER mặc định
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        // return Collections.singletonList(new SimpleGrantedAuthority(user.getRole())); // Mở lại khi dùng DB role
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    // Dùng email làm định danh đăng nhập chính (Username)
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
