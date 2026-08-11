# Dashboard API & Data Sources

This document lists every dashboard feature, whether it uses **placeholder data** or is **connected to the backend API**, and the endpoint + data structures for connected features.

## Architecture

All backend requests from the browser go through a Next.js proxy to avoid CORS:

```
Browser  →  /api/{path}  →  {NEXT_PUBLIC_API_BASE_URL}/{path}
```

- **Client helpers:** `lib/api/client.ts` (`apiGet`, `apiPost`, `apiPatch`)
- **Proxy route:** `app/api/[...path]/route.ts`
- **Env var:** `NEXT_PUBLIC_API_BASE_URL` (required)

---

## Summary

| Section | Route | Feature | Data source |
|---|---|---|---|
| Finance | `/` | KPI cards (MRR, ARR, per client, per unit) | Placeholder |
| Finance | `/` | MRR & ARR trend chart | **API** |
| Finance | `/` | ARR currency mix chart | **API** |
| Finance | `/` | Net Revenue Retention chart | Placeholder (reserved slot) |
| Finance | `/` | Client matrix heatmap | Placeholder |
| Finance | `/unit-economics` | Revenue & receivables chart | Placeholder |
| Finance | `/accounts` | Bank account cards | **API** |
| Finance | `/accounts` | Liquid assets summary | **API** |
| Finance | `/accounts` | Internal transactions table | Placeholder |
| Finance | `/accounts` | External transactions table | Placeholder |
| Customers | `/customers` | Indonesia site map | Placeholder |
| Customers | `/customers` | Customers overview table | Placeholder |
| Customers | `/customers/individual` | Customer selector & detail view | Placeholder |
| Customers | `/customers/individual` | Financial metrics (contract, revenue, expenses) | Placeholder |
| Customers | `/customers/individual` | Cumulative project finances chart | Placeholder |
| Customers | `/customers/individual` | Equipment inventory & unit management | Placeholder |
| Customers | `/customers/contracts` | Contracts page | Not implemented |
| Assets | `/assets/equipment` | Equipment makes & models inventory | **API** |
| Assets | `/assets/assignments` | Asset assignments | Not implemented |
| Assets | `/assets/iot-devices` | IoT devices inventory | Not implemented |

---

## Connected to Backend API

### 1. MRR & ARR monthly series

**Used by:** MRR & ARR trend chart, ARR currency mix chart (`/`)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/treasury/mrr_arr_monthly` |
| **Proxied URL** | `/api/treasury/mrr_arr_monthly` |
| **Source file** | `lib/finance/mrr-arr-monthly.ts` |
| **Hook** | `hooks/use-mrr-arr-monthly.ts` |

**Response:** array of monthly records.

```ts
type MrrArrMonthlyApiRecord = {
  year: number
  month: number                          // 1-indexed (1 = Jan)
  mrr_idr_original: number | string
  mrr_usd_original: number | string
  mrr_total_idr: number | string
  mrr_total_usd: number | string
  mrr_usd_percentage: number | string
  arr_idr_original: number | string
  arr_usd_original: number | string
  arr_total_idr: number | string
  arr_total_usd: number | string
  arr_usd_percentage: number | string
  percentage_change: number | string
}
```

**Mapped to UI type** (`MrrArrMonthlyPoint`):

```ts
type MrrArrMonthlyPoint = {
  key: string           // e.g. "2024-01"
  label: string         // e.g. "Jan 2024"
  year: number
  month: number         // 0-indexed
  mrrTotalUsd: number
  mrrTotalIdr: number
  arrTotalUsd: number
  arrTotalIdr: number
  arrUsdOriginal: number
  arrIdrContractsUsd: number   // arrTotalUsd - arrUsdOriginal
  arrUsdPercentage: number
  percentageChange: number
  isProjected: boolean
}
```

---

### 2. Equipment makes

**Used by:** Equipment inventory page (`/assets/equipment`)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/assets/makes` |
| **Proxied URL** | `/api/assets/makes` |
| **Source file** | `lib/assets/equipment-api.ts` |

**Response:** array of make records.

```ts
type EquipmentMakeApiRecord = {
  id?: number | string
  make_id?: number | string   // either id or make_id is used as the identifier
  name: string
}
```

**Mapped to UI type** (`EquipmentMake`):

```ts
type EquipmentMake = {
  id: string
  name: string
}
```

#### Add equipment make

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/assets/add_make` |
| **Proxied URL** | `/api/assets/add_make` |

**Request body:**

```ts
{ name: string }
```

---

### 3. Equipment models

**Used by:** Equipment inventory page (`/assets/equipment`)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/assets/all_models` |
| **Proxied URL** | `/api/assets/all_models` |
| **Source file** | `lib/assets/equipment-api.ts` |

**Response:** array of model records.

