# Banking Application

## Overview

Banking Application is a secure full-stack digital banking platform that allows users to perform essential banking operations online. The system provides secure authentication, email OTP verification, account management, and transaction tracking.

## Features

### User Features

* User Registration and Login
* Email OTP Verification
* Secure Authentication and Authorization
* Deposit Money
* Withdraw Money
* Fund Transfers
* Bill Payments
* Beneficiary Management
* Transaction History Tracking
* Profile Management

### Security Features

* JWT-Based Authentication
* Role-Based Access Control (Admin/User)
* Email OTP Verification
* Password Encryption
* Secure REST APIs

## Tech Stack

### Frontend

* React

### Backend

* Spring Boot
* Spring Security
* JWT Authentication
* SMTP Email Service

### Database

* MySQL

## Architecture

Frontend (React) → REST APIs (Spring Boot) → MySQL Database

## Installation

### Backend Setup

1. Clone the repository.
2. Configure MySQL database.
3. Update application.properties with database and email credentials.
4. Run:

```bash
mvn spring-boot:run
```

### Frontend Setup

1. Navigate to the frontend directory.
2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm run dev
```

## Future Enhancements

* Transaction Receipts via Email
* Loan Management System
* Credit/Debit Card Management
* Real-Time Notifications
* Mobile Application Support

## Author

Lorence Malla
