# Next.js Fintech Platform Frontend

<p align="center">
  <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png" width="80" alt="Next.js Logo" />
</p>

<p align="center">
  🚀 <strong style="font-size: 1.2em; color: #0070f3;">Live Demo:</strong> <a href="https://nextjs-fintech-microservices.vercel.app" style="font-size: 1.2em; font-weight: bold;">nextjs-fintech-microservices.vercel.app</a> 🌟
</p>

A **modern frontend application** built with **Next.js** and **Tailwind CSS**. This project serves as the graphical interface for the [NestJS Fintech Microservices](https://github.com/gallardojpsistemas/nestjs-fintech-microservices) platform, showcasing how a client application interacts with a complex, distributed backend.

> ☁️ **Live Deployment Architecture:** The backend microservices are deployed and currently running on **Render**, while the database (DB) is hosted on **MongoDB Atlas**, and message brokering is handled by **RabbitMQ** hosted on **CloudAMQP**.
> 
> ⚠️ **Important Note:** Render spins down free web services that go 15 minutes without receiving inbound traffic. **If you are the first visitor in a while, please expect a delay of around 40-50 seconds for the initial requests** while the microservices wake up. Subsequent requests will be fast and responsive.

---

## Overview

This repository contains the user interface designed to visually demonstrate the capabilities of the NestJS backend architecture. It provides an intuitive dashboard and dedicated flows for all the fintech operations supported by the microservices, including authentication, wallet management, and diverse payment methods.

---

## Connected Services

This frontend communicates directly with the four autonomous backends of the NestJS ecosystem:

- 🔐 **Auth Service**: Handles user login and JWT token management for protected routes.
- 💰 **Wallet Service**: Displays balances and executes deposits, withdrawals, and peer-to-peer transfers.
- 💳 **Payment Service**: Provides UI flows for PIX, Boletos, and Credit Card transactions (including captures and chargebacks).
- 🧾 **Ledger Service**: Renders the immutable transaction history for audit trails.
- 🐇 **Event Broker**: Asynchronous communication between these services is powered by **RabbitMQ**, hosted on **CloudAMQP**.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Authentication**: JWT Decode

---

## Features & Screens

### 1. Authentication (`/login`)
- Login portal that authenticates users and stores the JWT for subsequent API calls.
- Role-based routing capabilities based on token payload.

### 2. Dashboard (`/`)
- Consolidated view of the user's current wallet balance.
- Quick action links to essential financial operations.
- Real-time display of recent ledger transactions.

### 3. P2P Transfers (`/transfer`)
- Form to transfer funds instantly to other registered users within the platform.

### 4. Payments & Billing
- **Deposit (`/deposit`)**: Direct additions to the wallet balance.
- **Boletos (`/boletos`)**: Interface to generate bank slips, complete with barcode generation and copying functionality for payment simulation.
- **Credit Cards (`/cards`)**: UI to simulate real-world card operations like capture, refund, and chargeback requests.
- **PIX / Webhook Simulator (`/webhook`)**: A dedicated interface to trigger webhook events, simulating asynchronous payment confirmations from external banking providers.

### 5. Transaction History (`/transactions`)
- A detailed ledger view showing all financial movements (deposits, transfers, chargebacks) sequentially.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- The [NestJS Fintech Microservices](https://github.com/gallardojpsistemas/nestjs-fintech-microservices) backend running locally.

### 1. Installation

```bash
git clone <this-repo-url>
cd nextjs-fintech-microservices
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory linking to your local or deployed microservices APIs:

```env
# Example environment configuration
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_WALLET_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_LEDGER_SERVICE_URL=http://localhost:3003
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:3004
```
*(Ensure to map these to the exact ports your NestJS services are running on).*

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Design Philosophy

This frontend was built not just to be functional, but to feel like a **premium fintech product**:
- **Clean UI**: Minimalist design with high contrast for financial data readability.
- **Micro-interactions**: Smooth transitions and feedback states powered by Framer Motion.
- **Responsive**: Fully adaptable to mobile, tablet, and desktop views.

---

## Author

**Juan Gallardo**

- GitHub: [@gallardojpsistemas](https://github.com/gallardojpsistemas)

Portfolio project — crafted to demonstrate full-stack capabilities, particularly focusing on visualizing complex backend microservice architectures.

---

## License

UNLICENSED (Portfolio / Educational use)
