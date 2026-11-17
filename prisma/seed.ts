import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TEST_CATALOG, AUTH_SCENARIOS } from '../packages/test-catalog/src';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting ProcureFlow Seeding ---');

  // Clean existing tables in reverse dependency order
  await prisma.selectionDecision.deleteMany();
  await prisma.testPrediction.deleteMany();
  await prisma.modelTrainingRun.deleteMany();
  await prisma.testExecutionHistory.deleteMany();
  await prisma.changedFile.deleteMany();
  await prisma.gitCommit.deleteMany();
  await prisma.defect.deleteMany();
  await prisma.testScenarioResult.deleteMany();
  await prisma.testScenario.deleteMany();
  await prisma.testCaseResult.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.purchaseRequestItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users across all 5 roles
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
  const empPasswordHash = await bcrypt.hash('Employee@123', salt);
  const mgrPasswordHash = await bcrypt.hash('Manager@123', salt);
  const procPasswordHash = await bcrypt.hash('Procure@123', salt);
  const finPasswordHash = await bcrypt.hash('Finance@123', salt);

  const users = [
    { id: 'usr-admin-1', email: 'admin@procureflow.com', name: 'System Administrator', role: 'ADMIN', department: 'IT Operations', passwordHash: adminPasswordHash },
    { id: 'usr-emp-1', email: 'alice@procureflow.com', name: 'Alice Walker', role: 'EMPLOYEE', department: 'Engineering', passwordHash: empPasswordHash },
    { id: 'usr-emp-2', email: 'bob_emp@procureflow.com', name: 'Bob Vance', role: 'EMPLOYEE', department: 'Research & Development', passwordHash: defaultPasswordHash },
    { id: 'usr-emp-3', email: 'charlie@procureflow.com', name: 'Charlie Brown', role: 'EMPLOYEE', department: 'Marketing', passwordHash: defaultPasswordHash },
    { id: 'usr-emp-4', email: 'diana@procureflow.com', name: 'Diana Prince', role: 'EMPLOYEE', department: 'Operations', passwordHash: defaultPasswordHash },
    { id: 'usr-emp-5', email: 'evan@procureflow.com', name: 'Evan Wright', role: 'EMPLOYEE', department: 'Engineering', passwordHash: defaultPasswordHash },
    { id: 'usr-mgr-1', email: 'bob@procureflow.com', name: 'Bob Roberts', role: 'MANAGER', department: 'Engineering', passwordHash: mgrPasswordHash },
    { id: 'usr-mgr-2', email: 'sarah@procureflow.com', name: 'Sarah Connor', role: 'MANAGER', department: 'Operations', passwordHash: mgrPasswordHash },
    { id: 'usr-proc-1', email: 'carol@procureflow.com', name: 'Carol Danvers', role: 'PROCUREMENT', department: 'Procurement & Supply', passwordHash: procPasswordHash },
    { id: 'usr-proc-2', email: 'david@procureflow.com', name: 'David Miller', role: 'PROCUREMENT', department: 'Procurement & Supply', passwordHash: procPasswordHash },
    { id: 'usr-fin-1', email: 'dave@procureflow.com', name: 'Dave Johnson', role: 'FINANCE', department: 'Corporate Finance', passwordHash: finPasswordHash },
    { id: 'usr-fin-2', email: 'fiona@procureflow.com', name: 'Fiona Gallagher', role: 'FINANCE', department: 'Accounts Payable', passwordHash: finPasswordHash }
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log(`✓ Seeded ${users.length} Users with role-based credentials`);

  // 2. Seed Suppliers
  const suppliers = [
    { id: 'seed-supp-1', code: 'SUP-001', name: 'Apex Industrial Technologies', email: 'orders@apexindustrial.com', phone: '+1-555-0192', address: '100 Industrial Pkwy, Chicago, IL', taxId: 'TAX-US-9901' },
    { id: 'seed-supp-2', code: 'SUP-002', name: 'Global Logistics & Office Supplies', email: 'sales@globallogistics.com', phone: '+1-555-0193', address: '450 Harbor Blvd, Long Beach, CA', taxId: 'TAX-US-9902' },
    { id: 'seed-supp-3', code: 'SUP-003', name: 'Precision Machining & Hardware', email: 'supply@precisionmach.com', phone: '+1-555-0194', address: '88 Gear St, Detroit, MI', taxId: 'TAX-US-9903' },
    { id: 'seed-supp-4', code: 'SUP-004', name: 'Vortex Semiconductor Components', email: 'fulfillment@vortexsemi.com', phone: '+1-555-0195', address: '302 Silicon Ave, San Jose, CA', taxId: 'TAX-US-9904' },
    { id: 'seed-supp-5', code: 'SUP-005', name: 'OmniPack Materials Co.', email: 'accounts@omnipack.com', phone: '+1-555-0196', address: '12 Box Way, Atlanta, GA', taxId: 'TAX-US-9905' },
    { id: 'seed-supp-6', code: 'SUP-006', name: 'Summit Safety & PPE Supplies', email: 'contact@summitsafety.com', phone: '+1-555-0197', address: '77 Ridge Rd, Denver, CO', taxId: 'TAX-US-9906' },
    { id: 'seed-supp-7', code: 'SUP-007', name: 'NexGen Cloud Infrastructure Gear', email: 'enterprise@nexgengear.com', phone: '+1-555-0198', address: '500 Server Way, Seattle, WA', taxId: 'TAX-US-9907' },
    { id: 'seed-supp-8', code: 'SUP-008', name: 'Metro Chemical & Solvents', email: 'orders@metrochem.com', phone: '+1-555-0199', address: '23 Refinery Lane, Houston, TX', taxId: 'TAX-US-9908' },
    { id: 'seed-supp-9', code: 'SUP-009', name: 'Quantum Cables & Connectors', email: 'support@quantumcable.com', phone: '+1-555-0200', address: '14 Wire Rd, Austin, TX', taxId: 'TAX-US-9909' },
    { id: 'seed-supp-10', code: 'SUP-010', name: 'Pinnacle Fasteners & Bearings', email: 'sales@pinnaclefasteners.com', phone: '+1-555-0201', address: '99 Steel Blvd, Cleveland, OH', taxId: 'TAX-US-9910' }
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({ data: s });
  }
  console.log(`✓ Seeded ${suppliers.length} Suppliers`);

  // 3. Seed Products
  const products = [
    { id: 'seed-prod-1', code: 'PRD-101', name: 'Steelcase Gesture Ergonomic Chair', description: 'Executive ergonomic office chair with adjustable lumbar support', unit: 'unit', category: 'Furniture', unitPrice: 850.00 },
    { id: 'seed-prod-2', code: 'PRD-102', name: 'Dell Precision 5680 Mobile Workstation', description: 'Intel i9, 64GB DDR5 RAM, 1TB NVMe, RTX 3500 Ada', unit: 'unit', category: 'Hardware', unitPrice: 2450.00 },
    { id: 'seed-prod-3', code: 'PRD-103', name: 'LG UltraFine 32-inch 4K Monitor', description: '3840x2160 IPS Display with USB-C 90W PD', unit: 'unit', category: 'Electronics', unitPrice: 620.00 },
    { id: 'seed-prod-4', code: 'PRD-104', name: 'Industrial Grade Calipers 300mm', description: 'Digital IP67 stainless steel vernier caliper', unit: 'piece', category: 'Tools', unitPrice: 185.00 },
    { id: 'seed-prod-5', code: 'PRD-105', name: 'M12 Heavy Duty Hex Bolts (Pack of 500)', description: 'Grade 8.8 zinc plated steel hex bolts', unit: 'pack', category: 'Fasteners', unitPrice: 95.00 },
    { id: 'seed-prod-6', code: 'PRD-106', name: '3M Aura Particulate Respirator 9205+ (Case of 240)', description: 'N95 NIOSH approved particulate respirators', unit: 'case', category: 'Safety', unitPrice: 160.00 },
    { id: 'seed-prod-7', code: 'PRD-107', name: 'Cat6A Shielded Ethernet Cable 305m Spool', description: 'Solid copper 10Gbps low-smoke zero-halogen', unit: 'spool', category: 'Network', unitPrice: 280.00 },
    { id: 'seed-prod-8', code: 'PRD-108', name: 'Schneider Electric Smart UPS 1500VA', description: 'Pure Sine Wave 2U Rackmount Battery Backup', unit: 'unit', category: 'Hardware', unitPrice: 780.00 },
    { id: 'seed-prod-9', code: 'PRD-109', name: 'Isopropyl Alcohol 99.9% (Drum 200L)', description: 'High purity technical grade cleaning solvent', unit: 'drum', category: 'Chemicals', unitPrice: 420.00 },
    { id: 'seed-prod-10', code: 'PRD-110', name: 'ESD Anti-Static Lab Coat (Size L)', description: 'Static dissipative polyester cotton blend', unit: 'piece', category: 'Safety', unitPrice: 45.00 },
    { id: 'seed-prod-11', code: 'PRD-111', name: 'Hydraulic Seals O-Ring Kit (400 Pcs)', description: 'Nitrile 70 Shore A assorted metric sizes', unit: 'kit', category: 'Maintenance', unitPrice: 65.00 },
    { id: 'seed-prod-12', code: 'PRD-112', name: 'Heavy Duty Thermal Transfer Label Printer', description: 'Zebra ZT411 300dpi Industrial Label Printer', unit: 'unit', category: 'Equipment', unitPrice: 1350.00 },
    { id: 'seed-prod-13', code: 'PRD-113', name: 'Corrugated Shipping Boxes 40x30x30cm (Bundle 50)', description: 'Double wall heavy duty cardboard carton', unit: 'bundle', category: 'Packaging', unitPrice: 85.00 },
    { id: 'seed-prod-14', code: 'PRD-114', name: 'Bosch Professional Cordless Impact Driver 18V', description: 'Brushless motor with 2x 4.0Ah batteries & charger', unit: 'unit', category: 'Tools', unitPrice: 240.00 },
    { id: 'seed-prod-15', code: 'PRD-115', name: 'Polyurethane Forklift Pallet Jack Wheels (Pair)', description: 'High load capacity 82mm x 70mm tandem rollers', unit: 'pair', category: 'Warehouse', unitPrice: 110.00 }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log(`✓ Seeded ${products.length} Products`);

  // 4. Seed Purchase Requests across multiple statuses
  // A. DRAFT request owned by Alice (seed-pr-100) - used by AUTH-002 & AUTH-007
  await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-100',
      prNumber: 'PR-2026-00100',
      title: 'Dev Team Ergonomic Peripherals',
      status: 'DRAFT',
      justification: 'Quarterly peripheral refresh for backend engineering team',
      requiredDate: new Date('2026-12-01'),
      requestedById: 'usr-emp-1',
      totalAmount: 1240.00,
      items: {
        create: [
          { productId: 'seed-prod-3', itemDescription: 'LG UltraFine 32-inch 4K Monitor', quantity: 2, unitPrice: 620.00, totalPrice: 1240.00 }
        ]
      }
    }
  });

  // B. SUBMITTED request owned by Alice (seed-pr-101) - used by AUTH-001, AUTH-003, AUTH-014
  await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-101',
      prNumber: 'PR-2026-00101',
      title: 'Engineering High Performance Mobile Workstation',
      status: 'SUBMITTED',
      justification: 'Replacement workstation for senior architect build benchmarks',
      requiredDate: new Date('2026-11-28'),
      requestedById: 'usr-emp-1',
      totalAmount: 2450.00,
      items: {
        create: [
          { productId: 'seed-prod-2', itemDescription: 'Dell Precision 5680 Mobile Workstation', quantity: 1, unitPrice: 2450.00, totalPrice: 2450.00 }
        ]
      }
    }
  });

  // C. APPROVED request (seed-pr-102) - used by AUTH-006
  const prApproved = await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-102',
      prNumber: 'PR-2026-00102',
      title: 'Warehouse Safety Gear & Respiratory Protection',
      status: 'APPROVED',
      justification: 'Annual OSHA compliance PPE restock for distribution hub',
      requiredDate: new Date('2026-12-10'),
      requestedById: 'usr-emp-4',
      totalAmount: 960.00,
      items: {
        create: [
          { productId: 'seed-prod-6', itemDescription: '3M Aura Particulate Respirator (Case of 240)', quantity: 6, unitPrice: 160.00, totalPrice: 960.00 }
        ]
      },
      approvals: {
        create: [
          { approverId: 'usr-mgr-2', decision: 'APPROVED', comments: 'Essential safety compliance requirement approved.' }
        ]
      }
    }
  });

  // D. Fully Verified and PAID flow (seed-pr-103 -> PO-101 -> GR-101 -> INV-101 -> PAY-101) - used by AUTH-009
  const prPaid = await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-103',
      prNumber: 'PR-2026-00103',
      title: 'Core Server Rack UPS Replacement',
      status: 'PAID',
      justification: 'Redundant power protection for server room B',
      requiredDate: new Date('2026-11-15'),
      requestedById: 'usr-emp-1',
      totalAmount: 1560.00,
      items: {
        create: [
          { productId: 'seed-prod-8', itemDescription: 'Schneider Electric Smart UPS 1500VA', quantity: 2, unitPrice: 780.00, totalPrice: 1560.00 }
        ]
      },
      approvals: {
        create: [
          { approverId: 'usr-mgr-1', decision: 'APPROVED', comments: 'Budget cleared under infrastructure maintenance.' }
        ]
      }
    }
  });

  const poPaid = await prisma.purchaseOrder.create({
    data: {
      id: 'seed-po-101',
      poNumber: 'PO-2026-00501',
      purchaseRequestId: prPaid.id,
      supplierId: 'seed-supp-7',
      status: 'FULFILLED',
      totalAmount: 1560.00,
      items: {
        create: [
          { itemDescription: 'Schneider Electric Smart UPS 1500VA', quantity: 2, unitPrice: 780.00, totalPrice: 1560.00 }
        ]
      }
    }
  });

  const grPaid = await prisma.goodsReceipt.create({
    data: {
      id: 'seed-gr-101',
      grNumber: 'GR-2026-00901',
      purchaseOrderId: poPaid.id,
      status: 'ACCEPTED',
      deliveryNoteNumber: 'DN-NXG-8812',
      receivedById: 'usr-proc-1',
      notes: 'All 2 units inspected, tested and battery health checked OK',
      items: {
        create: [
          { itemDescription: 'Schneider Electric Smart UPS 1500VA', orderedQuantity: 2, receivedQuantity: 2, damagedQuantity: 0 }
        ]
      }
    }
  });

  const invPaid = await prisma.invoice.create({
    data: {
      id: 'seed-inv-101',
      invoiceNumber: 'INV-NXG-2026-4401',
      purchaseOrderId: poPaid.id,
      supplierId: 'seed-supp-7',
      amount: 1560.00,
      status: 'PAID',
      dueDate: new Date('2026-12-15'),
      verifiedById: 'usr-fin-1',
      verifiedAt: new Date('2026-11-16')
    }
  });

  await prisma.payment.create({
    data: {
      id: 'seed-pay-101',
      paymentNumber: 'PAY-2026-00101',
      invoiceId: invPaid.id,
      amount: 1560.00,
      status: 'COMPLETED',
      idempotencyKey: 'seed-payment-idem-101',
      paidById: 'usr-fin-1',
      paymentMethod: 'EFT_ACH',
      referenceNotes: 'Standard ACH batch payment'
    }
  });

  // E. Verified Invoice awaiting Payment (seed-pr-104 -> PO-102 -> GR-102 -> INV-102) - used by AUTH-015
  const prVerified = await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-104',
      prNumber: 'PR-2026-00104',
      title: 'Precision Digital Calipers & Metric Hex Bolts',
      status: 'INVOICE_VERIFIED',
      justification: 'Quality control metrology tools for CNC shop floor',
      requiredDate: new Date('2026-11-20'),
      requestedById: 'usr-emp-5',
      totalAmount: 1115.00,
      items: {
        create: [
          { productId: 'seed-prod-4', itemDescription: 'Industrial Grade Calipers 300mm', quantity: 5, unitPrice: 185.00, totalPrice: 925.00 },
          { productId: 'seed-prod-5', itemDescription: 'M12 Heavy Duty Hex Bolts (Pack of 500)', quantity: 2, unitPrice: 95.00, totalPrice: 190.00 }
        ]
      },
      approvals: {
        create: [
          { approverId: 'usr-mgr-1', decision: 'APPROVED', comments: 'Approved QC tool requisition.' }
        ]
      }
    }
  });

  const poVerified = await prisma.purchaseOrder.create({
    data: {
      id: 'seed-po-102',
      poNumber: 'PO-2026-00502',
      purchaseRequestId: prVerified.id,
      supplierId: 'seed-supp-3',
      status: 'FULFILLED',
      totalAmount: 1115.00,
      items: {
        create: [
          { itemDescription: 'Industrial Grade Calipers 300mm', quantity: 5, unitPrice: 185.00, totalPrice: 925.00 },
          { itemDescription: 'M12 Heavy Duty Hex Bolts (Pack of 500)', quantity: 2, unitPrice: 95.00, totalPrice: 190.00 }
        ]
      }
    }
  });

  await prisma.goodsReceipt.create({
    data: {
      id: 'seed-gr-102',
      grNumber: 'GR-2026-00902',
      purchaseOrderId: poVerified.id,
      status: 'ACCEPTED',
      deliveryNoteNumber: 'DN-PMH-9011',
      receivedById: 'usr-proc-2',
      notes: 'Delivered in sealed factory cases, calibration certificates verified',
      items: {
        create: [
          { itemDescription: 'Industrial Grade Calipers 300mm', orderedQuantity: 5, receivedQuantity: 5, damagedQuantity: 0 },
          { itemDescription: 'M12 Heavy Duty Hex Bolts (Pack of 500)', orderedQuantity: 2, receivedQuantity: 2, damagedQuantity: 0 }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      id: 'seed-inv-102',
      invoiceNumber: 'INV-PMH-2026-7811',
      purchaseOrderId: poVerified.id,
      supplierId: 'seed-supp-3',
      amount: 1115.00,
      status: 'VERIFIED',
      dueDate: new Date('2026-12-20'),
      verifiedById: 'usr-fin-1',
      verifiedAt: new Date('2026-11-17')
    }
  });

  // F. Invoice without Goods Receipt (seed-inv-no-gr) - used by AUTH-005
  const prNoGr = await prisma.purchaseRequest.create({
    data: {
      id: 'seed-pr-105',
      prNumber: 'PR-2026-00105',
      title: 'Facility Chemical Solvents Drum',
      status: 'PURCHASE_ORDER_CREATED',
      justification: 'Degreasing solvents for assembly line cleaning',
      requiredDate: new Date('2026-12-05'),
      requestedById: 'usr-emp-4',
      totalAmount: 840.00,
      items: {
        create: [
          { productId: 'seed-prod-9', itemDescription: 'Isopropyl Alcohol 99.9% (Drum 200L)', quantity: 2, unitPrice: 420.00, totalPrice: 840.00 }
        ]
      },
      approvals: {
        create: [
          { approverId: 'usr-mgr-2', decision: 'APPROVED', comments: 'Approved solvent order' }
        ]
      }
    }
  });

  const poNoGr = await prisma.purchaseOrder.create({
    data: {
      id: 'seed-po-103',
      poNumber: 'PO-2026-00503',
      purchaseRequestId: prNoGr.id,
      supplierId: 'seed-supp-8',
      status: 'ISSUED',
      totalAmount: 840.00,
      items: {
        create: [
          { itemDescription: 'Isopropyl Alcohol 99.9% (Drum 200L)', quantity: 2, unitPrice: 420.00, totalPrice: 840.00 }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      id: 'seed-inv-no-gr',
      invoiceNumber: 'INV-CHEM-2026-1092',
      purchaseOrderId: poNoGr.id,
      supplierId: 'seed-supp-8',
      amount: 840.00,
      status: 'PENDING',
      dueDate: new Date('2026-12-30')
    }
  });

  // G. Unverified invoice (seed-inv-unverified) - used by AUTH-004
  await prisma.invoice.create({
    data: {
      id: 'seed-inv-unverified',
      invoiceNumber: 'INV-UNVERIFIED-TEST-004',
      purchaseOrderId: poNoGr.id,
      supplierId: 'seed-supp-8',
      amount: 840.00,
      status: 'PENDING',
      dueDate: new Date('2026-12-30')
    }
  });

  // Additional realistic PRs across statuses
  const extraPrs = [
    { num: 'PR-2026-00106', title: 'Network Infrastructure Cat6A Spools', status: 'PURCHASE_ORDER_CREATED', user: 'usr-emp-1', amount: 840.00 },
    { num: 'PR-2026-00107', title: 'Industrial Zebra Label Printer', status: 'RECEIVED', user: 'usr-emp-4', amount: 1350.00 },
    { num: 'PR-2026-00108', title: 'Bosch Cordless Impact Drivers x4', status: 'REJECTED', user: 'usr-emp-3', amount: 960.00 },
    { num: 'PR-2026-00109', title: 'Packaging Shipping Cartons Bundle', status: 'SUBMITTED', user: 'usr-emp-4', amount: 425.00 },
    { num: 'PR-2026-00110', title: 'Warehouse Pallet Jack Wheels', status: 'APPROVED', user: 'usr-emp-5', amount: 440.00 },
    { num: 'PR-2026-00111', title: 'ESD Anti-Static Lab Coats Restock', status: 'PARTIALLY_RECEIVED', user: 'usr-emp-2', amount: 450.00 },
    { num: 'PR-2026-00112', title: 'Hydraulic Seal O-Ring Assortment Kits', status: 'DRAFT', user: 'usr-emp-3', amount: 260.00 }
  ];

  for (const ep of extraPrs) {
    await prisma.purchaseRequest.create({
      data: {
        prNumber: ep.num,
        title: ep.title,
        status: ep.status,
        justification: `Standard operational requisition for ${ep.title}`,
        requiredDate: new Date('2026-12-18'),
        requestedById: ep.user,
        totalAmount: ep.amount
      }
    });
  }

  console.log(`✓ Seeded realistic Purchase Requests, Orders, Receipts, Invoices & Payments`);

  // 5. Seed Test Catalog and Scenarios into QA platform tables
  for (const tc of TEST_CATALOG) {
    await prisma.testCase.create({
      data: {
        testId: tc.testId,
        name: tc.name,
        filePath: tc.filePath,
        module: tc.module,
        relatedSourceFiles: JSON.stringify(tc.relatedSourceFiles),
        relatedRoles: JSON.stringify(tc.relatedRoles),
        criticality: tc.criticality,
        avgDurationMs: tc.avgDurationMs
      }
    });
  }
  console.log(`✓ Registered ${TEST_CATALOG.length} Test Cases in QA Database`);

  for (const sc of AUTH_SCENARIOS) {
    await prisma.testScenario.create({
      data: {
        scenarioId: sc.scenarioId,
        title: sc.title,
        category: sc.category,
        description: sc.description,
        initialState: sc.initialState,
        stepsJson: JSON.stringify(sc.steps)
      }
    });
  }
  console.log(`✓ Registered ${AUTH_SCENARIOS.length} Stateful Authorization Scenarios in QA Database`);

  // 6. Seed initial Git commit & change records to enable immediate diff analysis
  await prisma.gitCommit.create({
    data: {
      commitHash: 'a7b8c9d012345678',
      message: 'feat(auth): enforce strict role matrix and session revocation',
      author: 'Lead Architect <architect@procureflow.com>',
      timestamp: new Date('2026-11-16T14:30:00Z'),
      branch: 'main',
      files: {
        create: [
          { filePath: 'apps/api/src/policies/AuthorizationPolicy.ts', changeType: 'MODIFY', additions: 35, deletions: 12 },
          { filePath: 'apps/api/src/services/AuthService.ts', changeType: 'MODIFY', additions: 22, deletions: 8 }
        ]
      }
    }
  });

  // 7. Seed initial Audit Events
  const auditEvents = [
    { entityName: 'User', entityId: 'usr-admin-1', action: 'SYSTEM_INITIALIZED', userId: 'usr-admin-1', details: JSON.stringify({ note: 'ProcureFlow ERP seeded and initialized' }) },
    { entityName: 'PurchaseRequest', entityId: 'seed-pr-101', action: 'PR_SUBMITTED', userId: 'usr-emp-1', details: JSON.stringify({ prNumber: 'PR-2026-00101', total: 2450.00 }) },
    { entityName: 'Approval', entityId: 'seed-pr-102', action: 'PR_APPROVED', userId: 'usr-mgr-2', details: JSON.stringify({ prNumber: 'PR-2026-00102', decision: 'APPROVED' }) },
    { entityName: 'Payment', entityId: 'seed-pay-101', action: 'PAYMENT_PROCESSED', userId: 'usr-fin-1', details: JSON.stringify({ invoiceNumber: 'INV-NXG-2026-4401', amount: 1560.00 }) }
  ];

  for (const ae of auditEvents) {
    await prisma.auditEvent.create({ data: ae });
  }
  console.log(`✓ Seeded ${auditEvents.length} Audit Events`);

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
