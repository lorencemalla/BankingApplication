package com.banking.repository;

import com.banking.entity.Card;
import com.banking.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByAccountUserId(Long userId);
    Optional<Card> findByCardNumber(String cardNumber);
    List<Card> findByAccountId(Long accountId);
    List<Card> findByStatus(CardStatus status);
}
