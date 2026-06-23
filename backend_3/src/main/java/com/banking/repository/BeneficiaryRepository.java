package com.banking.repository;

import com.banking.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {
    List<Beneficiary> findByUserIdAndActiveTrue(Long userId);
    List<Beneficiary> findByUserId(Long userId);
}
