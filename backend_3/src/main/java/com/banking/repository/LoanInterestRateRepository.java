package com.banking.repository;

import com.banking.entity.LoanInterestRate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoanInterestRateRepository extends JpaRepository<LoanInterestRate, Long> {
    Optional<LoanInterestRate> findByLoanType(String loanType);
    List<LoanInterestRate> findByActiveTrue();
    Optional<LoanInterestRate> findByLoanTypeAndActiveTrue(String loanType);
}
