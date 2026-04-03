# Finora Personal Finance Tracker

Finora is a full-stack personal finance management application that helps users track income and expenses, analyze spending behavior, scan receipts with AI, and receive monthly financial reports by email.

## Overview

This project combines a React frontend with an Express and MongoDB backend. It includes transaction management, analytics dashboards, recurring transactions, AI-powered receipt scanning, AI-generated report insights, and scheduled report emails.

## Key Features

- Secure user registration and login
- Dashboard with balance, income, expenses, savings rate, and charts
- Create, edit, duplicate, delete, and search transactions
- Bulk CSV transaction import
- Recurring transaction scheduling
- AI receipt scanning with Gemini
- AI-generated report insights with Gemini
- Monthly report scheduling and email delivery
- Report history with in-app AI preview and resend email action
- Built-in currency converter for quick exchange estimation
- Account and appearance settings

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Redux Toolkit and RTK Query
- Tailwind CSS
- Radix UI based components

### Backend

- Node.js
- Express
- TypeScript
- MongoDB and Mongoose
- Passport JWT authentication
- Google Gemini API
- Cloudinary
- Resend
- node-cron

## Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   ├── app/
│   │   └── layouts/
│   └── public/
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── services/
    │   ├── models/
    │   ├── crons/
    │   ├── mailers/
    │   ├── config/
    │   └── utils/
    └── package.json
```

## Main Functional Areas

### 1. Authentication

Users can register and sign in. The backend returns a JWT access token, and the frontend stores it in persisted Redux state and attaches it to protected API requests.

### 2. Transactions

Users can:

- add new transactions
- edit existing ones
- duplicate transactions
- delete one or many transactions
- import transactions from CSV
- create recurring transactions

### 3. Dashboard Analytics

The dashboard summarizes:

- available balance
- total income
- total expenses
- savings rate
- expense ratio
- recent transactions
- category and trend charts

### 4. AI Receipt Scanning

Receipt images are uploaded and processed by Gemini to extract fields such as:

- title
- amount
- date
- category
- payment method
- description

Supported upload types are currently `JPG` and `PNG`.

### 5. Reports and AI Insights

The backend can generate financial reports for a date range and ask Gemini for short financial insights. The Reports page supports:

- viewing stored report history
- previewing AI insights in the UI with `View AI`
- resending a report email with `Resend`

### 6. Monthly Email Reports

The backend includes a cron job that generates monthly reports for enabled users and emails them using Resend.

### 7. Currency Conversion

The application includes a lightweight currency converter in the Settings area. This feature allows users to enter an amount, choose a source currency, choose a target currency, and view the converted result instantly.

The current implementation uses predefined static exchange rates for demonstration and coursework purposes rather than a live exchange-rate API.

## Environment Variables

Create `.env` files in both `frontend/` and `backend/`.

### Backend `.env`

```env
NODE_ENV=development
PORT=8001
BASE_PATH=/api
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_MAILER_SENDER=verified_sender@example.com

FRONTEND_ORIGIN=http://localhost:5173
```

Notes:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY` can be used.
- Gemini usage requires a valid key, a billing-enabled project, and a supported model.
- `RESEND_MAILER_SENDER` must be verified in Resend.
- Sensitive external service credentials are intentionally not included in this repository.

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8001/api
VITE_REDUX_PERSIST_SECRET_KEY=redux-persist
```

## Installation

### Install frontend dependencies

```bash
cd frontend
npm install
```

### Install backend dependencies

```bash
cd backend
npm install
```

## Running the Project

### Start the backend

```bash
cd backend
npm run dev
```

### Start the frontend

```bash
cd frontend
npm run dev
```

Default local endpoints:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8001/api`

## Important Note for Cloned Repositories

If another user, tutor, or marker clones this repository, the full application will not have working AI and email features by default unless they provide their own valid environment variables.

This is intentional for security reasons. Private credentials are not committed to the repository, including:

- MongoDB connection string
- Gemini API credentials
- Cloudinary credentials
- Resend credentials

Without these values:

- the project structure and most frontend code can still be reviewed
- basic local development can still be inspected
- AI receipt scanning will not work
- AI report insight generation will not work
- report email sending will not work

To test the full functionality locally, the user must create their own `backend/.env` and `frontend/.env` files and provide valid service credentials.

## Important Backend Flows

### Receipt scanning

- Frontend uploads a receipt image
- Backend uploads the image to Cloudinary
- Gemini extracts transaction data
- The extracted data is returned to the transaction form

### Report generation

- Backend aggregates transactions for a date range
- Summary values are calculated
- Gemini generates short human-friendly financial insights
- The result is returned to the UI or used in email reports

### Report resend

- User clicks `Resend` in the Reports table
- Backend regenerates the report for that row's period
- Backend sends the email through Resend
- Report history entry is updated

## Scheduled Jobs

Two cron jobs are configured in development:

- Recurring transactions: `5 0 * * *`
- Monthly reports: `30 2 1 * *`

Monthly report behavior:

- runs on the 1st day of each month
- generates a report for the previous month
- sends the report by email to users with reporting enabled

Important:

- the backend process must be running when the cron executes
- the user must have report settings enabled
- the mailer and Gemini config must be valid

## How To Test

### Test transaction AI from the UI

1. Start frontend and backend.
2. Open the transaction form.
3. Upload a `JPG` or `PNG` receipt.
4. Confirm the extracted transaction fields appear in the form.

This feature requires:

- valid Gemini API credentials
- valid Cloudinary credentials
- a correctly configured backend `.env`

### Test report AI from the UI

1. Open `Reports`.
2. Click `View AI` on a report row.
3. Confirm the modal shows:
   - summary values
   - Gemini-generated insights
   - top categories

This feature requires:

- valid Gemini API credentials
- a supported Gemini model
- a billing-enabled Gemini project if required by quota/model access

### Test report email from the UI

1. Open `Reports`.
2. Click `Resend`.
3. Confirm the success toast appears.
4. Check the destination inbox.

This feature requires:

- valid Resend credentials
- a verified sender email or domain
- valid backend environment configuration

### Test currency conversion from the UI

1. Open `Settings`.
2. Open `Billing`.
3. Enter an amount.
4. Select the source and target currencies.
5. Confirm the converted value updates correctly.

### Test report API manually

Protected endpoint:

```text
GET /api/report/generate?from=YYYY-MM-DD&to=YYYY-MM-DD
```

This returns:

- period
- summary
- insights

## Build

### Frontend build

```bash
cd frontend
npm run build
```

### Backend build

```bash
cd backend
npm run build
```

## Known Notes

- Older Gemini models may not be available for new projects.
- Gemini billing must be enabled for paid-tier access and non-zero usable quota.
- Resend requires a verified sender or domain for reliable delivery.
- The report history page shows saved report records, while AI preview regenerates the report using the current data for that stored period.
- The currency converter currently uses fixed built-in exchange rates rather than live market data.
- Cron jobs are initialized in development mode in the current backend startup flow.

## Suggested Improvements

- Add a manual date-range report generator in the UI
- Add explicit email delivery status tracking
- Add automated tests for report and AI flows
- Add download/export support for reports
- Replace fixed exchange rates with a live exchange-rate API
- Reduce frontend bundle size with code splitting

## License

This project is for educational and personal development use unless you choose to add a specific license.
