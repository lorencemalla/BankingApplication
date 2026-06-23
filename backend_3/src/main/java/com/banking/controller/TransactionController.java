package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.TransferRequest;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.service.BillPaymentService;
import com.banking.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BillPaymentService billPaymentService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@Valid @RequestBody TransferRequest request, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Transfer successful",
                transactionService.transfer(request, userId)));
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        String otp = request.get("otp");
        return ResponseEntity.ok(new ApiResponse(true, "Deposit successful",
                transactionService.deposit(request.get("accountNumber"),
                        new BigDecimal(request.get("amount")), userId, otp)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody Map<String, String> request, Authentication authentication) {
        Long userId = getUserId(authentication);
        String otp = request.get("otp");
        return ResponseEntity.ok(new ApiResponse(true, "Withdrawal successful",
                transactionService.withdraw(request.get("accountNumber"),
                        new BigDecimal(request.get("amount")), userId, otp)));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Transaction history",
                transactionService.getTransactionHistory(userId)));
    }

    @GetMapping("/mini-statement/{accountNumber}")
    public ResponseEntity<?> getMiniStatement(@PathVariable String accountNumber, Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Mini statement",
                transactionService.getMiniStatement(userId, accountNumber)));
    }

    @GetMapping("/statement")
    public ResponseEntity<?> getStatement(
            @RequestParam String startDate, @RequestParam String endDate,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
        return ResponseEntity.ok(new ApiResponse(true, "Statement",
                transactionService.getTransactionsByDateRange(userId, start, end)));
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<?> getRecentActivity(Authentication authentication) {
        Long userId = getUserId(authentication);

        // Combine transactions and bill payments into a unified activity feed
        List<Map<String, Object>> activities = new ArrayList<>();

        // Get recent transactions
        List<Map<String, Object>> transactions = transactionService.getTransactionHistory(userId);
        for (Map<String, Object> tx : transactions) {
            Map<String, Object> activity = new LinkedHashMap<>(tx);
            activity.put("activityType", "TRANSACTION");
            activities.add(activity);
        }

        // Get recent bill payments
        List<Map<String, Object>> bills = billPaymentService.getBillHistory(userId);
        for (Map<String, Object> bill : bills) {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("id", bill.get("id"));
            activity.put("activityType", "BILL_PAYMENT");
            activity.put("type", "BILL_PAYMENT");
            activity.put("description", "Bill: " + bill.get("billerName") + " (" + String.valueOf(bill.get("category")).replace("_", " ") + ")");
            activity.put("amount", bill.get("amount"));
            activity.put("direction", "DEBIT");
            activity.put("status", bill.get("paid") != null && (boolean)bill.get("paid") ? "COMPLETED" : "PENDING");
            activity.put("referenceNumber", bill.get("referenceNumber"));
            activity.put("createdAt", bill.get("paidAt") != null ? bill.get("paidAt") : bill.get("createdAt"));
            activities.add(activity);
        }

        // Sort by date descending
        activities.sort((a, b) -> {
            Object dateA = a.get("createdAt");
            Object dateB = b.get("createdAt");
            if (dateA == null && dateB == null) return 0;
            if (dateA == null) return 1;
            if (dateB == null) return -1;
            return dateB.toString().compareTo(dateA.toString());
        });

        // Limit to 10 most recent
        List<Map<String, Object>> recent = activities.size() > 10 ? activities.subList(0, 10) : activities;

        return ResponseEntity.ok(new ApiResponse(true, "Recent activity", recent));
    }

    private Long getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
