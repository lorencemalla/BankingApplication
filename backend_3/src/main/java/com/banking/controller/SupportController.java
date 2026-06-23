package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.SupportTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    @Autowired
    private SupportTicketService supportTicketService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/tickets")
    public ResponseEntity<?> getTickets(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Tickets retrieved",
                supportTicketService.getUserTickets(userId)));
    }

    @PostMapping("/tickets")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Ticket created",
                supportTicketService.createTicket(userId, request)));
    }

    @GetMapping("/tickets/{ticketNumber}")
    public ResponseEntity<?> getTicket(@PathVariable String ticketNumber) {
        return ResponseEntity.ok(new ApiResponse(true, "Ticket details",
                supportTicketService.getTicketByNumber(ticketNumber)));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
