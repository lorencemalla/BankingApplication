package com.banking.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("NexusBank - Email Verification OTP");
            helper.setFrom("NexusBank <noreply@nexusbank.com>");

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0b1f3f, #1a3a6e, #2563eb); padding: 28px 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">NexusBank</h1>
                        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Internet Banking</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #1a202c; font-size: 15px; margin: 0 0 8px;">Hello <strong>%s</strong>,</p>
                        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                            Thank you for registering with NexusBank. Please use the following One-Time Password (OTP) to verify your email address:
                        </p>
                        <div style="text-align: center; margin: 0 0 24px;">
                            <div style="display: inline-block; background: #f0f2f5; border: 2px dashed #2563eb; border-radius: 10px; padding: 16px 40px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #1a56db;">
                                %s
                            </div>
                        </div>
                        <p style="color: #dc2626; font-size: 13px; text-align: center; margin: 0 0 20px; font-weight: 500;">
                            ⏱ This OTP is valid for 10 minutes only.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                            If you did not request this verification, please ignore this email. Do not share this OTP with anyone. NexusBank will never ask for your OTP via phone or email.
                        </p>
                    </div>
                    <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">🔒 256-bit SSL Encrypted • RBI Regulated</p>
                    </div>
                </div>
                """.formatted(firstName, otp);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    public void sendTransactionOtpEmail(String toEmail, String otp, String firstName, String type, BigDecimal amount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("NexusBank - Transaction Verification OTP");
            helper.setFrom("NexusBank <noreply@nexusbank.com>");

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0b1f3f, #1a3a6e, #2563eb); padding: 28px 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">NexusBank</h1>
                        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Transaction Verification</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #1a202c; font-size: 15px; margin: 0 0 8px;">Hello <strong>%s</strong>,</p>
                        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                            We received a request to perform a <strong>%s</strong> of <strong>₹%s</strong> from your account. Please use the following One-Time Password (OTP) to authorize this transaction:
                        </p>
                        <div style="text-align: center; margin: 0 0 24px;">
                            <div style="display: inline-block; background: #f0f2f5; border: 2px dashed #2563eb; border-radius: 10px; padding: 16px 40px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #1a56db;">
                                %s
                            </div>
                        </div>
                        <p style="color: #dc2626; font-size: 13px; text-align: center; margin: 0 0 20px; font-weight: 500;">
                            ⏱ This OTP is valid for 10 minutes only.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                            If you did not initiate this transaction, please contact NexusBank support immediately. Do not share this OTP with anyone.
                        </p>
                    </div>
                    <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">🔒 Secure Internet Banking • RBI Regulated</p>
                    </div>
                </div>
                """.formatted(firstName, type, amount.toString(), otp);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send transaction OTP email: " + e.getMessage());
        }
    }

    public void sendTransactionReceiptEmail(String toEmail, String firstName, String transactionId, String referenceNumber, BigDecimal amount, String type, String fromAccount, String toAccount, LocalDateTime timestamp, BigDecimal balance) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("NexusBank - Transaction Receipt (" + transactionId + ")");
            helper.setFrom("NexusBank <noreply@nexusbank.com>");

            String txTypeColor = amount.compareTo(BigDecimal.ZERO) >= 0 ? "#10b981" : "#dc2626";
            String txTypeLabel = type;

            String fromRow = fromAccount != null ? """
                <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">From Account</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">%s</td>
                </tr>
                """.formatted(fromAccount) : "";

            String toRow = toAccount != null ? """
                <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">To Account</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">%s</td>
                </tr>
                """.formatted(toAccount) : "";

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0b1f3f, #1a3a6e, #2563eb); padding: 28px 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">NexusBank</h1>
                        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Transaction Receipt</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #1a202c; font-size: 15px; margin: 0 0 16px;">Hello <strong>%s</strong>,</p>
                        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                            Here is the confirmation receipt for your recent transaction:
                        </p>
                        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                            <table style="width: 100%%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Transaction ID</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Reference No</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Type</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">%s</td>
                                </tr>
                                %s
                                %s
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Amount</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: %s;">₹%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Available Balance</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a202c;">₹%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Date & Time</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #4a5568;">%s</td>
                                </tr>
                            </table>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                            If you notice any discrepancies, please notify NexusBank customer service immediately.
                        </p>
                    </div>
                    <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0;">🔒 256-bit SSL Encrypted • RBI Regulated</p>
                    </div>
                </div>
                """.formatted(
                    firstName,
                    transactionId,
                    referenceNumber,
                    txTypeLabel,
                    fromRow,
                    toRow,
                    txTypeColor,
                    amount.abs().toString(),
                    balance.toString(),
                    timestamp.format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a"))
                );

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send transaction receipt email: " + e.getMessage());
        }
    }
}
