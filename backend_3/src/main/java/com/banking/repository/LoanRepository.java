package com.banking.repository;

import com.banking.entity.Loan;
import com.banking.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserId(Long userId);
    Optional<Loan> findByLoanId(String loanId);
    List<Loan> findByStatus(LoanStatus status);
    long countByStatus(LoanStatus status);

    // Admin: all loans ordered by date
    List<Loan> findAllByOrderByCreatedAtDesc();

    // Admin: total loan amount by status
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM Loan l WHERE l.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") LoanStatus status);
}
