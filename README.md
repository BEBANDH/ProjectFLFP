<div align="center">
  <h1 align="center">FLFP - Forward looking finance portfolio</h1>
  <p align="center">
    <strong>A full-stack, real-time financial life forecasting and projection engine.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Java-21-orange.svg" alt="Java 21" />
    <img src="https://img.shields.io/badge/Spring_Boot-3.3-brightgreen.svg" alt="Spring Boot 3" />
    <img src="https://img.shields.io/badge/Angular-18-red.svg" alt="Angular 18" />
    <img src="https://img.shields.io/badge/Chart.js-4.x-blue.svg" alt="Chart.js" />
  </p>
</div>

---

## 📖 Overview

**FLFP** (Forward looking finance portfolio) is an industry-grade personal finance tool designed to simulate and forecast net worth over time. Unlike static budget trackers, it utilizes a backend projection engine to mathematically project compounding interest, recurring income streams, and automated deductions (SIPs) into the future.

## ✨ Core Features

- **Dynamic Wealth Projection:** A backend calculation engine that factors in daily, weekly, monthly, and annual compounding for multiple asset classes.
- **Investment Tracking:** Differentiates between Lumpsum injections and ongoing SIPs (Systematic Investment Plans) across Equity, Real Estate, and Fixed Deposits.
- **Expense & Credit Engine:** Tracks recurring living expenses vs one-off instant purchases, balancing them against recurring income streams.
- **Interactive Data Visualization:** Real-time 12-month forward curve rendering using Chart.js on the dashboard.
- **API-First Architecture:** Fully documented with Swagger/OpenAPI for easy external integration.

## 🏗️ Architecture & Tech Stack

This project follows a **Modular Monolith** architecture on the backend, ensuring domain boundaries are strictly maintained (Accounts, Expenses, Credits, Investments, Projections) while keeping deployment simple.

### Backend (Core Engine)
- **Java 21** & **Spring Boot 3**
- **Spring Data JPA** with PostgreSQL / H2
- **Lombok** for boilerplate reduction
- **Springdoc OpenAPI** for Swagger UI

### Frontend (Client Application)
- **Angular 18** (Standalone Components, Signals for reactive state)
- **RxJS** (forkJoin parallel API resolution)
- **Vanilla CSS** with a custom Premium Dark Theme / Glassmorphism
- **Chart.js** for interactive data plotting

## 🚀 Getting Started

### Prerequisites
- JDK 21+
- Node.js 18+ and npm
- Maven 3.8+

### 1. Run the Backend
Navigate to the `backend` directory and start the Spring Boot application:
```bash
cd backend
mvn spring-boot:run
```
The server will start on `http://localhost:8080`.
* **Swagger API UI:** `http://localhost:8080/swagger-ui.html`

### 2. Run the Frontend
Navigate to the `frontend` directory, install dependencies, and start the dev server:
```bash
cd frontend
npm install
npm run start
```
The application will be accessible at `http://localhost:4200`.

## 🔒 Roadmap
- [x] Phase 1: Core Domain Entities and Persistence
- [x] Phase 2: Projection Engine & Angular 18 MVP Dashboard
- [ ] Phase 3: Spring Security & JWT Authentication
- [ ] Phase 4: Containerization (Docker) & CI/CD Pipelines

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
