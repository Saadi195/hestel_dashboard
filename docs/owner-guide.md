# Hostel Management System — Owner User Guide

Welcome to your Hostel Management System! This non-technical user guide explains how to manage daily operations in your hostel using the dashboard.

---

## 1. Logging In & Accessing the Dashboard

1. Open your browser and navigate to the application URL (e.g. `https://your-hostel-domain.com`).
2. Enter your registered **Email** and **Password** on the sign-in page.
3. Click **Sign In**. You will be directed to the main **Dashboard**.
4. The dashboard provides an overview of:
   - Occupancy rates (Total vs Occupied Beds)
   - Active Residents
   - Outstanding Rent & Payments (in PKR)
   - Active Checkout Notices

---

## 2. Managing Residents

### Registering a New Resident
1. Click **Residents** in the sidebar navigation.
2. Click **+ Register Resident**.
3. Select your **Hostel Branch** (e.g., *Hostel Alpha — Main Campus*).
4. Fill in the resident details:
   - Full Name *
   - Phone Number *
   - Guardian Name & CNIC Number
   - Emergency Contact Details & Home Address
   - Initial Status (*RESERVED* or *ACTIVE*)
5. Click **Register Resident**.

---

## 3. Managing Rooms & Beds

### Adding Rooms
1. Click **Rooms** in the sidebar.
2. Click **+ Add Room**.
3. Select the **Hostel Branch**, Room Number, Floor Number, Room Type (Single, Double, Shared, Suite), Capacity, and Monthly Rent (PKR).
4. Click **Create Room**.

### Managing Beds
1. Click **Beds** in the sidebar.
2. View bed allocations organized by room.
3. Filter beds by operational status (*Available*, *Occupied*, *Under Maintenance*).

---

## 4. Check-In & Bed Assignment

1. Click **Check In** in the sidebar.
2. Select an active resident without an assigned bed.
3. Select an available room and bed.
4. Set the **Check-In Date**.
5. Confirm the assignment. The resident's status automatically updates to **ACTIVE**, and the bed updates to **OCCUPIED**.

---

## 5. Rent & Financial Management

### Generating Rent Charges
1. Click **Payments** in the sidebar.
2. Click **+ Generate Charge**.
3. Select the Resident, Billing Period (YYYY-MM), Monthly Rent Amount (PKR), and Due Date.
4. Click **Generate Charge**.

### Recording Rent Payments
1. Locate the pending charge on the Payments page.
2. Click **Record Payment**.
3. Enter the payment amount, payment method (Cash, Bank Transfer, Online), and reference transaction ID.
4. Click **Submit Payment**.

---

## 6. Security Deposits

1. Click **Deposits** in the sidebar.
2. Set up the required deposit amount for a resident (e.g. PKR 20,000).
3. Record lump-sum or installment payments as the resident submits funds.
4. Track full vs partial deposit balances.

---

## 7. Fines & Penalties

1. Click **Fines** in the sidebar.
2. Click **+ Issue Fine**.
3. Select the resident, specify the fine amount (PKR), and provide a reason (e.g. *Late curfew violation*).
4. Record fine payments or authorize official fine waivers when appropriate.

---

## 8. 15-Day Checkout Notices & Settlement

1. Click **Notices** in the sidebar.
2. When a resident gives notice to leave, click **+ Submit Notice**.
3. The system automatically calculates the 15-day notice period and expected checkout date.
4. On the checkout date, proceed to **Check Out** to generate the final settlement ledger.
5. The system calculates refund amounts (Security Deposit minus outstanding rent and fines).
6. Confirm checkout to release the bed back to **AVAILABLE** status.

---

## 9. Signing Out of the System

1. At the bottom of the left sidebar, click the **Sign Out** button (highlighted in red).
2. A confirmation popup snackbar will appear: `"Are you sure you want to sign out?"`
3. Select **Yes, Sign Out** to securely log out and return to the login page.
