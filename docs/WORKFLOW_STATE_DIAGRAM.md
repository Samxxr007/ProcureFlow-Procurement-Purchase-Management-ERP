# ProcureFlow — Workflow State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee drafts requisition
    
    DRAFT --> SUBMITTED : Employee submits
    DRAFT --> CANCELLED : Cancelled by owner / admin
    
    SUBMITTED --> APPROVED : Manager approves (Separation of duties enforced)
    SUBMITTED --> REJECTED : Manager rejects with rationale
    SUBMITTED --> CANCELLED : Withdrawn
    
    APPROVED --> PURCHASE_ORDER_CREATED : Procurement issues Purchase Order
    APPROVED --> CANCELLED : Cancelled before PO
    
    PURCHASE_ORDER_CREATED --> PARTIALLY_RECEIVED : Dock receives partial delivery
    PURCHASE_ORDER_CREATED --> RECEIVED : Dock receives complete delivery
    
    PARTIALLY_RECEIVED --> RECEIVED : Remaining balance delivered
    
    RECEIVED --> INVOICE_VERIFIED : Finance verifies 3-way match (PO + GR + Invoice)
    
    INVOICE_VERIFIED --> PAID : Finance disburses payment with idempotency key
    
    PAID --> [*] : Terminal state
    REJECTED --> [*] : Terminal state
    CANCELLED --> [*] : Terminal state
```

## Explicit Allowed Transitions

| Starting State | Permitted Next States | Acting Role |
|---|---|---|
| `DRAFT` | `SUBMITTED`, `CANCELLED` | Employee (Owner), Admin |
| `SUBMITTED` | `APPROVED`, `REJECTED`, `CANCELLED` | Manager (Not Requester), Admin |
| `APPROVED` | `PURCHASE_ORDER_CREATED`, `CANCELLED` | Procurement, Admin |
| `PURCHASE_ORDER_CREATED` | `PARTIALLY_RECEIVED`, `RECEIVED` | Procurement, Admin |
| `PARTIALLY_RECEIVED` | `RECEIVED` | Procurement, Admin |
| `RECEIVED` | `INVOICE_VERIFIED` | Finance, Admin |
| `INVOICE_VERIFIED` | `PAID` | Finance, Admin |
| `PAID` | None (Terminal) | — |
| `REJECTED` | None (Terminal) | — |
| `CANCELLED` | None (Terminal) | — |

Direct status jumps (e.g., `DRAFT` straight to `PAID`, or `SUBMITTED` straight to `PURCHASE_ORDER_CREATED`) are rejected by `WorkflowService.assertTransition()` with HTTP 400 Bad Request.
