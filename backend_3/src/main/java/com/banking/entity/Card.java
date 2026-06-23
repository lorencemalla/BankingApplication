package com.banking.entity;

import com.banking.enums.CardStatus;
import com.banking.enums.CardType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cards")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 16)
    private String cardNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardType cardType;

    private String cardHolderName;

    @Column(nullable = false)
    private LocalDate expiryDate;

    private String cvvHash;

    private String pinHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardStatus status = CardStatus.ACTIVE;

    @Column(precision = 15)
    private java.math.BigDecimal dailyLimit;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public CardType getCardType() { return cardType; }
    public void setCardType(CardType cardType) { this.cardType = cardType; }

    public String getCardHolderName() { return cardHolderName; }
    public void setCardHolderName(String cardHolderName) { this.cardHolderName = cardHolderName; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getCvvHash() { return cvvHash; }
    public void setCvvHash(String cvvHash) { this.cvvHash = cvvHash; }

    public String getPinHash() { return pinHash; }
    public void setPinHash(String pinHash) { this.pinHash = pinHash; }

    public CardStatus getStatus() { return status; }
    public void setStatus(CardStatus status) { this.status = status; }

    public java.math.BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(java.math.BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
