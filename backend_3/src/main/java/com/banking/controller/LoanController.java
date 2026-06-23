package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserLoans(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Loans retrieved",
                loanService.getUserLoans(userId)));
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyLoan(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Loan application submitted",
                loanService.applyLoan(userId, request)));
    }

    @GetMapping("/emi-calculator")
    public ResponseEntity<?> calculateEMI(@RequestParam BigDecimal amount,
                                          @RequestParam BigDecimal rate,
                                          @RequestParam int termMonths) {
        return ResponseEntity.ok(new ApiResponse(true, "EMI calculated",
                loanService.calculateEMIDetails(amount, rate, termMonths)));
    }

    @GetMapping("/rates")
    public ResponseEntity<?> getLoanRates() {
        return ResponseEntity.ok(new ApiResponse(true, "Loan interest rates",
                loanService.getAllLoanRates()));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
