# Subscription Integration Mapping: UI vs API

This document maps the Sublymus dashboard subscription page features to the backend API provided by `delivery-api`.

## 1. Data Correspondence

### Current Plan (Hero Section)
| Page Element (UI) | API Source / Property | Notes |
| :--- | :--- | :--- |
| **Plan Name** (`Sublymus Pro`) | `ResolvedSubscriptionRates.activityType` | Needs mapping (e.g., `MISSION` -> "Sublymus Pro") or from metadata. |
| **Description** | Mocked | Should probably be stored in `SubscriptionPlan.metadata`. |
| **Features List** | Mocked | Could be stored in `SubscriptionPlan.metadata`. |
| **Fixed Cost** (`15 000 F`) | `ResolvedSubscriptionRates.baseAmount` | |
| **Status** (`En règle`) | Calculated from invoices | "En règle" if no `OVERDUE` invoices. |
| **Renewal Date** | Mocked (`01 Avril 2024`) | Usually the start of next month. |

### Current Month Consumption
| Page Element (UI) | API Source / Property | Notes |
| :--- | :--- | :--- |
| **Base Abonnement** | `ResolvedSubscriptionRates.baseAmount` | |
| **Commissions (3.5%)** | `ResolvedSubscriptionRates.commandeCommissionPercent` | |
| **Commissions Amount** | `commandeUsageAmount * commission %` | **[Missing Endpoint]**: Need real-time usage for current month. |
| **Tickets & Services** | `ResolvedSubscriptionRates.ticketFeePercent` | |
| **Tickets Amount** | `ticketUsageAmount * fee %` | **[Missing Endpoint]**: Need real-time usage for current month. |
| **Total Provisoire** | Calculated | Sum of above + taxes. |

### Invoice History
| Page Element (UI) | API Source / Property | Notes |
| :--- | :--- | :--- |
| **ID** (`INV-2024-003`) | `SubscriptionInvoice.id` | |
| **Period** (`Mars 2024`) | `SubscriptionInvoice.periodStart` | Format as month/year. |
| **Detail** (Base + Vol) | `baseAmount` + `totalUsage` | Summarized from API fields. |
| **Status** (`PAID`, `ISSUED`) | `SubscriptionInvoice.status` | |
| **Total** | `SubscriptionInvoice.totalAmountWithTax` | |

## 2. Interactions Mapping
| UI Interaction | API Endpoint | Notes |
| :--- | :--- | :--- |
| **Page Load** | `GET /v1/company/subscription/effective` | Get rates. |
| **Page Load** | `GET /v1/company/subscription/invoices` | Get history. |
| **Page Load** | `GET /v1/company/subscription/usage` | **[To Be Created]** |
| **Changer de plan** | None | Not implemented. Usually requires admin contact. |
| **Download Invoice** | `GET /v1/fs/:filename` | Needs logic to generate/link PDF if available. |

## 3. Coverage Analysis

### 1. ALREADY IN PAGE & PROVIDED BY SERVER
- List of past invoices.
- Subscription base rates (Fixed fee, %, taxes).
- Total amounts for past invoices.

### 2. PROVIDED BY SERVER BUT NOT DISPLAYED
- `commadeUsageAmount` (GMV): The server provides the volume in FCFA used for calculation, but the UI only shows the calculated commission. Showing the GMV ("Basé sur X FCFA de CA") is good for transparency.
- `metadata`: Any extra plan details.
- `currency`: UI defaults to F, server provides currency code.

### 3. IN PAGE BUT NO RELATION TO SERVER (MOCKED)
- **Marketing Plan Details**: "Optimisé pour les flottes...", "Multi-Utilisateurs", "Support 24/7". These are currently hardcoded strings.
- **Consumption (Real-time)**: The entire "Consommation du Mois" calculation is currently static in the UI.
- **Invoice Download**: The button is present but doesn't point to a real file yet.

## Recommendation
1.  **Backend**: Add `GET /v1/company/subscription/usage` to `SubscriptionController` to return current month's usage estimates using `SubscriptionService.computeUsageForPeriod`.
2.  **Frontend**: Create a `SubscriptionService` in the dashboard to fetch these 3 endpoints.
3.  **Frontend**: Update the page to use `useEffect` and `useState` for these data points.