```ts
type EquipmentModelApiRecord = {
  id?: number | string
  model_id?: number | string   // either id or model_id is used as the identifier
  name: string
  make_id: number | string
  vehicle_type?: ApiVehicleType | string
}

type ApiVehicleType =
  | 'dt' | 'exca' | 'lv' | 'dozer' | 'grader'
  | 'water_truck' | 'fuel_truck' | 'manhauler'
```

**Mapped to UI type** (`EquipmentModel`):

```ts
type EquipmentModel = {
  id: string
  makeId: string
  name: string
  vehicleTypeId: 'dt' | 'exca' | 'lv' | 'dozer' | 'grader' | 'wt' | 'ft' | 'mh' | null
}
```

Vehicle type mapping (API ↔ UI):

| API value | UI id | Label |
|---|---|---|
| `dt` | `dt` | Dump Truck |
| `exca` | `exca` | Excavator |
| `lv` | `lv` | Light Vehicle |
| `dozer` | `dozer` | Dozer |
| `grader` | `grader` | Grader |
| `water_truck` | `wt` | Water Truck |
| `fuel_truck` | `ft` | Fuel Truck |
| `manhauler` | `mh` | Man Hauler |

#### Add equipment model

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/assets/add_model` |
| **Proxied URL** | `/api/assets/add_model` |

**Request body:**

```ts
{
  name: string
  make_id: string
  vehicle_type: ApiVehicleType
}
```

#### Update equipment model

| | |
|---|---|
| **Method** | `PATCH` |
| **Endpoint** | `/assets/update_model/{modelId}` |
| **Proxied URL** | `/api/assets/update_model/{modelId}` |

**Request body:**

```ts
{
  name: string
  make_id: string
  vehicle_type: ApiVehicleType
}
```

---

### 4. Treasury accounts

**Used by:** Bank account cards (`/accounts`)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/treasury/accounts` |
| **Proxied URL** | `/api/treasury/accounts` |
| **Source file** | `lib/finance/treasury-accounts.ts` |
| **Hook** | `hooks/use-treasury-accounts.ts` → `useTreasuryAccounts` |

**Response:** array of account records.

```ts
type TreasuryAccountApiRecord = {
  id: number
  name: string
  bank_name: string
  currency: string
  cash_balance: number | string
  fixed_deposit_balance: number | string
  other_balance?: number | string
  // unused by cards: country, account_number, routing_number, swift_code, …
}
```

**Mapped to UI type** (`BankAccount`):

```ts
type BankAccount = {
  id: string
  bank: string
  accountName: string
  currency: 'IDR' | 'USD'
  balances: { label: string; amount: number }[]  // Cash Balance + Fixed Deposit
}
```

---

### 5. Treasury account summaries

**Used by:** Liquid assets summary card (`/accounts`)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/treasury/accounts/summaries` |
| **Proxied URL** | `/api/treasury/accounts/summaries` |
| **Source file** | `lib/finance/treasury-accounts.ts` |
| **Hook** | `hooks/use-treasury-accounts.ts` → `useTreasuryAccountSummaries` |

**Response:**

```ts
type TreasuryAccountSummariesApiRecord = {
  cash_balance_idr: number | string
  cash_balance_usd: number | string
  fixed_deposit_idr: number | string
  fixed_deposit_usd: number | string
  total: number | string   // Total (USD)
}
```

**Mapped to UI type** (`LiquidAssets`):

```ts
type LiquidAssets = {
  totalCashBalanceIdr: number
  totalCashBalanceUsd: number
  totalFixedDepositIdr: number
  totalFixedDepositUsd: number
  totalInUsd: number
}
```

---

## Placeholder Data

These features render from static or generated mock data in `lib/`. No backend calls are made.

### Finance — MRR & ARR (`/`)

| Feature | Source | Notes |
|---|---|---|
| KPI cards | `lib/finance/mrr-arr.ts` → `lib/finance/shared.ts` | Uses deterministic `REVENUE_SERIES` (Jan 2024 – Dec 2026) and `FLEET_SNAPSHOT` (26 clients, 512 units). Hardcoded captions in `components/mrr-arr/kpi-cards.tsx`. |
| Net Revenue Retention | `components/mrr-arr/chart-placeholder.tsx` | Reserved slot; no data yet. |
| Client matrix heatmap | `lib/finance/client-matrix.ts` | 26 mock clients across 7 Indonesian mining sites. MRR/ARR scaled from `REVENUE_SERIES`. |

**Key placeholder types** (`lib/finance/shared.ts`):

```ts
type MonthlyRevenue = {
  key: string
  label: string
  year: number
  month: number          // 0-indexed
  mrr: number            // USD
  arr: number            // USD
  arrUsd: number
  arrIdr: number
  revenue: number
  receivables: number
  isProjected: boolean
}
```

**Client matrix types** (`lib/finance/client-matrix.ts`):

```ts
type ClientSiteRecord = {
  id: string
  companyName: string
  siteId: string
  siteName: string
  mineral: 'Nickel' | 'Coal' | 'Gold' | 'Copper' | 'Bauxite'
  mrr: number
  prevMrr: number
  arr: number
  prevArr: number
  mrrChange: number
  unitsInstalled: number
  contractExpiryDate: string   // ISO date
  monthsUntilExpiry: number
}
```

---

### Finance — Unit Economics (`/unit-economics`)

| Feature | Source | Notes |
|---|---|---|
| Revenue & receivables chart | `lib/finance/unit-economics.ts` → `REVENUE_SERIES` | Filters the same mock monthly series by start date. |

---

### Finance — Accounts (`/accounts`)

| Feature | Source | Notes |
|---|---|---|
| Internal transactions | `lib/accounts-data.ts` → `INTERNAL_TRANSACTIONS` | Transfers between internal accounts. |
| External transactions | `lib/accounts-data.ts` → `EXTERNAL_TRANSACTIONS` | Inbound/outbound with external parties. |

**Key placeholder types** (`lib/accounts-data.ts`):

```ts
type InternalTransaction = {
  id: string
  date: string
  from: string
  to: string
  amount: number
  currency: 'IDR' | 'USD'
  description: string
}

