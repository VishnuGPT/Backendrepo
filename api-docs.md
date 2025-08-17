# Ultron Backend API Documentation

## Authentication APIs

This document outlines the API contracts for shipper and transporter authentication endpoints.

---

## Shipper APIs


### 1. Shipper Registration

Register a new shipper user in the system.

**Endpoint:** `/api/shipper/register`

**Method:** `POST`

**Request Body:**
```json
{
  "ownerName": "John Doe",                // Required
  "ownerContactNumber": "9876543210",     // Required
  "email": "john@example.com",            // Required
  "phoneNumber": "9876543211",           // Required
  "password": "securepassword",           // Required
  "companyName": "ABC Logistics",         // Required
  "companyAddress": "123 Main St",        // Required
  "gstNumber": "27AAPFU0939F1ZV"          // Required
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Shipper registered successfully",
  "data": {
    "id": 1,
    "ownerName": "John Doe",
    "ownerContactNumber": "9876543210",
    "email": "john@example.com",
    "phoneNumber": "9876543211",
    "companyName": "ABC Logistics",
    "companyAddress": "123 Main St",
    "gstNumber": "27AAPFU0939F1ZV",
    "createdAt": "2025-07-13T10:30:45.123Z",
    "updatedAt": "2025-07-13T10:30:45.123Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password is required",
    "Email is already registered"
  ]
}
```

### 2. Shipper Login

Authenticate an existing shipper user.

**Endpoint:** `/api/shipper/login`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "john@example.com",    // Either email or mobileNumber is required
  "mobileNumber": "9876543210",   // Optional if email is provided
  "password": "securepassword"    // Required
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "companyName": "ABC Logistics",
    "email": "john@example.com",
    "mobileNumber": "9876543210"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Transporter APIs


### 1. Transporter Registration

Register a new transporter user in the system.

**Endpoint:** `/api/transporters/register`

**Method:** `POST`

**Request Body:**
```json
{
  "ownerName": "Alex Johnson",              // Required
  "ownerContactNumber": "9876543212",       // Required
  "email": "alex@transco.com",              // Required
  "phoneNumber": "9876543213",             // Required
  "password": "securepassword",             // Required
  "companyName": "TransCo Logistics",       // Required
  "companyAddress": "456 Transport Hub",    // Required
  "gstNumber": "27AAPFU0939F1ZV"            // Required
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Transporter registered successfully",
  "data": {
    "id": 1,
    "ownerName": "Alex Johnson",
    "ownerContactNumber": "9876543212",
    "email": "alex@transco.com",
    "phoneNumber": "9876543213",
    "companyName": "TransCo Logistics",
    "companyAddress": "456 Transport Hub",
    "gstNumber": "27AAPFU0939F1ZV",
    "createdAt": "2025-07-13T14:20:15.789Z",
    "updatedAt": "2025-07-13T14:20:15.789Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password is required",
    "Email is already registered"
  ]
}
```

### 2. Transporter Login

Authenticate an existing transporter user.

**Endpoint:** `/api/transporters/login`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "alex@transco.com",    // Either email or mobileNumber is required
  "mobileNumber": "9876543212",   // Optional if email is provided
  "password": "securepassword"    // Required
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "companyName": "TransCo Logistics",
    "email": "alex@transco.com",
    "mobileNumber": "9876543212"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## OTP APIs

### 1. Send OTP

Send a one-time password (OTP) to a given phone number using Twilio.

**Endpoint:** `/api/validate/send-otp`  
**Method:** `POST`

**Request Body:**
```json
{
  "mobileNumber": "1234567890"  //Should be  a 10 digit number
}
```

**Response (Success - 200):**
```json
{
  "message": "OTP sent successfully"
}
```

**Response (Error - 500):**
```json
{
  "message": "Failed to send OTP",
  "error": "Twilio error message or Redis error"
}
```

---

### 2. Verify MobileNumber via OTP

Verify if the provided OTP matches the one stored in Redis for the given phone number.

**Endpoint:** `/api/validate/verify-otp`  
**Method:** `POST`

**Request Body:**
```json
{
  "mobileNumber": "+911234567890",
  "otp": "123456"
}
```
**Response (Error-400):**
```json
{
  "message":"OTP has expired"
}
```

**Response (Success - 200):**
```json
{
  "message": "OTP verified successfully"
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid OTP"
}
```

**Response (Error - 500):**
```json
{
  "message": "Error verifying OTP",
  "error": "Redis error or internal server issue"
}
```

---
## 📧 Email Verification APIs

### 1. Check Email Verification Status

Check if the user’s email is:
- Already verified,
- Has a verification token already sent but not verified,
- Or has no token sent yet.

**Endpoint:** `/api/email/check-email-status`  
**Method:** `POST`

**Request Body:**
```json
{
  "gstNumber": "27ABCDE1234F1Z5",
  "userType": "shipper", // or "transporter"
  "email": "user@gmail.com"
}
```

**Response (Success - 200):**
```json
{
  "status": "verified" // or "token_sent_not_verified" or "not_verified_no_token"
}
```

**Response (Error - 404 or 500):**
```json
{
  "status": "user_not_found"
}
```

---

### 2. Send Verification Email Link

Sends a new email verification link. If a token already exists, it is overwritten.

**Endpoint:** `/api/email/send-email-link`  
**Method:** `POST`

**Request Body:**
```json
{
  "gstNumber": "27ABCDE1234F1Z5",
  "userType": "shipper", // or "transporter"
  "email": "user@gmail.com" 
}
```

**Response (Success - 200):**
```json
{
  "message": "Verification email sent"
}
```
**Response (Error - 400):**
```json
{
  "message":"Invalid userType"
}
```
**Response (Error - 404):**
```json
{
  "message": "User not found" 
}
```
**Response (Error - 500):**
```json
{
  "message":"Internal server error",
  "error": "error.message"
}
```
---

### 3. Verify Email via Token

Triggered when the user clicks the verification link sent to their email.
(link-  FrontendUrl/verify-email?token=${token})

**Endpoint:** `/api/email/verify-email-link`  
**Method:** `GET`

**Query Parameters:**
```
?token=eyJhbGciOiJIUzI1NiIsInR...
```

**Response (Success - 200):**
```json
{
  "message": "Email verified successfully"
}
```

**Response (Already Verified - 200):**
```json
{
  "message": "Email already verified"
}
```

**Response (Error - 400):**
```json
{
  "message": "Invalid or expired token"
}
```
**Respnse(Error - 404):**
```json
{
  "message":"User not found"
}
```
**Response(Error - 500):**
```json
{
  "message": "Internal server error", 
  "error" : "error.message"
}
```

---

