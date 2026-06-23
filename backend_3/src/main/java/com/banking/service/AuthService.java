package com.banking.service;

import com.banking.dto.AuthResponse;
import com.banking.dto.LoginRequest;
import com.banking.dto.RegisterRequest;
import com.banking.dto.VerifyOtpRequest;
import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.enums.AccountType;
import com.banking.enums.UserRole;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import com.banking.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setRole(UserRole.CUSTOMER);
        user.setEmailVerified(false);

        // Generate and store OTP
        String otp = generateOtp();
        user.setVerificationOtp(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

        user = userRepository.save(user);

        // Create a default savings account
        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setUser(user);
        account.setAccountType(AccountType.SAVINGS);
        account.setBalance(new BigDecimal("1000.00"));
        account.setBranchName("Main Branch");
        account.setIfscCode("BANK0001234");
        accountRepository.save(account);

        // Send OTP email
        emailService.sendOtpEmail(user.getEmail(), otp, user.getFirstName());

        return "Registration successful. OTP sent to " + user.getEmail();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(request.getOtp(), user.getVerificationOtp())) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Mark email as verified and clear OTP data
        user.setEmailVerified(true);
        user.setVerificationOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Generate token and return auth response
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getRole().name(), user.getId());
    }

    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        // Generate new OTP
        String otp = generateOtp();
        user.setVerificationOtp(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        // Send new OTP email
        emailService.sendOtpEmail(user.getEmail(), otp, user.getFirstName());

        return "New OTP sent to " + user.getEmail();
    }

    public AuthResponse login(LoginRequest request) {
        // Check if email is verified before authenticating
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("EMAIL_NOT_VERIFIED");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(token, user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getRole().name(), user.getId());
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000); // 6-digit OTP
        return String.valueOf(otp);
    }

    private String generateAccountNumber() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            sb.append(random.nextInt(10));
        }
        String accountNumber = sb.toString();
        if (accountRepository.existsByAccountNumber(accountNumber)) {
            return generateAccountNumber();
        }
        return accountNumber;
    }
}
