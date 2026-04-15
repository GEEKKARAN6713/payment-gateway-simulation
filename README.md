# 💳 PayGate_Sim — Payment Gateway Simulation System

A **Payment Gateway Simulation System** that mimics real-world online payment processing using **Java (Backend) + REST APIs + Interactive UI**.

---

## 🚀 Live Demo

🔗 https://payment-gateway-simulation.vercel.app *(if deployed)*

---

## 🧠 Project Overview

This project simulates how modern **payment gateways (like Razorpay, Stripe)** process transactions.

It allows users to:

* Enter card details
* Validate payment data
* Process transactions
* Track payment status
* View transaction history

The system replicates real fintech workflows including **success, pending, and failed transactions**.

---

## ✨ Features

* 💰 **Initiate Payment**
* 🔍 **Check Transaction Status**
* 📊 **View Transaction History**
* ✅ **Input Validation**
* 🔄 **Dynamic Transaction Results**

  * SUCCESS
  * PENDING
  * FAILED
* ⚡ **REST API Simulation**
* 🧠 **In-memory Data Storage (HashMap)**

---

## 🛠️ Tech Stack

### Backend

* Java
* REST APIs
* OOP (Object-Oriented Programming)
* Exception Handling

### Frontend (Simulation UI)

* React.js
* Vite
* Modern UI (Dark fintech theme)

---

## 🔗 API Endpoints

| Method | Endpoint      | Description            |
| ------ | ------------- | ---------------------- |
| POST   | `/pay`        | Initiate payment       |
| GET    | `/status/:id` | Get transaction status |
| GET    | `/history`    | Get all transactions   |

---

## 🔄 How It Works

1. User enters payment details
2. System validates inputs
3. Transaction is processed
4. Randomized result is generated:

   * ✅ Success (70%)
   * ⏳ Pending (18%)
   * ❌ Failed (12%)
5. Transaction stored in memory
6. User can track or view history anytime

---

## 📸 UI Preview

### 💰 Payment Screen

![Payment](./assets/pay.png)

### 🔍 Status Check

![Status](./assets/status.png)

### 📊 Transaction History

![History](./assets/history.png)

---

## 🧠 Key Concepts Implemented

* 🧩 Object-Oriented Design
* ⚠️ Exception Handling
* 🔐 Input Validation Logic
* 🔄 Transaction Lifecycle Simulation
* 🗂️ HashMap-based Data Storage
* 🌐 RESTful API Design

---

## 📦 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/GEEKKARAN6713/payment-gateway-simulation.git
cd payment-gateway-simulation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run project

```bash
npm run dev
```

---

## ⚡ Future Improvements

* 🔐 Add authentication (JWT)
* 💳 Integrate real payment gateway sandbox
* 🗄️ Use database (MongoDB/MySQL)
* 📈 Analytics dashboard
* 📱 Mobile responsive UI

---

## 🎯 Learning Outcomes

* Understanding **payment gateway architecture**
* Designing **REST APIs**
* Handling **real-world transaction flows**
* Applying **OOP principles in backend systems**
* Building **end-to-end fintech simulation**

---

## 👨‍💻 Author

**Karan Kamble**
GitHub: https://github.com/GEEKKARAN6713

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!

---
