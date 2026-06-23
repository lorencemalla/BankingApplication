package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    @Autowired
    private CardService cardService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserCards(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Cards retrieved",
                cardService.getUserCards(userId)));
    }

    @PostMapping
    public ResponseEntity<?> createCard(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Card created",
                cardService.createCard(userId, request)));
    }

    @PutMapping("/{cardId}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable Long cardId, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Card status updated",
                cardService.toggleCardBlock(cardId, userId)));
    }

    @PutMapping("/{cardId}/change-pin")
    public ResponseEntity<?> changePin(@PathVariable Long cardId, @RequestBody Map<String, String> request,
                                       Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "PIN changed",
                cardService.changePin(cardId, userId, request.get("oldPin"), request.get("newPin"))));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
