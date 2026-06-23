package com.banking.config;

import com.banking.entity.User;
import com.banking.enums.UserRole;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the admin account on application startup if it doesn't already exist.
 * Admin credentials:  nexus@banking.com / nexus123
 */
@Component
public class AdminDataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "nexus@banking.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setFirstName("Nexus");
            admin.setLastName("Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("nexus123"));
            admin.setPhone("0000000000");
            admin.setAddress("NexusBank HQ");
            admin.setRole(UserRole.ADMIN);
            admin.setEnabled(true);
            admin.setEmailVerified(true);
            userRepository.save(admin);
            System.out.println("✅ Admin account seeded: " + adminEmail);
        } else {
            // Ensure existing admin user has correct role and is enabled
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                boolean changed = false;
                if (admin.getRole() != UserRole.ADMIN) {
                    admin.setRole(UserRole.ADMIN);
                    changed = true;
                }
                if (!admin.isEmailVerified()) {
                    admin.setEmailVerified(true);
                    changed = true;
                }
                if (!admin.isEnabled()) {
                    admin.setEnabled(true);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(admin);
                    System.out.println("✅ Admin account updated: " + adminEmail);
                }
            });
        }
    }
}
