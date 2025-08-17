# Ultron Backend API

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a MySQL database named `logix_junction`
4. Update the `.env` file with your database credentials
5. Start the development server:
   ```
   npm run dev
   ```
## Setup With docker
1. Start the development server:
   ```
   docker compose up --build
   ```
## API Documentation

### Register a Transporter

**Endpoint:** `POST /api/transporters/register`

**Request Body:**

```json
{
  "companyName": "Example Transport Co.",
  "companyAddress": "123 Main St, City, State, Country",
  "email": "contact@exampletransport.com",
  "password": "securePassword123",
  "customerServiceNumber": "9876543210",
  "gstNumber": "22AAAAA0000A1Z5",
  "cinNumber": "U12345AB6789CDE012345",
  "ownerName": "John Doe",
  "ownerContactNumber": "9876543211",
  "fleetCount": 10,
  "serviceArea": "cities",
  "pincode": "123456",
  "districtCityRates": {
    "city1": 10.5,
    "city2": 15.2
  },
  "serviceType": "both",
  "etdDetails": {
    "city1": "24 hours",
    "city2": "48 hours"
  }
}
```

**Required fields:**
- companyName
- email
- password
- customerServiceNumber

**Response:**

```json
{
  "success": true,
  "message": "Transporter registered successfully",
  "data": {
    "id": 1,
    "companyName": "Example Transport Co.",
    "email": "contact@exampletransport.com",
    "customerServiceNumber": "9876543210",
    "gstNumber": "22AAAAA0000A1Z5",
    "companyAddress": "123 Main St, City, State, Country",
    "cinNumber": "U12345AB6789CDE012345",
    "ownerName": "John Doe",
    "ownerContactNumber": "9876543211",
    "fleetCount": 10,
    "serviceArea": "cities",
    "pincode": "123456",
    "districtCityRates": "{\"city1\":10.5,\"city2\":15.2}",
    "serviceType": "both",
    "etdDetails": "{\"city1\":\"24 hours\",\"city2\":\"48 hours\"}",
    "createdAt": "2023-04-20T12:34:56.789Z",
    "updatedAt": "2023-04-20T12:34:56.789Z"
  }
}
```

### Login as Transporter

**Endpoint:** `POST /api/transporters/login`

**Request Body:**

```json
{
  "email": "contact@exampletransport.com",
  "password": "securePassword123"
}
```

**Required fields:**
- email
- password

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "companyName": "Example Transport Co.",
    "email": "contact@exampletransport.com"
  }
}
```

### Using Authentication

For protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get Protected Home Page

**Endpoint:** `GET /api/transporters/home`

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome to the protected home route",
  "data": {
    "transporter": {
      "id": 1,
      "companyName": "Example Transport Co.",
      "email": "contact@exampletransport.com"
    }
  }
}
```

**Error Response (Invalid or Missing Token):**
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

or

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```
