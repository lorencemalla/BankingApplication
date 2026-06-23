package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.BillPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillPaymentController {

    @Autowired
    private BillPaymentService billPaymentService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/pay")
    public ResponseEntity<?> payBill(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Bill paid successfully",
                billPaymentService.payBill(userId, request)));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getBillHistory(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Bill history",
                billPaymentService.getBillHistory(userId)));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
