package com.finance.flfp.config;

import com.finance.flfp.auth.dto.RegisterRequest;
import com.finance.flfp.auth.service.AuthService;
import com.finance.flfp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("test@example.com").isEmpty()) {
            RegisterRequest request = RegisterRequest.builder()
                    .email("test@example.com")
                    .password("password123")
                    .build();
            authService.register(request);
            System.out.println("Created test user: test@example.com / password123");
        }
    }
}
