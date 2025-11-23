# Pet QR Code Lifecycle

## Overview

This document describes the complete lifecycle of QR codes in the Pet QR System, a B2B2C SaaS platform.

## Lifecycle Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PET QR CODE LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   PHASE 1   │  GENERATION (Super Admin)
└─────────────┘
       │
       ▼
  ┌─────────┐     Super Admin generates QR codes in batches
  │ CREATED │     - Batch of 1-100 QR codes
  │ (Stock) │     - Each has unique CODE + PIN
  └────┬────┘     - Status: "pending"
       │          - No tenant, no user, no pet
       │
       │  [Super Admin assigns to Tenant]
       ▼
┌─────────────┐
│   PHASE 2   │  ALLOCATION (Super Admin → Tenant)
└─────────────┘
       │
       ▼
  ┌──────────┐    QR codes assigned to a Tenant (Store)
  │ ASSIGNED │    - assigned_to_tenant_id set
  │ (Tenant  │    - Appears in Tenant's "Inventory"
  │  Stock)  │    - Status: "inactive"
  └────┬─────┘    - Still no user, no pet
       │
       │  [User activates with CODE + PIN]
       ▼
┌─────────────┐
│   PHASE 3   │  ACTIVATION (User)
└─────────────┘
       │
       ▼
  ┌──────────┐    User activates QR code
  │ ACTIVATED│    - user_id set (owner)
  │ (User    │    - Status: "active"
  │  Owned)  │    - activated_at timestamp
  └────┬─────┘    - Still no pet linked
       │
       │  [User links to their pet]
       ▼
┌─────────────┐
│   PHASE 4   │  LINKING (User → Pet)
└─────────────┘
       │
       ▼
  ┌──────────┐    QR code linked to a pet
  │  LINKED  │    - pet_id set
  │ (In Use) │    - Scannable by public
  └────┬─────┘    - Shows pet info when scanned
       │
       │  [Public scans QR code]
       ▼
┌─────────────┐
│   PHASE 5   │  SCANNING (Public)
└─────────────┘
       │
       ▼
  ┌──────────┐    QR code is scanned
  │ SCANNED  │    - Scan event logged
  │          │    - Location shared (optional)
  └──────────┘    - Pet info displayed
```

## State Transitions

```
  ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ pending │ ───► │ inactive │ ───► │  active  │ ───► │  active  │
  │         │      │          │      │ (no pet) │      │ (linked) │
  └─────────┘      └──────────┘      └──────────┘      └──────────┘
       │                │                  │                 │
       │                │                  │                 │
   [generate]      [allocate to       [user            [link to
                    tenant]          activates]          pet]
```

## Ownership Model

```
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │ Super Admin │ ──────► │   Tenant    │ ──────► │    User     │
  │  (Platform) │ creates │   (Store)   │ sells   │  (Customer) │
  └─────────────┘         └─────────────┘         └─────────────┘
         │                       │                       │
         │                       │                       │
    Generates              Has Inventory            Owns & Links
    QR Batches            of QR Codes              to Pets
         │                       │                       │
         ▼                       ▼                       ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │  QR Batch   │         │  Allocated  │         │  Activated  │
  │   Table     │         │  QR Codes   │         │  QR Code    │
  │  (shared)   │         │  (tenant)   │         │  (user)     │
  └─────────────┘         └─────────────┘         └─────────────┘
