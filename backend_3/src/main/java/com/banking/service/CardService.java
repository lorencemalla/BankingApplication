package com.banking.service;

import com.banking.entity.Card;
import com.banking.entity.Account;
import com.banking.enums.CardStatus;
import com.banking.enums.CardType;
import com.banking.repository.AccountRepository;
import com.banking.repository.CardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class CardService {

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Map<String, Object>> getUserCards(Long userId) {
        List<Card> cards = cardRepository.findByAccountUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Card c : cards) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("cardNumber", maskCardNumber(c.getCardNumber()));
            map.put("cardType", c.getCardType().name());
            map.put("cardHolderName", c.getCardHolderName());
            map.put("expiryDate", c.getExpiryDate());
            map.put("status", c.getStatus().name());
            map.put("dailyLimit", c.getDailyLimit());
            map.put("accountNumber", c.getAccount().getAccountNumber());
            result.add(map);
        }
        return result;
    }

    public Card createCard(Long userId, Map<String, String> request) {
        Account account = accountRepository.findByAccountNumber(request.get("accountNumber"))
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        Card card = new Card();
        card.setCardNumber(generateCardNumber());
        card.setAccount(account);
        card.setCardType(CardType.valueOf(request.get("cardType").toUpperCase()));
        card.setCardHolderName(request.getOrDefault("cardHolderName",
                account.getUser().getFirstName() + " " + account.getUser().getLastName()));
        card.setExpiryDate(LocalDate.now().plusYears(5));
        card.setCvvHash(passwordEncoder.encode(String.valueOf(new Random().nextInt(900) + 100)));
        card.setPinHash(passwordEncoder.encode("1234"));
        card.setDailyLimit(new BigDecimal("50000"));
        return cardRepository.save(card);
    }

    public Map<String, Object> toggleCardBlock(Long cardId, Long userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        if (!card.getAccount().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (card.getStatus() == CardStatus.ACTIVE) {
            card.setStatus(CardStatus.BLOCKED);
        } else if (card.getStatus() == CardStatus.BLOCKED) {
            card.setStatus(CardStatus.ACTIVE);
        }
        cardRepository.save(card);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cardId", card.getId());
        result.put("status", card.getStatus().name());
        result.put("message", card.getStatus() == CardStatus.ACTIVE ? "Card unblocked" : "Card blocked");
        return result;
    }

    public Map<String, Object> changePin(Long cardId, Long userId, String oldPin, String newPin) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        if (!card.getAccount().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        card.setPinHash(passwordEncoder.encode(newPin));
        cardRepository.save(card);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "PIN changed successfully");
        return result;
    }

    private String generateCardNumber() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder("4"); // Visa-like prefix
        for (int i = 1; i < 16; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String maskCardNumber(String cardNumber) {
        return "XXXX-XXXX-XXXX-" + cardNumber.substring(cardNumber.length() - 4);
    }
}
