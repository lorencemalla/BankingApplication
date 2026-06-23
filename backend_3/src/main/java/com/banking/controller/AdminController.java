package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.entity.Account;
import com.banking.entity.LoanInterestRate;
import com.banking.entity.Loan;
import com.banking.entity.Transaction;
import com.banking.entity.BillPayment;
import com.banking.enums.*;
import com.banking.repository.*;
import com.banking.service.LoanService;
import com.banking.service.SupportTicketService;
import com.banking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private SupportTicketService supportTicketService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private BillPaymentRepository billPaymentRepository;

    @Autowired
    private LoanInterestRateRepository loanInterestRateRepository;

    @Autowired
    private LoanService loanService;

    // ==================== ENHANCED DASHBOARD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalAccounts", accountRepository.count());
        stats.put("totalTransactions", transactionRepository.count());
        stats.put("pendingTransactions", transactionRepository.countByStatus(TransactionStatus.PENDING));
        stats.put("totalLoans", loanRepository.count());
        stats.put("pendingLoans", loanRepository.countByStatus(LoanStatus.PENDING));
        stats.put("approvedLoans", loanRepository.countByStatus(LoanStatus.APPROVED));
        stats.put("rejectedLoans", loanRepository.countByStatus(LoanStatus.REJECTED));
        stats.put("openTickets", supportTicketRepository.countByStatus(TicketStatus.OPEN));

        // Total system balance
        BigDecimal totalBalance = accountRepository.findAll().stream()
                .filter(Account::isActive)
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalSystemBalance", totalBalance);

        // Transaction type counts
        stats.put("totalTransfers", transactionRepository.countByType(TransactionType.TRANSFER));
        stats.put("totalDeposits", transactionRepository.countByType(TransactionType.DEPOSIT));
        stats.put("totalWithdrawals", transactionRepository.countByType(TransactionType.WITHDRAWAL));

        // Transaction amounts by type
        stats.put("totalDepositAmount", transactionRepository.sumAmountByType(TransactionType.DEPOSIT));
        stats.put("totalWithdrawalAmount", transactionRepository.sumAmountByType(TransactionType.WITHDRAWAL));
        stats.put("totalTransferAmount", transactionRepository.sumAmountByType(TransactionType.TRANSFER));

        // Loan amounts
        stats.put("totalApprovedLoanAmount", loanRepository.sumAmountByStatus(LoanStatus.APPROVED));
        stats.put("totalPendingLoanAmount", loanRepository.sumAmountByStatus(LoanStatus.PENDING));

        // Bill payment stats
        stats.put("totalBillPaymentAmount", billPaymentRepository.sumTotalPaidAmount());

        // Account type distribution
        Map<String, Long> accountTypeDistribution = new LinkedHashMap<>();
        for (AccountType type : AccountType.values()) {
            long count = accountRepository.findAll().stream()
                    .filter(a -> a.getAccountType() == type)
                    .count();
            accountTypeDistribution.put(type.name(), count);
        }
        stats.put("accountTypeDistribution", accountTypeDistribution);

        // Transaction volume last 30 days
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Object[]> dailyCounts = transactionRepository.countTransactionsByDay(thirtyDaysAgo);
        List<Map<String, Object>> transactionVolume = new ArrayList<>();
        for (Object[] row : dailyCounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", row[0] != null ? row[0].toString() : "");
            entry.put("count", row[1]);
            transactionVolume.add(entry);
        }
        stats.put("transactionVolume", transactionVolume);

        // Transaction amounts last 30 days
        List<Object[]> dailyAmounts = transactionRepository.sumTransactionAmountsByDay(thirtyDaysAgo);
        List<Map<String, Object>> transactionAmounts = new ArrayList<>();
        for (Object[] row : dailyAmounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", row[0] != null ? row[0].toString() : "");
            entry.put("amount", row[1]);
            transactionAmounts.add(entry);
        }
        stats.put("transactionAmounts", transactionAmounts);

        // Recent transactions (last 10)
        List<Transaction> recentTransactions = transactionRepository.findAllOrderByCreatedAtDesc(PageRequest.of(0, 10));
        List<Map<String, Object>> recentTxList = new ArrayList<>();
        for (Transaction t : recentTransactions) {
            recentTxList.add(mapTransactionForAdmin(t));
        }
        stats.put("recentTransactions", recentTxList);

        return ResponseEntity.ok(new ApiResponse(true, "Admin dashboard", stats));
    }

    // ==================== USERS ====================

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(new ApiResponse(true, "All users", userService.getAllUsers()));
    }

    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long userId) {
        userService.toggleUserStatus(userId);
        return ResponseEntity.ok(new ApiResponse(true, "User status toggled"));
    }

    @GetMapping("/users/{userId}/transactions")
    public ResponseEntity<?> getUserTransactions(@PathVariable Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Transaction t : transactions) {
            result.add(mapTransactionForAdmin(t));
        }
        return ResponseEntity.ok(new ApiResponse(true, "User transactions", result));
    }

    @GetMapping("/users/{userId}/accounts")
    public ResponseEntity<?> getUserAccounts(@PathVariable Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account acc : accounts) {
            result.add(mapAccountToResponse(acc));
        }
        return ResponseEntity.ok(new ApiResponse(true, "User accounts", result));
    }

    // ==================== ACCOUNTS ====================

    @GetMapping("/accounts")
    public ResponseEntity<?> getAllAccounts() {
        List<Account> accounts = accountRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account acc : accounts) {
            result.add(mapAccountToResponse(acc));
        }
        return ResponseEntity.ok(new ApiResponse(true, "All accounts", result));
    }

    @PutMapping("/accounts/{id}/toggle-status")
    public ResponseEntity<?> toggleAccountStatus(@PathVariable Long id) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setActive(!acc.isActive());
        accountRepository.save(acc);
        return ResponseEntity.ok(new ApiResponse(true, "Account status updated successfully"));
    }

    @PutMapping("/accounts/{id}/adjust-balance")
    public ResponseEntity<?> adjustAccountBalance(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        BigDecimal amount = new BigDecimal(request.get("balance"));
        acc.setBalance(amount);
        accountRepository.save(acc);
        return ResponseEntity.ok(new ApiResponse(true, "Account balance updated successfully"));
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        accountRepository.delete(acc);
        return ResponseEntity.ok(new ApiResponse(true, "Account deleted successfully"));
    }

    @GetMapping("/accounts/deletion-requests")
    public ResponseEntity<?> getDeletionRequests() {
        List<Account> accounts = accountRepository.findByDeletionRequestedTrue();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account acc : accounts) {
            result.add(mapAccountToResponse(acc));
        }
        return ResponseEntity.ok(new ApiResponse(true, "All account deletion requests", result));
    }

    @PutMapping("/accounts/{id}/approve-deletion")
    public ResponseEntity<?> approveDeletion(@PathVariable Long id) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setActive(false);
        acc.setDeletionRequested(false);
        accountRepository.save(acc);
        return ResponseEntity.ok(new ApiResponse(true, "Account deletion approved and account closed"));
    }

    @PutMapping("/accounts/{id}/reject-deletion")
    public ResponseEntity<?> rejectDeletion(@PathVariable Long id) {
        Account acc = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        acc.setDeletionRequested(false);
        accountRepository.save(acc);
        return ResponseEntity.ok(new ApiResponse(true, "Account deletion request rejected"));
    }

    // ==================== TRANSACTIONS (system-wide) ====================

    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAllOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Transaction t : transactions) {
            result.add(mapTransactionForAdmin(t));
        }
        return ResponseEntity.ok(new ApiResponse(true, "All transactions", result));
    }

    // ==================== LOANS ====================

    @GetMapping("/loans")
    public ResponseEntity<?> getAllLoans() {
        List<Loan> loans = loanRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Loan l : loans) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", l.getId());
            map.put("loanId", l.getLoanId());
            map.put("loanType", l.getLoanType());
            map.put("amount", l.getAmount());
            map.put("interestRate", l.getInterestRate());
            map.put("termMonths", l.getTermMonths());
            map.put("emi", l.getEmi());
            map.put("totalPaid", l.getTotalPaid());
            map.put("remainingAmount", l.getRemainingAmount());
            map.put("status", l.getStatus().name());
            map.put("createdAt", l.getCreatedAt());
            map.put("approvedAt", l.getApprovedAt());
            if (l.getUser() != null) {
                Map<String, Object> userMap = new LinkedHashMap<>();
                userMap.put("id", l.getUser().getId());
                userMap.put("firstName", l.getUser().getFirstName());
                userMap.put("lastName", l.getUser().getLastName());
                userMap.put("email", l.getUser().getEmail());
                map.put("user", userMap);
            }
            result.add(map);
        }
        return ResponseEntity.ok(new ApiResponse(true, "All loans", result));
    }

    @GetMapping("/loans/pending")
    public ResponseEntity<?> getPendingLoans() {
        return ResponseEntity.ok(new ApiResponse(true, "Pending loans",
                loanRepository.findByStatus(LoanStatus.PENDING)));
    }

    @PutMapping("/loans/{loanId}/approve")
    public ResponseEntity<?> approveLoan(@PathVariable Long loanId) {
        var loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedAt(java.time.LocalDateTime.now());
        loanRepository.save(loan);
        return ResponseEntity.ok(new ApiResponse(true, "Loan approved"));
    }

    @PutMapping("/loans/{loanId}/reject")
    public ResponseEntity<?> rejectLoan(@PathVariable Long loanId) {
        var loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        loan.setStatus(LoanStatus.REJECTED);
        loanRepository.save(loan);
        return ResponseEntity.ok(new ApiResponse(true, "Loan rejected"));
    }

    // ==================== LOAN INTEREST RATES ====================

    @GetMapping("/loan-rates")
    public ResponseEntity<?> getLoanRates() {
        List<LoanInterestRate> rates = loanInterestRateRepository.findByActiveTrue();
        List<Map<String, Object>> result = new ArrayList<>();
        for (LoanInterestRate rate : rates) {
            result.add(mapLoanRate(rate));
        }
        return ResponseEntity.ok(new ApiResponse(true, "Loan interest rates", result));
    }

    @PostMapping("/loan-rates")
    public ResponseEntity<?> setLoanRate(@RequestBody Map<String, String> request) {
        String loanType = request.get("loanType");
        LoanInterestRate rate = loanInterestRateRepository.findByLoanType(loanType)
                .orElse(new LoanInterestRate());
        rate.setLoanType(loanType);
        rate.setInterestRate(new BigDecimal(request.get("interestRate")));
        if (request.containsKey("minAmount")) rate.setMinAmount(new BigDecimal(request.get("minAmount")));
        if (request.containsKey("maxAmount")) rate.setMaxAmount(new BigDecimal(request.get("maxAmount")));
        if (request.containsKey("minTermMonths")) rate.setMinTermMonths(Integer.parseInt(request.get("minTermMonths")));
        if (request.containsKey("maxTermMonths")) rate.setMaxTermMonths(Integer.parseInt(request.get("maxTermMonths")));
        rate.setActive(true);
        loanInterestRateRepository.save(rate);
        return ResponseEntity.ok(new ApiResponse(true, "Loan rate updated", mapLoanRate(rate)));
    }

    @DeleteMapping("/loan-rates/{id}")
    public ResponseEntity<?> deleteLoanRate(@PathVariable Long id) {
        LoanInterestRate rate = loanInterestRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan rate not found"));
        rate.setActive(false);
        loanInterestRateRepository.save(rate);
        return ResponseEntity.ok(new ApiResponse(true, "Loan rate deactivated"));
    }

    // ==================== TICKETS ====================

    @GetMapping("/tickets")
    public ResponseEntity<?> getAllTickets() {
        return ResponseEntity.ok(new ApiResponse(true, "All tickets", supportTicketService.getAllTickets()));
    }

    @PutMapping("/tickets/{ticketId}/resolve")
    public ResponseEntity<?> resolveTicket(@PathVariable Long ticketId, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(new ApiResponse(true, "Ticket resolved",
                supportTicketService.resolveTicket(ticketId, request.get("response"))));
    }

    // ==================== HELPERS ====================

    private Map<String, Object> mapAccountToResponse(Account acc) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", acc.getId());
        map.put("accountNumber", acc.getAccountNumber());
        map.put("accountType", acc.getAccountType().name());
        map.put("balance", acc.getBalance());
        map.put("active", acc.isActive());
        map.put("deletionRequested", acc.isDeletionRequested());
        map.put("branchName", acc.getBranchName());
        map.put("ifscCode", acc.getIfscCode());
        map.put("createdAt", acc.getCreatedAt());

        if (acc.getUser() != null) {
            Map<String, Object> userMap = new LinkedHashMap<>();
            userMap.put("id", acc.getUser().getId());
            userMap.put("firstName", acc.getUser().getFirstName());
            userMap.put("lastName", acc.getUser().getLastName());
            userMap.put("email", acc.getUser().getEmail());
            userMap.put("phone", acc.getUser().getPhone());
            map.put("user", userMap);
        } else {
            map.put("user", null);
        }
        return map;
    }

    private Map<String, Object> mapTransactionForAdmin(Transaction t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("transactionId", t.getTransactionId());
        map.put("amount", t.getAmount());
        map.put("type", t.getType().name());
        map.put("status", t.getStatus().name());
        map.put("description", t.getDescription());
        map.put("referenceNumber", t.getReferenceNumber());
        map.put("createdAt", t.getCreatedAt());

        if (t.getFromAccount() != null) {
            Map<String, Object> fromMap = new LinkedHashMap<>();
            fromMap.put("accountNumber", t.getFromAccount().getAccountNumber());
            if (t.getFromAccount().getUser() != null) {
                fromMap.put("userName", t.getFromAccount().getUser().getFirstName() + " " + t.getFromAccount().getUser().getLastName());
                fromMap.put("userId", t.getFromAccount().getUser().getId());
            }
            map.put("fromAccount", fromMap);
        } else {
            map.put("fromAccount", null);
        }

        if (t.getToAccount() != null) {
            Map<String, Object> toMap = new LinkedHashMap<>();
            toMap.put("accountNumber", t.getToAccount().getAccountNumber());
            if (t.getToAccount().getUser() != null) {
                toMap.put("userName", t.getToAccount().getUser().getFirstName() + " " + t.getToAccount().getUser().getLastName());
                toMap.put("userId", t.getToAccount().getUser().getId());
            }
            map.put("toAccount", toMap);
        } else {
            map.put("toAccount", null);
        }

        return map;
    }

    private Map<String, Object> mapLoanRate(LoanInterestRate rate) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", rate.getId());
        map.put("loanType", rate.getLoanType());
        map.put("interestRate", rate.getInterestRate());
        map.put("minAmount", rate.getMinAmount());
        map.put("maxAmount", rate.getMaxAmount());
        map.put("minTermMonths", rate.getMinTermMonths());
        map.put("maxTermMonths", rate.getMaxTermMonths());
        map.put("active", rate.isActive());
        map.put("updatedAt", rate.getUpdatedAt());
        return map;
    }
}
