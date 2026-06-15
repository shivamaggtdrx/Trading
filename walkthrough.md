# Walkthrough — Manual Deposit System & Instrument Browser Fix

I have completed the manual deposit system and fixed the category segment browser crash. Here is a summary of the achievements and changes:

---

## 🛠️ Changes Implemented

### 1. Database Schema (`029_manual_deposits_options.sql`)
- **Table Created**: `payment_methods` containing `id`, `slot` (1, 2, 3), `is_active`, `upi_id`, `bank_name`, `account_name`, `account_number`, `ifsc_code`, `qr_code_url`, and `instructions`.
- **Pre-seeded**: Seaded 3 default payment methods for Options 1, 2, and 3.
- **Constraints Altered**: Dropped the old `deposit_requests_method_check` constraint on `deposit_requests` table to allow custom options.
- **Columns Added**: Added `payment_method_slot` (integer 1, 2, 3) to the `deposit_requests` table.
- **Security (RLS)**: Enabled RLS on `payment_methods` and allowed authenticated users to select active records.

### 2. Express Backend API
- **User Route (`backend/src/routes/deposits.js`)**:
  - `GET /api/deposits/payment-methods`: Fetches active manual payment channels.
  - `POST /api/deposits`:
    - Enforces mandatory fields: `amount` (minimum ₹500 INR), `utr_number`, and `screenshot_base64`.
    - Converts `screenshot_base64` payload into an image receipt file and writes it to `uploads/`.
    - Inserts a new pending deposit request linked to the selected Option slot.
- **Admin Route (`backend/src/routes/admin.js`)**:
  - `GET /api/admin/payment-methods`: Retrieves all configured payment options.
  - `PUT /api/admin/payment-methods/:slot`: Allows updating details, toggling active status, and uploading a base64 QR code to `uploads/` for each channel.

### 3. Trader App (User UI)
- **API and Store (`api.js`, `useWalletStore.js`, `useTradeStore.js`)**:
  - Extended `submitDeposit` to pass screenshot base64, payment option slot, and descriptive option names.
  - Added `getPaymentMethods()` endpoint wrapper.
- **Wallet UI (`Wallet.jsx`)**:
  - Replaced the simple UPI modal form with an advanced deposit option selector (Option 1, 2, 3 tabs).
  - Selected tab displays configured QR code scan image, UPI ID (with "Copy" clipboard button), bank transfer details (with holder name, account number, IFSC, and copy controls), and instructions.
  - Mandates Amount (₹500 minimum check), UTR number, and screenshot file upload (using FileReader to capture base64).
  - Displays a clean success message: *"Successful! Please wait to get your payment verified."*

### 4. Admin Panel (Admin UI)
- **API Client (`adminApi.js`)**:
  - Added `getPaymentMethods` and `updatePaymentMethod` calls.
- **Deposit approvals Page (`DepositApprovals.jsx`)**:
  - Added **Configure Channels** tab to directly manage the payment slot options.
  - Rendered 3 card modules for Option 1, 2, and 3 channels to easily edit UPI IDs, upload QR code images, modify bank transfer numbers, update user instructions, and toggle online/offline status.
  - Fixed "View Proof" action to open the static uploaded receipt screenshot in a new tab.
  - Bound "Rejection reason" notes text area and combined it with selected dropdown reason to save detailed rejection reasons when denying deposit transactions.

### 5. Bug Fix: Mobile Instrument Browser Segment Blank Page Crash
- **File Fixed**: [`InstrumentBrowser.jsx`](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/apps/trader-app/src/components/ui/InstrumentBrowser.jsx)
- **Bug**: The code had a reference to an undeclared/unpassed variable `fmtPrice` inside `InstrumentRow` props assignment (`fmtPrice={fmtPrice}`). This threw a runtime `ReferenceError` when expanding any category folder (Stocks, Indices, Forex, etc.) or when typing in search, causing the React render tree to crash and render a blank page.
- **Fix**: Removed the unused and undeclared `fmtPrice` prop. `InstrumentRow` now correctly formats prices using the statically imported `formatPrice` helper.

---

## 🧪 Verification Plan

### 1. Manual Validation Checklist
1. **Instrument Browser Expansion**: Login to Trader app → click Watchlist edit/add icon (+) → select any segment category folder (e.g. NSE India Stocks, Global Indices) → verify it expands cleanly showing instrument listings without crashing.
2. **Instrument Browser Search**: Start typing a search query in the browser (e.g. "RELIANCE") → verify matching results show up instantly.
3. **Option Selection**: Go to Funds → click Add Funds → verify you can see Option 1, 2, 3.
4. **Details Display**: Confirm QR, UPI ID, copy button, and bank details change dynamically based on the selected Option tab.
5. **Form Validations**:
   - Try submitting with an amount < 500 (shows validation error).
   - Try submitting without UTR or screenshot (Deposit button is disabled).
6. **Deposit Submission**: Upload an image, enter a UTR and amount >= 500, click Submit. Confirm success message is shown and modal closes.
7. **Admin Configuration**: Open Admin panel → go to Deposits → select "Configure Channels" tab. Edit the details of Option 1/2/3 and upload a new QR code image. Click Save. Go back to Trader app and confirm the new details are visible.
8. **Manual Approval/Rejection**: In Admin panel, click Pending Deposits tab. Locate your transaction, click View Receipt to verify the uploaded screenshot. Click Approve to credit the user's wallet, or click Reject and specify notes.

### 2. Live Services Status
- **Backend API Server**: Running on `http://localhost:4000/` (Task ID: `task-2352`)
- **Trader App**: Running on `http://localhost:3000/` (Task ID: `task-2354`)
- **Admin Panel**: Running on `http://localhost:5173/` (Task ID: `task-2356`)
