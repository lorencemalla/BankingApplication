package com.banking.repository;

import com.banking.entity.Account;
import com.banking.entity.Transaction;
import com.banking.enums.TransactionStatus;
import com.banking.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @Query("SELECT t FROM Transaction t WHERE t.fromAccount = :account OR t.toAccount = :account ORDER BY t.createdAt DESC")
    Page<Transaction> findByAccount(@Param("account") Account account, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccount = :account OR t.toAccount = :account) ORDER BY t.createdAt DESC")
    List<Transaction> findRecentByAccount(@Param("account") Account account, Pageable pageable);

    @Query("SELECT t FROM Transaction t LEFT JOIN t.fromAccount fa LEFT JOIN t.toAccount ta " +
           "WHERE (fa.user.id = :userId OR ta.user.id = :userId) ORDER BY t.createdAt DESC")
    List<Transaction> findByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t LEFT JOIN t.fromAccount fa LEFT JOIN t.toAccount ta " +
           "WHERE (fa.user.id = :userId OR ta.user.id = :userId) AND t.createdAt BETWEEN :start AND :end ORDER BY t.createdAt DESC")
    List<Transaction> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Transaction> findByStatus(TransactionStatus status);

    long countByStatus(TransactionStatus status);

    // Admin: all transactions ordered by date
    @Query("SELECT t FROM Transaction t ORDER BY t.createdAt DESC")
    List<Transaction> findAllOrderByCreatedAtDesc(Pageable pageable);

    // Admin: all transactions for the system
    @Query("SELECT t FROM Transaction t ORDER BY t.createdAt DESC")
    List<Transaction> findAllOrderByCreatedAtDesc();

    // Admin: count transactions in date range
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.createdAt BETWEEN :start AND :end")
    long countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Admin: sum amounts by type
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.status = 'COMPLETED'")
    BigDecimal sumAmountByType(@Param("type") TransactionType type);

    // Admin: daily transaction counts for last N days
    @Query("SELECT FUNCTION('DATE', t.createdAt) as txDate, COUNT(t) FROM Transaction t WHERE t.createdAt >= :since GROUP BY FUNCTION('DATE', t.createdAt) ORDER BY txDate")
    List<Object[]> countTransactionsByDay(@Param("since") LocalDateTime since);

    // Admin: daily transaction amounts for last N days
    @Query("SELECT FUNCTION('DATE', t.createdAt) as txDate, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.createdAt >= :since AND t.status = 'COMPLETED' GROUP BY FUNCTION('DATE', t.createdAt) ORDER BY txDate")
    List<Object[]> sumTransactionAmountsByDay(@Param("since") LocalDateTime since);

    // Admin: count by type
    long countByType(TransactionType type);
}
