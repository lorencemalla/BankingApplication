package com.banking.repository;

import com.banking.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {
    List<BillPayment> findByUserId(Long userId);
    List<BillPayment> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Admin: all bill payments ordered by date
    List<BillPayment> findAllByOrderByCreatedAtDesc();

    // Admin: total bill payments amount
    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BillPayment b WHERE b.paid = true")
    BigDecimal sumTotalPaidAmount();

    // Admin: count bill payments since a date
    @Query("SELECT COUNT(b) FROM BillPayment b WHERE b.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);
}
