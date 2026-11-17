export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  PROCUREMENT = 'PROCUREMENT',
  FINANCE = 'FINANCE',
}

export enum PRStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PURCHASE_ORDER_CREATED = 'PURCHASE_ORDER_CREATED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  INVOICE_VERIFIED = 'INVOICE_VERIFIED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum POStatus {
  ISSUED = 'ISSUED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export enum GRStatus {
  ACCEPTED = 'ACCEPTED',
  PARTIAL = 'PARTIAL',
  REJECTED = 'REJECTED',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DefectSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum DefectPriority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum DefectStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  RETEST = 'RETEST',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  DEFERRED = 'DEFERRED',
}

export enum ExecutionMode {
  FULL = 'FULL',
  EXPANDED = 'EXPANDED',
  SELECTIVE = 'SELECTIVE',
  SHADOW = 'SHADOW',
}

export enum TestOutcome {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  NOT_EXECUTED = 'NOT_EXECUTED',
  SKIPPED = 'SKIPPED',
}

export enum TestCriticality {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
}

export interface PurchaseRequestItemDTO {
  id?: string;
  productId?: string | null;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseRequestDTO {
  id: string;
  prNumber: string;
  title: string;
  status: PRStatus;
  justification: string;
  requiredDate: string;
  requestedById: string;
  requestedBy?: UserSummary;
  totalAmount: number;
  items: PurchaseRequestItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDTO {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDTO {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unit: string;
  category: string;
  unitPrice?: number;
  isActive: boolean;
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  purchaseRequestId: string;
  supplierId: string;
  supplier?: SupplierDTO;
  purchaseRequest?: PurchaseRequestDTO;
  status: POStatus;
  totalAmount: number;
  issuedAt: string;
  createdAt: string;
  items: {
    id: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface GoodsReceiptDTO {
  id: string;
  grNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrderDTO;
  status: GRStatus;
  deliveryNoteNumber?: string | null;
  receivedById: string;
  receivedBy?: UserSummary;
  receivedAt: string;
  notes?: string | null;
  items: {
    id: string;
    itemDescription: string;
    orderedQuantity: number;
    receivedQuantity: number;
    damagedQuantity: number;
  }[];
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrderDTO;
  supplierId: string;
  supplier?: SupplierDTO;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  verifiedById?: string | null;
  verifiedBy?: UserSummary;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface PaymentDTO {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: InvoiceDTO;
  amount: number;
  status: PaymentStatus;
  idempotencyKey: string;
  paidById: string;
  paidBy?: UserSummary;
  paidAt: string;
  paymentMethod: string;
  referenceNotes?: string | null;
}

export interface AuditEventDTO {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  userId?: string | null;
  user?: UserSummary;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface TestCaseMetadata {
  testId: string;
  name: string;
  filePath: string;
  module: string;
  relatedSourceFiles: string[];
  relatedRoles: Role[];
  criticality: TestCriticality;
  avgDurationMs: number;
  requiredEnvironment?: string;
}

export interface AuthScenarioStep {
  stepNumber: number;
  name: string;
  actorRole: Role;
  actorEmail: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  payload?: any;
  expectedHttpStatus: number;
  expectedPermissionOutcome: 'ALLOW' | 'DENY';
  stateAssertions?: {
    table: string;
    condition: Record<string, any>;
    expectedCount?: number;
    expectedFields?: Record<string, any>;
  }[];
}

export interface AuthScenarioDefinition {
  scenarioId: string;
  title: string;
  description: string;
  category: string;
  initialState: string;
  steps: AuthScenarioStep[];
}
