package com.banking.service;

import com.banking.dto.TransferRequest;
import com.banking.entity.Account;
import com.banking.entity.Notification;
import com.banking.entity.Transaction;
import com.banking.enums.TransactionStatus;
import com.banking.enums.TransactionType;
import com.banking.repository.AccountRepository;
import com.banking.repository.NotificationRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> transfer(TransferRequest request, Long userId) {
        Account fromAccount = accountRepository.findByAccountNumber(request.getFromAccountNumber())
                .orElseThrow(() -> new RuntimeException("Source account not found"));

        if (!fromAccount.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Source account doesn't belong to you");
        }

        Account toAccount = accountRepository.findByAccountNumber(request.getToAccountNumber())
                .orElseThrow(() -> new RuntimeException("Destination account not found"));

        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        com.banking.entity.User user = fromAccount.getUser();

        // OTP verification check
        if (request.getOtp() == null || request.getOtp().trim().isEmpty()) {
            SecureRandom random = new SecureRandom();
            String otp = String.valueOf(100000 + random.nextInt(900000));
            user.setVerificationOtp(passwordEncoder.encode(otp));
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);

            emailService.sendTransactionOtpEmail(
                user.getEmail(),
                otp,
                user.getFirstName(),
                request.getTransferType() != null ? request.getTransferType() : "TRANSFER",
                request.getAmount()
            );

            Map<String, Object> otpResult = new LinkedHashMap<>();
            otpResult.put("status", "OTP_REQUIRED");
            otpResult.put("message", "OTP has been sent to your registered email");
            return otpResult;
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(request.getOtp(), user.getVerificationOtp())) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Clear OTP on successful validation
        user.setVerificationOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Perform transfer
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // Create transaction record
        Transaction transaction = new Transaction();
        transaction.setTransactionId("TXN" + System.currentTimeMillis());
        transaction.setFromAccount(fromAccount);
        transaction.setToAccount(toAccount);
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getTransferType() != null ?
                TransactionType.valueOf(request.getTransferType().toUpperCase()) : TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setDescription(request.getDescription());
        transaction.setReferenceNumber("REF" + System.currentTimeMillis());
        transactionRepository.save(transaction);

        // Create notifications
        createNotification(fromAccount.getUser().getId(), "Debit Alert",
                "₹" + request.getAmount() + " debited from A/C " + maskAccountNumber(fromAccount.getAccountNumber()),
                "TRANSACTION");
        createNotification(toAccount.getUser().getId(), "Credit Alert",
                "₹" + request.getAmount() + " credited to A/C " + maskAccountNumber(toAccount.getAccountNumber()),
                "TRANSACTION");

        // Check low balance
        if (fromAccount.getBalance().compareTo(new BigDecimal("1000")) < 0) {
            createNotification(fromAccount.getUser().getId(), "Low Balance Alert",
                    "Your account " + maskAccountNumber(fromAccount.getAccountNumber()) + " balance is low: ₹" + fromAccount.getBalance(),
                    "ALERT");
        }

        // Send Email Receipts
        try {
            emailService.sendTransactionReceiptEmail(
                fromAccount.getUser().getEmail(),
                fromAccount.getUser().getFirstName(),
                transaction.getTransactionId(),
                transaction.getReferenceNumber(),
                transaction.getAmount().negate(),
                transaction.getType().name(),
                maskAccountNumber(fromAccount.getAccountNumber()),
                maskAccountNumber(toAccount.getAccountNumber()),
                transaction.getCreatedAt(),
                fromAccount.getBalance()
            );

            emailService.sendTransactionReceiptEmail(
                toAccount.getUser().getEmail(),
                toAccount.getUser().getFirstName(),
                transaction.getTransactionId(),
                transaction.getReferenceNumber(),
                transaction.getAmount(),
                transaction.getType().name(),
                maskAccountNumber(fromAccount.getAccountNumber()),
                maskAccountNumber(toAccount.getAccountNumber()),
                transaction.getCreatedAt(),
                toAccount.getBalance()
            );
        } catch (Exception e) {
            System.err.println("Failed to send transaction receipt emails: " + e.getMessage());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactionId", transaction.getTransactionId());
        result.put("amount", transaction.getAmount());
        result.put("status", transaction.getStatus().name());
        result.put("referenceNumber", transaction.getReferenceNumber());
        result.put("timestamp", transaction.getCreatedAt());
        return result;
    }

    @Transactional
    public Map<String, Object> deposit(String accountNumber, BigDecimal amount, Long userId, String otp) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        com.banking.entity.User user = account.getUser();

        // OTP verification check
        if (otp == null || otp.trim().isEmpty()) {
            SecureRandom random = new SecureRandom();
            String generatedOtp = String.valueOf(100000 + random.nextInt(900000));
            user.setVerificationOtp(passwordEncoder.encode(generatedOtp));
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);

            emailService.sendTransactionOtpEmail(
                user.getEmail(),
                generatedOtp,
                user.getFirstName(),
                "DEPOSIT",
                amount
            );

            Map<String, Object> otpResult = new LinkedHashMap<>();
            otpResult.put("status", "OTP_REQUIRED");
            otpResult.put("message", "OTP has been sent to your registered email for deposit verification");
            return otpResult;
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(otp, user.getVerificationOtp())) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Clear OTP
        user.setVerificationOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);

        Transaction transaction = new Transaction();
        transaction.setTransactionId("TXN" + System.currentTimeMillis());
        transaction.setToAccount(account);
        transaction.setAmount(amount);
        transaction.setType(TransactionType.DEPOSIT);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setDescription("Cash Deposit");
        transaction.setReferenceNumber("REF" + System.currentTimeMillis());
        transactionRepository.save(transaction);

        createNotification(userId, "Deposit Successful",
                "₹" + amount + " deposited to A/C " + maskAccountNumber(accountNumber), "TRANSACTION");

        try {
            emailService.sendTransactionReceiptEmail(
                account.getUser().getEmail(),
                account.getUser().getFirstName(),
                transaction.getTransactionId(),
                transaction.getReferenceNumber(),
                amount,
                "DEPOSIT",
                null,
                maskAccountNumber(accountNumber),
                transaction.getCreatedAt(),
                account.getBalance()
            );
        } catch (Exception e) {
            System.err.println("Failed to send deposit receipt email: " + e.getMessage());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactionId", transaction.getTransactionId());
        result.put("newBalance", account.getBalance());
        result.put("status", "COMPLETED");
        return result;
    }

    @Transactional
    public Map<String, Object> withdraw(String accountNumber, BigDecimal amount, Long userId, String otp) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (account.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        com.banking.entity.User user = account.getUser();

        // OTP verification check
        if (otp == null || otp.trim().isEmpty()) {
            SecureRandom random = new SecureRandom();
            String generatedOtp = String.valueOf(100000 + random.nextInt(900000));
            user.setVerificationOtp(passwordEncoder.encode(generatedOtp));
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);

            emailService.sendTransactionOtpEmail(
                user.getEmail(),
                generatedOtp,
                user.getFirstName(),
                "WITHDRAWAL",
                amount
            );

            Map<String, Object> otpResult = new LinkedHashMap<>();
            otpResult.put("status", "OTP_REQUIRED");
            otpResult.put("message", "OTP has been sent to your registered email for withdrawal verification");
            return otpResult;
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(otp, user.getVerificationOtp())) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Clear OTP
        user.setVerificationOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);

        Transaction transaction = new Transaction();
        transaction.setTransactionId("TXN" + System.currentTimeMillis());
        transaction.setFromAccount(account);
        transaction.setAmount(amount);
        transaction.setType(TransactionType.WITHDRAWAL);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setDescription("ATM Withdrawal");
        transaction.setReferenceNumber("REF" + System.currentTimeMillis());
        transactionRepository.save(transaction);

        createNotification(userId, "Withdrawal Alert",
                "₹" + amount + " withdrawn from A/C " + maskAccountNumber(accountNumber), "TRANSACTION");

        try {
            emailService.sendTransactionReceiptEmail(
                account.getUser().getEmail(),
                account.getUser().getFirstName(),
                transaction.getTransactionId(),
                transaction.getReferenceNumber(),
                amount.negate(),
                "WITHDRAWAL",
                maskAccountNumber(accountNumber),
                null,
                transaction.getCreatedAt(),
                account.getBalance()
            );
        } catch (Exception e) {
            System.err.println("Failed to send withdrawal receipt email: " + e.getMessage());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactionId", transaction.getTransactionId());
        result.put("newBalance", account.getBalance());
        result.put("status", "COMPLETED");
        return result;
    }

    public List<Map<String, Object>> getTransactionHistory(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        return mapTransactions(transactions, userId);
    }

    public List<Map<String, Object>> getMiniStatement(Long userId, String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        List<Transaction> transactions = transactionRepository.findRecentByAccount(account, PageRequest.of(0, 10));
        return mapTransactions(transactions, userId);
    }

    public List<Map<String, Object>> getTransactionsByDateRange(Long userId, LocalDateTime start, LocalDateTime end) {
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateRange(userId, start, end);
        return mapTransactions(transactions, userId);
    }

    private List<Map<String, Object>> mapTransactions(List<Transaction> transactions, Long userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Transaction t : transactions) {
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
                map.put("fromAccount", maskAccountNumber(t.getFromAccount().getAccountNumber()));
                boolean isDebit = t.getFromAccount().getUser().getId().equals(userId);
                map.put("direction", isDebit ? "DEBIT" : "CREDIT");
            } else {
                map.put("fromAccount", null);
                map.put("direction", "CREDIT");
            }

            if (t.getToAccount() != null) {
                map.put("toAccount", maskAccountNumber(t.getToAccount().getAccountNumber()));
            } else {
                map.put("toAccount", null);
                map.put("direction", "DEBIT");
            }

            result.add(map);
        }
        return result;
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber.length() <= 4) return accountNumber;
        return "XXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    private void createNotification(Long userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUser(new com.banking.entity.User());
        notification.getUser().setId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notificationRepository.save(notification);
    }
}