```

## Visibility by Role

| Role | What they see |
|------|---------------|
| **Super Admin** | ALL QR codes across all tenants<br>- Can generate batches<br>- Can allocate to tenants<br>- Can view analytics |
| **Tenant Admin** | QR codes allocated to their tenant<br>- Inventory count (total allocated)<br>- Active/Inactive status<br>- Which user owns each<br>- Which pet is linked |
| **User** | Only their own QR codes<br>- Can activate new QR codes<br>- Can link/unlink to pets<br>- Can view scan history |
| **Public** | Scan result only<br>- Pet info (if linked)<br>- Contact owner options |

## Physical Flow (B2B2C Model)

```
  Platform                    Pet Store                    Customer
  (Super Admin)               (Tenant)                     (User)
      │                           │                            │
      │   1. Generate QR          │                            │
      │   ─────────────►          │                            │
      │                           │                            │
      │   2. Ship Physical        │                            │
      │      QR Tags              │                            │
      │   ─────────────►          │                            │
      │                           │                            │
      │                           │   3. Sell QR Tag           │
      │                           │   ─────────────►           │
      │                           │      (with pet purchase    │
      │                           │       or separately)       │
      │                           │                            │
      │                           │                            │   4. Activate
      │                           │                            │   ─────────►
      │                           │                            │   (CODE+PIN)
      │                           │                            │
      │                           │                            │   5. Link to Pet
      │                           │                            │   ─────────►
      │                           │                            │
      │                           │                            │   6. Attach to
      │                           │                            │      Pet Collar
      │                           │                            │   ─────────►
```

## QR Code Data Model

### Key Fields

| Field | Description | Set When |
|-------|-------------|----------|
| `id` | Unique identifier | Generated |
| `code` | QR code string (e.g., "PQR-ABC123") | Generated |
| `pin` | 4-6 digit activation PIN | Generated |
| `status` | pending/inactive/active | State changes |
| `batch_id` | Reference to generation batch | Generated |
| `assigned_to_tenant_id` | Tenant allocation | Allocated |
| `user_id` | User who activated | Activated |
| `pet_id` | Linked pet | Linked |
| `activated_at` | Activation timestamp | Activated |
| `activation_count` | Number of times activated | Incremented on recycle |
| `created_at` | Creation timestamp | Generated |

### Status Meanings

| Status | Description | tenant_id | user_id | pet_id |
|--------|-------------|-----------|---------|--------|
| `pending` | Just generated, in platform stock | NULL | NULL | NULL |
| `inactive` | Allocated to tenant, not activated | SET | NULL | NULL |
| `active` | Activated by user | SET | SET | NULL or SET |

## QR Code Recycling

When a user is deleted, their QR codes are **recycled** rather than deleted:

### User Deletion Process

```
  ┌─────────────┐
  │    User     │
  │   Deleted   │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     1. Unlink QR codes
  │  QR Codes   │     - pet_id = NULL
  │  Recycled   │     - activated_by_user_id = NULL
  │             │     - activated_at = NULL
  │             │     - status = 'inactive'
  │             │     - activation_count += 1
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     2. Delete pets
  │    Pets     │     - All pets owned by user deleted
  │   Deleted   │     - Pet profiles removed
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     3. Delete user
  │    User     │     - User account removed
  │   Removed   │     - Login disabled
  └─────────────┘
```

### Recycled QR Code Behavior

- Returns to **tenant inventory** with `status = 'inactive'`
- Retains `activation_count` to track usage history
- Can be **re-activated** by a new user
- Preserves `scan_events` history (for analytics)
- Keeps same `code` and `pin`

### Why Recycle?

1. **Physical tags exist** - QR codes are printed on physical tags; deleting would waste inventory
2. **Audit trail** - `activation_count > 0` indicates previously used codes
3. **Cost efficiency** - No need to generate new codes when users leave
4. **Analytics preservation** - Scan history retained for tenant insights

## Statistics Definitions

### For Tenant Admin Dashboard

| Stat | Definition | Source |
|------|------------|--------|
| **Inventory** | Total QR codes allocated to this tenant | `tenant_stats.total_qr_codes` |
| **Active** | QR codes with status = 'active' | Count from QR list |
| **Linked** | QR codes with pet_id != NULL | Count from QR list |
| **Unlinked** | QR codes with pet_id = NULL | Count from QR list |

### For Super Admin Dashboard

| Stat | Definition |
|------|------------|
| **Total Generated** | All QR codes in system |
| **Allocated** | QR codes assigned to tenants |
| **Unallocated** | QR codes in platform stock |
| **Active** | QR codes activated by users |

---

*Last updated: 2025-11-23*
