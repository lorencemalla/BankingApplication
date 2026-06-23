package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.BeneficiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getBeneficiaries(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Beneficiaries retrieved",
                beneficiaryService.getBeneficiaries(userId)));
    }

    @PostMapping
    public ResponseEntity<?> addBeneficiary(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Beneficiary added",
                beneficiaryService.addBeneficiary(userId, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBeneficiary(@PathVariable Long id, Authentication authentication) {
        Long userId = getUserId(authentication);
        beneficiaryService.deleteBeneficiary(id, userId);
        return ResponseEntity.ok(new ApiResponse(true, "Beneficiary removed"));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
