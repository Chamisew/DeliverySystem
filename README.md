# Food Ordering & Delivery System

A cloud-native food ordering and delivery platform built with microservices architecture using Docker, MongoDB, Express.js, and React.js.

## Features

- User-friendly web interface for food ordering
- Restaurant management system
- Order management and tracking
- Delivery management with real-time tracking
- Secure payment integration
- SMS and email notifications
- Role-based authentication (Customer, Restaurant Admin, Delivery Personnel)

## Tech Stack

- Frontend: React.js
- Backend: Express.js
- Database: MongoDB
- Containerization: Docker
- Authentication: JWT
- Payment Gateway: PayHere
- Notifications: Email and SMS services

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- MongoDB (for local development)

## Project Structure

```
.
├── frontend/                 # React.js frontend application
├── services/
│   ├── auth-service/        # Authentication microservice
│   ├── restaurant-service/  # Restaurant management microservice
│   ├── order-service/       # Order management microservice
│   ├── delivery-service/    # Delivery management microservice
│   └── payment-service/     # Payment processing microservice
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # Project documentation
```

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd food-delivery-system
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update the environment variables with your configuration

3. Build and run the application using Docker Compose:
```bash
docker-compose up --build
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Auth Service: http://localhost:3001
   - Restaurant Service: http://localhost:3002
   - Order Service: http://localhost:3003
   - Delivery Service: http://localhost:3004
   - Payment Service: http://localhost:3005

## Development

To run services locally for development:

1. Install dependencies:
```bash
cd frontend && npm install
cd ../services/auth-service && npm install
# Repeat for other services
```

2. Start MongoDB:
```bash
docker-compose up mongodb
```

3. Start individual services:
```bash
# Frontend
cd frontend && npm start

# Auth Service
cd services/auth-service && npm run dev

# Repeat for other services
```

## API Documentation

Each service exposes its own API endpoints. Detailed API documentation can be found in the respective service directories.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 