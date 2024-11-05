# Medicine Authentication System

This project is designed to combat the issue of counterfeit medicines by providing a system that generates QR codes containing digital signatures, which can be verified to ensure the authenticity of medicine products. The project involves both manufacturers and consumers, with medicine data encrypted, signed, and stored securely. Consumers can scan QR codes to verify the authenticity of the medicine they purchase.

---

## Table of Contents

1. [Features](#features)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [How It Works](#how-it-works)
6. [Project Structure](#project-structure)
7. [Endpoints](#endpoints)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

- **Manufacturer UI**: Allows manufacturers to securely generate medicine data and obtain QR codes with digital signatures.
- **Symmetric Encryption**: Private keys are encrypted with a master key for added security.
- **Public Key Infrastructure**: Each manufacturer has its own public/private key pair, ensuring unique authentication for each product.
- **Patient UI**: Allows consumers to scan QR codes and verify medicine authenticity.
- **Digital Signature Verification**: Ensures that the scanned data has not been tampered with by verifying the signature against the manufacturer’s public key.
- **Database Querying**: Retrieves medicine data and signature details for validation.

---

## System Overview

The system is composed of several key parts:

1. **Manufacturer UI**: Generates medicine data, encrypts it, and generates a unique `mf_id` and `prod_id`. A QR code is generated containing these values and a digital signature.
2. **Server 1 A**: Handles the generation of private/public keys and encrypts the private key using symmetric encryption. Data and digital signatures are stored in the database.
3. **Server 1 B**: Verifies the authenticity of the medicine by querying the database and verifying the digital signature using the public key.
4. **Patient UI**: Allows users to scan the QR code and sends the data to `Server 2` for validation.
5. **Medicine Database**: Stores product data, including `prod_id`, medicine information, and the digital signature.
6. **QR Code**: Contains the `mf_id`, `prod_id`, and the digital signature.

---

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Cryptography**: RSA for public/private keys, AES-256-CBC for symmetric encryption of private keys, ECDSA for digital signatures
- **Frontend**: React (for both Manufacturer and Patient UIs)
- **QR Code Generation**: `qrcode` npm package
- **Compression**: `zlib` npm package for compressing the QR code data
- **Deployment**: Docker (optional), AWS

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/medicine-authentication-system.git
   cd medicine-authentication-system
2. **Install dependencies:**
   ```bash
   npm install
3. **Set up environment variables:**
    Create a .env file in the root directory and define your environment variables:   
   ```bash
   MASTER_KEY=<your_master_key>
   DB_URI=<your_mongodb_uri>
4. **Run the application:**
    Start both the manufacturer and patient UI servers.   
   ```bash
   npm run start:manufacturer
   npm run start:patient
5. **Run the application:**
    You can now start the servers.   


