# Agent Rules and Regulations - Booking System Admin Portal

This repository (`booking_system_admin`) contains the Next.js 14+ web admin portal for the Booking System platform. All AI agents and developers working on this project MUST strictly follow these rules and regulations.

---

## 1. Core Platform Architecture & Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling & UI**: Tailwind CSS + **shadcn/ui** components exclusively
- **Icons**: `lucide-react`
- **Real-time**: `socket.io-client` connecting to backend at `http://localhost:5001`
- **Notifications**: `sonner` toast notifications

---

## 2. Security & API Communication

1. **Server-Side API Key Proxy & Environment Secrets**:
   - Secret keys (`API_KEY`, `BACKEND_API_URL`) MUST be defined in `.env.local` or runtime environment.
   - **NO HARDCODED DEFAULT STRINGS OR FALLBACK SECRETS** are permitted in `.ts`, `.tsx`, or `.js` source files.
   - If an environment variable is missing, functions like `getApiKey()` and `getBackendUrl()` throw strict configuration errors.
   - The Next.js Route Handler (`app/api/proxy/[...path]/route.ts`) securely attaches `x-api-key` on the server side.
   - The `API_KEY` is **NEVER** exposed to client JavaScript or browser network logs.
2. **JWT Authentication**:
   - Admin routes require `Authorization: Bearer <admin_jwt_token>`.
   - Only users with `role === 'admin'` are allowed access to the portal. Non-admins must be rejected at login.
3. **Central API Client**:
   - Use `lib/api.ts` (`apiRequest`) for all HTTP requests to route through `/api/proxy` for uniform header injection and automatic 401 handling.

---

## 3. Strict Functional Rules & Constraints

> [!CAUTION]
> **NO `commissionPercentage`**:
> The `commissionPercentage` setting was deliberately removed from the platform architecture.
> - **DO NOT** re-introduce `commissionPercentage` in system settings, forms, interfaces, or state management.

> [!IMPORTANT]
> **Visual Icon Picker for Categories**:
> - Category icon selection MUST be a visual grid picker (graphical icons), NOT a raw text input field.
> - Maps visual Lucide icons to backend icon identifiers (`content_cut`, `spa`, `cleaning`, `plumbing`, `electrical`, `tutoring`, `car`, `fitness`, `pest`, `brush`, `medical_services`, `home_repair_service`).

---

## 4. Required Feature Set (Flutter Parity)

1. **Authentication**: Admin login (`POST /auth/login`), role verification, session persistence, secure logout.
2. **Dashboard**: Metrics cards (Customers, Providers, Pending Verifications, Pending Profile Requests, Bookings, Revenue).
3. **Provider Management**: Search, filter by status (`pending`, `verified`, `rejected`), approve provider, reject provider (with reason modal).
4. **Global Bookings Explorer**: Status filter tabs (`all`, `pending`, `accepted`, `completed`, `cancelled`), booking details dialog.
5. **Category Management**: List, Create, Edit, Delete with visual icon picker.
6. **Banner / Promo Management**: List, Create, Edit, Delete with image URL preview, target category selector, and active status toggle switch.
7. **Profile Change Requests**: View pending provider profile modification requests, compare old vs new values, approve or reject (with reason modal).
8. **System Settings**: Support Phone, Support Email, and Maintenance Mode switch. Real-time broadcast via Socket.IO.

---

## 5. UI/UX & Design Standards

- Use a sleek, modern, high-contrast dark theme layout with a fixed sidebar and top header bar.
- Always provide clear loading states (`Skeleton`, spinners) and user feedback via toast notifications.
- Modal dialogs must be used for destructive or multi-input operations (e.g. rejection reasons, item deletion confirmations).

---

## 6. Code Verification

- Before declaring any task finished, execute `npm run build` to verify zero TypeScript errors and successful Next.js static asset compilation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
