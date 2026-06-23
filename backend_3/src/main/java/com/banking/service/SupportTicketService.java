package com.banking.service;

import com.banking.entity.SupportTicket;
import com.banking.entity.User;
import com.banking.enums.TicketStatus;
import com.banking.repository.SupportTicketRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SupportTicketService {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Map<String, Object>> getUserTickets(Long userId) {
        List<SupportTicket> tickets = supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SupportTicket t : tickets) {
            result.add(mapTicket(t));
        }
        return result;
    }

    public SupportTicket createTicket(Long userId, Map<String, String> request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber("TKT" + System.currentTimeMillis());
        ticket.setUser(user);
        ticket.setSubject(request.get("subject"));
        ticket.setDescription(request.get("description"));
        ticket.setStatus(TicketStatus.OPEN);
        return supportTicketRepository.save(ticket);
    }

    public Map<String, Object> getTicketByNumber(String ticketNumber) {
        SupportTicket ticket = supportTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapTicket(ticket);
    }

    // Admin methods
    public List<Map<String, Object>> getAllTickets() {
        List<SupportTicket> tickets = supportTicketRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (SupportTicket t : tickets) {
            Map<String, Object> map = mapTicket(t);
            map.put("userName", t.getUser().getFirstName() + " " + t.getUser().getLastName());
            map.put("userEmail", t.getUser().getEmail());
            result.add(map);
        }
        return result;
    }

    public SupportTicket resolveTicket(Long ticketId, String response) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResponse(response);
        ticket.setResolvedAt(LocalDateTime.now());
        return supportTicketRepository.save(ticket);
    }

    private Map<String, Object> mapTicket(SupportTicket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("ticketNumber", t.getTicketNumber());
        map.put("subject", t.getSubject());
        map.put("description", t.getDescription());
        map.put("status", t.getStatus().name());
        map.put("response", t.getResponse());
        map.put("createdAt", t.getCreatedAt());
        map.put("resolvedAt", t.getResolvedAt());
        return map;
    }
}
