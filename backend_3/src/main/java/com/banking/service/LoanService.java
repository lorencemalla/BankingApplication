package com.banking.service;

import com.banking.entity.Loan;
import com.banking.entity.LoanInterestRate;
import com.banking.entity.User;
import com.banking.enums.LoanStatus;
import com.banking.repository.LoanInterestRateRepository;
import com.banking.repository.LoanRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoanInterestRateRepository loanInterestRateRepository;

    // Default interest rates per loan type (used when admin hasn't configured)
    private static final Map<String, BigDecimal> DEFAULT_RATES = Map.of(
        "Personal", new BigDecimal("12.50"),
        "Home", new BigDecimal("8.50"),
        "Education", new BigDecimal("9.00"),
        "Vehicle", new BigDecimal("10.50"),
        "Business", new BigDecimal("14.00")
    );

    public List<Map<String, Object>> getUserLoans(Long userId) {
        List<Loan> loans = loanRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Loan l : loans) {
            result.add(mapLoan(l));
        }
        return result;
    }

    public Loan applyLoan(Long userId, Map<String, String> request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal amount = new BigDecimal(request.get("amount"));
        String loanType = request.get("loanType");
        int termMonths = Integer.parseInt(request.get("termMonths"));

        // Get interest rate from bank configuration (not from customer)
        BigDecimal interestRate = getBankInterestRate(loanType);

        BigDecimal emi = calculateEMI(amount, interestRate, termMonths);

        Loan loan = new Loan();
        loan.setLoanId("LN" + System.currentTimeMillis());
        loan.setUser(user);
        loan.setLoanType(loanType);
        loan.setAmount(amount);
        loan.setInterestRate(interestRate);
        loan.setTermMonths(termMonths);
        loan.setEmi(emi);
        loan.setRemainingAmount(amount.add(amount.multiply(interestRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)));
        loan.setStatus(LoanStatus.PENDING);
        return loanRepository.save(loan);
    }

    /**
     * Get the bank-configured interest rate for a loan type.
     * Falls back to default rates if no admin configuration exists.
     */
    public BigDecimal getBankInterestRate(String loanType) {
        return loanInterestRateRepository.findByLoanTypeAndActiveTrue(loanType)
                .map(LoanInterestRate::getInterestRate)
                .orElse(DEFAULT_RATES.getOrDefault(loanType, new BigDecimal("10.50")));
    }

    /**
     * Get all loan rates (bank-configured + defaults)
     */
    public List<Map<String, Object>> getAllLoanRates() {
        List<Map<String, Object>> rates = new ArrayList<>();
        String[] types = {"Personal", "Home", "Education", "Vehicle", "Business"};
        
        for (String type : types) {
            Map<String, Object> rateInfo = new LinkedHashMap<>();
            rateInfo.put("loanType", type);
            
            Optional<LoanInterestRate> configured = loanInterestRateRepository.findByLoanTypeAndActiveTrue(type);
            if (configured.isPresent()) {
                LoanInterestRate rate = configured.get();
                rateInfo.put("interestRate", rate.getInterestRate());
                rateInfo.put("minAmount", rate.getMinAmount());
                rateInfo.put("maxAmount", rate.getMaxAmount());
                rateInfo.put("minTermMonths", rate.getMinTermMonths());
                rateInfo.put("maxTermMonths", rate.getMaxTermMonths());
                rateInfo.put("configuredByAdmin", true);
            } else {
                rateInfo.put("interestRate", DEFAULT_RATES.getOrDefault(type, new BigDecimal("10.50")));
                rateInfo.put("minAmount", null);
                rateInfo.put("maxAmount", null);
                rateInfo.put("minTermMonths", 0);
                rateInfo.put("maxTermMonths", 0);
                rateInfo.put("configuredByAdmin", false);
            }
            rates.add(rateInfo);
        }
        return rates;
    }

    public Map<String, Object> calculateEMIDetails(BigDecimal amount, BigDecimal annualRate, int termMonths) {
        BigDecimal emi = calculateEMI(amount, annualRate, termMonths);
        BigDecimal totalPayment = emi.multiply(new BigDecimal(termMonths));
        BigDecimal totalInterest = totalPayment.subtract(amount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("emi", emi);
        result.put("totalPayment", totalPayment);
        result.put("totalInterest", totalInterest);
        result.put("principal", amount);
        result.put("termMonths", termMonths);
        result.put("annualRate", annualRate);
        return result;
    }

    private BigDecimal calculateEMI(BigDecimal principal, BigDecimal annualRate, int termMonths) {
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(new BigDecimal(termMonths), 2, RoundingMode.HALF_UP);
        }
        BigDecimal monthlyRate = annualRate.divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        double power = Math.pow(onePlusR.doubleValue(), termMonths);
        BigDecimal powerBD = new BigDecimal(power, new MathContext(10));
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(powerBD);
        BigDecimal denominator = powerBD.subtract(BigDecimal.ONE);
        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> mapLoan(Loan l) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", l.getId());
        map.put("loanId", l.getLoanId());
        map.put("loanType", l.getLoanType());
        map.put("amount", l.getAmount());
        map.put("interestRate", l.getInterestRate());
        map.put("termMonths", l.getTermMonths());
        map.put("emi", l.getEmi());
        map.put("totalPaid", l.getTotalPaid());
        map.put("remainingAmount", l.getRemainingAmount());
        map.put("status", l.getStatus().name());
        map.put("createdAt", l.getCreatedAt());
        map.put("approvedAt", l.getApprovedAt());
        return map;
    }
}
