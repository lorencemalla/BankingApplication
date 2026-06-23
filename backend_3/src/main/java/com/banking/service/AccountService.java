package com.banking.service;

import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.enums.AccountType;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Map<String, Object>> getUserAccounts(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account acc : accounts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", acc.getId());
            map.put("accountNumber", acc.getAccountNumber());
            map.put("accountType", acc.getAccountType().name());
            map.put("balance", acc.getBalance());
            map.put("active", acc.isActive());
            map.put("branchName", acc.getBranchName());
            map.put("ifscCode", acc.getIfscCode());
            map.put("createdAt", acc.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getAccountByNumber(String accountNumber) {
        Account acc = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", acc.getId());
        map.put("accountNumber", acc.getAccountNumber());
        map.put("accountType", acc.getAccountType().name());
        map.put("balance", acc.getBalance());
        map.put("active", acc.isActive());
        map.put("branchName", acc.getBranchName());
        map.put("ifscCode", acc.getIfscCode());
        map.put("createdAt", acc.getCreatedAt());
        return map;
    }

    public Account createAccount(Long userId, String accountType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setUser(user);
        account.setAccountType(AccountType.valueOf(accountType.toUpperCase()));
        account.setBalance(BigDecimal.ZERO);
        account.setBranchName("Main Branch");
        account.setIfscCode("BANK0001234");
        return accountRepository.save(account);
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

    public void requestDeletion(String accountNumber, Long userId) {
        Account acc = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!acc.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: This account does not belong to you");
        }
        acc.setDeletionRequested(true);
        accountRepository.save(acc);
    }
}
