package com.banking.service;

import com.banking.entity.Beneficiary;
import com.banking.entity.User;
import com.banking.repository.BeneficiaryRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Map<String, Object>> getBeneficiaries(Long userId) {
        List<Beneficiary> beneficiaries = beneficiaryRepository.findByUserIdAndActiveTrue(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Beneficiary b : beneficiaries) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId());
            map.put("beneficiaryName", b.getBeneficiaryName());
            map.put("accountNumber", b.getAccountNumber());
            map.put("bankName", b.getBankName());
            map.put("ifscCode", b.getIfscCode());
            map.put("nickname", b.getNickname());
            map.put("createdAt", b.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public Beneficiary addBeneficiary(Long userId, Map<String, String> request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        beneficiary.setBeneficiaryName(request.get("beneficiaryName"));
        beneficiary.setAccountNumber(request.get("accountNumber"));
        beneficiary.setBankName(request.get("bankName"));
        beneficiary.setIfscCode(request.get("ifscCode"));
        beneficiary.setNickname(request.get("nickname"));
        return beneficiaryRepository.save(beneficiary);
    }

    public void deleteBeneficiary(Long id, Long userId) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Beneficiary not found"));
        if (!beneficiary.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        beneficiary.setActive(false);
        beneficiaryRepository.save(beneficiary);
    }
}
