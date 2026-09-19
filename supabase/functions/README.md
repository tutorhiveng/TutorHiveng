# TutorHiveNG Supabase Edge Functions & Payments Architecture

This directory contains the production-ready Supabase Edge Functions powering TutorHiveNG's multi-channel payment engine, order lifecycle, subscriptions, and access activation.

## Edge Functions Overview

| Function Name | Route | Description |
|---|---|---|
| `create-payment` | `/functions/v1/create-payment` | Unified payment initialization for OPay, Bank Transfer, and Card payments. |
| `opay-webhook` | `/functions/v1/opay-webhook` | Official OPay webhook listener with HMAC-SHA256 signature verification & auto-activation. |
| `verify-bank-transfer` | `/functions/v1/verify-bank-transfer` | Customer slip submission & admin approval/rejection workflow. |
| `card-checkout` | `/functions/v1/card-checkout` | PCI-DSS compliant tokenized card authorization with 3D-Secure OTP verification. |
| `subscription-manager` | `/functions/v1/subscription-manager` | Monthly recurring subscription lifecycle, auto-renew, and expiration tracking. |
| `tutor-bee-ai` | `/functions/v1/tutor-bee-ai` | Tutor Bee AI learning assistant, STEM solver, quiz generator, and APA stats interpreter. |
| `tutorhive-stats` | `/functions/v1/tutorhive-stats` | SPSS-style statistical tests (t-tests, ANOVA, Chi-Square, Cronbach's Alpha, Regression). |
| `ai-video-generator` | `/functions/v1/ai-video-generator` | Educational micro-lesson video projects, auto-fill, storyboard script & WebVTT captions. |
| `autofill-service` | `/functions/v1/autofill-service` | Intelligent auto-fill retrieval for students, tutors, courses, and library resources. |
| `program-tracker` | `/functions/v1/program-tracker` | Mastery-based lesson & module unlocks, progression tracking, quiz evaluation & certificate generation. |

## OPay Integration Architecture & Pending State

The OPay integration is built to support the official **OPay Cashier v3 API**.

### Zero-Code-Change Transition to Live
Because you do not yet have live credentials from the OPay merchant portal (system busy), the system is designed to operate in a **Configuration-Pending State**:
- If `OPAY_SECRET_KEY` or `OPAY_MERCHANT_ID` are not present or empty, the system detects this and gracefully returns a configuration-pending status without errors or broken payments.
- As soon as your live credentials are generated, add them to your Supabase project secrets:
  ```bash
  supabase secrets set OPAY_MERCHANT_ID=your_merchant_id
  supabase secrets set OPAY_PUBLIC_KEY=your_public_key
  supabase secrets set OPAY_SECRET_KEY=your_secret_key
  supabase secrets set OPAY_WEBHOOK_SECRET=your_webhook_secret
  ```
- **NO database rebuild or code refactoring will be required**. The moment those variables are saved, the system immediately switches to live OPay checkout and cashier flows.

## Stored Procedure `verify_and_activate_payment`

Every verified payment executes `public.verify_and_activate_payment(payment_id, verified_by, notes)` in Postgres:
1. Locks the payment and sets status to `verified`.
2. Marks the associated `orders` record as `completed`.
3. Unlocks the student access based on `item_type`:
   - `subscription`: creates record in `subscriptions` table and appends package to `profiles.purchased_packages`.
   - `course`: inserts enrollment in `course_enrollments` and updates `profiles.enrolled_courses`.
   - `book`: appends to `profiles.purchased_books`.
   - `project`: appends to `profiles.purchased_projects`.
4. Records credit entry in `transactions` audit ledger.
5. Generates electronic receipt in `receipts` table with unique verification code.
6. Emits in-app student alert in `notifications`.
7. Logs event in `audit_logs`.
