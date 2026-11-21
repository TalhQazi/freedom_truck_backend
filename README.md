# Freedom Car & Truck – Backend REST API

Production-ready backend API service for **Freedom Car & Truck** Automotive Workshop Management System.

## Architecture

- **Runtime**: Node.js & Express.js with TypeScript
- **Database**: MongoDB ONLY with Mongoose ODM
- **Authentication**: JWT with Role-Based Access Control (RBAC) across 6 roles
- **Documentation**: PDF generation via PDFKit
- **Security**: bcrypt password hashing, centralized error handling, audit logging

## Features & SOP Implementation

- **SW-001 to SW-015**: Service Writer operations (customer profiles, vehicle registration, itemized estimates, markup matrix tiers, tire pricing, repair orders, digital customer authorizations, deposits, invoicing, payments, dual receipts, daily cash-up drawer).
- **TECH-001 to TECH-013**: Automotive technician workflows (worksheets, 2-person lighting inspections, 5-point vehicle lift safety, multi-point Green/Yellow/Red inspections, fluid specs & leak checks, Tech #1 initial signoff, independent QC Tech #2 signoff, exit roll-out checks).
- **OFF-001 to OFF-012**: Office assistant & information security (computer modification requests, daily security walkthrough checklists, incident reporting).

## Setup & Running

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Start production server
npm start
```