type ExternalTransaction = {
  id: string
  date: string
  account: string
  direction: 'in' | 'out'
  externalParty: string
  amount: number
  currency: 'IDR' | 'USD'
  description: string
}
```

---

### Customers — Overview (`/customers`)

| Feature | Source | Notes |
|---|---|---|
| Indonesia site map | `lib/customers/sites.ts` → `SITE_LOCATIONS` | 7 sites with province, coordinates, and customer names from client matrix. GeoJSON loaded from `/geo/indonesia-provinces.geojson` (static asset, not API). |
| Customers table | `lib/customers/sites.ts` → `getCustomerOverviewRows()` | Derived from client matrix + `CUSTOMER_OVERVIEW_META` (status, unit mix, potential ARR). |

**Key placeholder types** (`lib/customers/sites.ts`):

```ts
type CustomerOverviewRow = {
  id: string
  companyName: string
  siteId: string
  siteName: string
  mineral: Mineral
  province: string
  city: string
  productionUnitsTotal: number
  productionUnitsInstalled: number
  supportUnitsTotal: number
  supportUnitsInstalled: number
  status: 'Pitch' | 'Trial' | 'Commercial' | 'Churned'
  currentArr: number
  potentialArr: number
}
```

---

### Customers — Individual (`/customers/individual`)

All data is generated in `lib/customers/individual.ts` from the overview rows and client matrix. No API calls.

| Feature | Source | Notes |
|---|---|---|
| Customer selector | `getCustomerOptions()` | 26 customers from overview rows. |
| Contract & billing metrics | `buildFinancials()` | MRR, TCV, realized revenue, receivables, expenses, profitability — all computed from mock inputs. |
| Financial metrics — unit economics section | `components/customers/customer-financial-metrics.tsx` | Hardcoded dummy values (`productionInstalled = 18`, etc.) with a TODO to wire from billing. |
| Cumulative project finances chart | `buildCumulativeProjectFinances()` | Monthly CAPEX/OPEX/revenue series generated from contract dates. |
| Equipment counts & units | `buildEquipment()` | Equipment mix by mineral type; unit IDs, manufacturers, models generated deterministically. |
| IoT device assignment picker | `lib/assets/iot-devices.ts` → `IOT_DEVICES` | 15 mock devices; availability computed client-side. Equipment add/edit is local state only (not persisted). |

**Key placeholder types** (`lib/customers/individual.ts`):

```ts
type CustomerIndividualDetail = CustomerOverviewRow & {
  mrr: number
  potentialMrr: number
  contractStartDate: string
  contractEndDate: string
  tcv: number
  realizedRevenue: number
  receivables: number
  overdueReceivables: number
  remainder: number
  totalExpenses: number
  profitability: number
  profitabilityMargin: number
  cumulativeProjectFinances: CumulativeProjectFinances
  equipment: CustomerEquipmentCount[]
  equipmentUnits: CustomerEquipmentUnit[]
}
```

---

### Customers — Contracts (`/customers/contracts`)

Empty page shell. No data or UI implemented yet.

---

### Assets — Assignments (`/assets/assignments`)

Empty page shell. No data or UI implemented yet.

---

### Assets — IoT Devices (`/assets/iot-devices`)

Empty page shell. Mock device inventory exists in `lib/assets/iot-devices.ts` but is only used on the Individual customer page.

```ts
type IotDevice = {
  id: string
  label: string
  status: 'available' | 'assigned'
}
```

---

### Static UI config (not API data)

| Item | Source | Used by |
|---|---|---|
| Equipment type labels & images | `lib/assets/equipment-types.ts` → `EQUIPMENT_TYPES` | Equipment page filters, customer equipment cards |
| Currency conversion | `lib/finance/shared.ts` → `USD_TO_IDR = 16250` | All currency toggles |
| Contract expiry colors | `lib/charts/contract-expiry-color.ts` | Client matrix heatmap |
