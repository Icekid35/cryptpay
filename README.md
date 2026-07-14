# CryptPay

CryptPay is a decentralized payment request platform built on Ethereum, enabling peer-to-peer and on-chain payment workflows. 

Designed for Web3 merchants and service providers, CryptPay enables the generation of custom payment checkout links, ERC-681 standard QR codes, real-time payment tracking, and automated professional billing receipt generation.

---

## Core Features

- **Custom Payment Links**: Generate clean, standalone checkout URLs for individual products, consulting fees, or service subscriptions.
- **Scan-to-Pay QR Codes**: Generates standard ERC-681 mobile payment QR codes compatible with mobile wallets (MetaMask, Coinbase Wallet, Trust Wallet).
- **Web3 Wallet Direct Checkout**: Customer-facing payment flow supporting direct native ETH and ERC-20 token transfers using Wagmi and RainbowKit.
- **Automated Invoice Generation**: Generates clean, professional commercial invoices and receipts for customers immediately upon payment confirmation.
- **Print-to-PDF Receipts**: Built-in CSS print-media queries enable instant invoice conversion to high-quality PDFs via the browser.
- **Recurring On-Chain Subscriptions**: Solidity smart contract structure to support pull-based subscription payments.
- **Developer Sandbox Mode**: A secure mock payment sandbox to test user checkout flows locally without incurring gas or network confirmation wait times.

---

## Technical Stack

- **Framework**: Next.js (App Router)
- **Styling**: Custom CSS (Vanilla, variables-based, dark theme)
- **Web3 Interface**: Wagmi, Viem, and RainbowKit
- **Smart Contracts**: Solidity
- **Local Persistence**: JSON Controller database helper

---

## Project Structure

```text
cryptpay/
├── contracts/
│   └── CryptPay.sol          # Solidity Smart Contract
├── src/
│   ├── app/
│   │   ├── api/              # API Endpoints (Links, Payments, Invoices, Subscriptions)
│   │   ├── invoice/          # Commercial Billing Invoices
│   │   ├── pay/              # Customer Checkout Interfaces
│   │   ├── globals.css       # Design System CSS
│   │   ├── layout.js         # Root Layout
│   │   └── page.js           # Marketing Page / Merchant Command Center
│   ├── context/
│   │   └── Web3Provider.js   # Web3 Connection Context
│   └── lib/
│       └── db.js             # Local Database Interface
└── DEPLOYMENT.md             # Production Deployment Guide
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install --cache ./.npm-cache
```

### 2. Launch Local Dev Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to interact with the application.

---

## Production Deployment
Please refer to [DEPLOYMENT.md](file:///DEPLOYMENT.md) for full instructions on deploying the smart contracts, configuring web3 RPCs, setting up production databases (e.g. Supabase), and launching on Vercel.
