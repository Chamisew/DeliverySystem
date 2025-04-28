# Food Ordering & Delivery System

A cloud-native food ordering and delivery platform built with microservices architecture using Docker, Kubernetes, MongoDB, Express.js, and React.js.

## Features

- User-friendly web interface for food ordering
- Restaurant management system
- Order management and tracking
- Delivery management 
- Secure payment integration
- SMS and email notifications
- Role-based authentication (Customer, Restaurant Admin, Delivery Personnel)
- Notification system for email and SMS
- Admin panel for system management

## Tech Stack

- Frontend: React.js
- Backend: Express.js
- Database: MongoDB
- Containerization: Docker
- Orchestration: Kubernetes
- Authentication: JWT
- Payment Gateway: Stripe
- Notifications: Email and SMS services

## Prerequisites

- Docker and Docker Compose
- Kubernetes 
- Node.js 
- MongoDB 

## Project Structure

```
.
├── frontend/                 # React.js frontend application
├── services/
│   ├── auth-service/        # Authentication microservice
│   ├── restaurant-service/  # Restaurant management microservice
│   ├── order-service/       # Order management microservice
│   ├── delivery-service/    # Delivery management microservice
│   ├── payment-service/     # Payment processing microservice
│   ├── notification-service/ # Notification microservice
│   └── admin-service/       # Admin panel microservice
├── kubernetes/              # Kubernetes deployment and service files
├── docker-compose.yml       # Docker Compose configuration
└── README.md                # Project documentation
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Chamisew/DeliverySystem.git
cd food-delivery-system
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update the environment variables with your configuration
   - Ensure you configure third-party integrations like Twilio (for SMS) and Stripe (for payments).

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
   - Notification Service: http://localhost:3007
   - Admin Service: http://localhost:3006

## Running with Kubernetes

1. Install Kubernetes 
2. Apply the Kubernetes manifests:
```bash
kubectl apply -f kubernetes/
```
3. Verify the pods and services are running:
```bash
kubectl get pods
kubectl get services
```
4. Access the application using the exposed service URLs.

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

