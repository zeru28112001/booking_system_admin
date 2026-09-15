# Booking System — Next.js Admin Web Portal

A modern, responsive Next.js 14+ Admin Web Portal designed with dark glassmorphism aesthetic, **shadcn/ui**, **TanStack Query (v5)**, and **Zod** schema validation.

---

## 🌟 Key Features

- **Security & Access Control**:
  - **Middleware Route Protection**: Server-side Next.js `middleware.ts` enforces `admin` role authentication across all protected pages.
  - **Server-Side API Key Proxy**: Server-side proxy ([app/api/proxy/[...path]/route.ts](file:///Users/zeru/Downloads/Booking%20System/booking_system_admin/app/api/proxy/%5B...path%5D/route.ts)) forwards secret `x-api-key` headers to the backend without exposing keys to the client browser.
  - **Brute-Force Protection**: Locks login after failed attempts with a live countdown timer.
- **Feature Management**:
  - **Dashboard**: Real-time business metrics, revenue summaries, and system activity logs.
  - **Providers Management**: Verification and rejection workflows with modal confirmations.
  - **Bookings**: Complete booking list oversight across all statuses.
  - **Categories**: Category management with a visual grid icon picker.
  - **Promo Banners**: Target category dropdowns and sort order steppers.
  - **Profile Requests**: Review provider profile change requests.
  - **Settings**: System configurations with real-time WebSocket broadcast warnings.
- **Safety Dialogs**: Reusable `ConfirmDialog` modal with loading states before executing state-changing mutations.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **State & Data Fetching**: TanStack Query (v5)
- **Validation**: Zod & `react-hook-form`
- **Styling & UI**: Tailwind CSS & Lucide React Icons
- **Components**: `shadcn/ui` primitives

---

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
# Server-side Secret Keys (NEVER sent to client browser)
API_KEY=your_admin_api_key_here
BACKEND_API_URL=http://localhost:5001/api/v1

# Public Client Configuration
NEXT_PUBLIC_API_URL=/api/proxy
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_MAX_FAILED_ATTEMPTS=5
NEXT_PUBLIC_LOCKOUT_DURATION_SECONDS=60
```

### 2. Installation & Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
app/
├── (routes)/          # Admin pages (dashboard, providers, categories, banners, etc.)
├── api/proxy/         # Server-side API key proxy route
├── login/             # Login page with brute-force rate limiter
components/            # UI components & reusable ConfirmDialog modal
context/               # AuthContext for session management
lib/                   # API client, Zod schemas, and utility functions
middleware.ts          # Server-side route protection & role guard
```

---

## 📄 License

This project is licensed under the MIT License.
