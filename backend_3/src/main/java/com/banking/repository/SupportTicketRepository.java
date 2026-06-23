package com.banking.repository;

import com.banking.entity.SupportTicket;
import com.banking.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SupportTicket> findByTicketNumber(String ticketNumber);
    List<SupportTicket> findByStatus(TicketStatus status);
    long countByStatus(TicketStatus status);
}
