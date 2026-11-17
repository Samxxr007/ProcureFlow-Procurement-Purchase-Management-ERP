import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/SupplierService';
import { ProductService } from '../services/ProductService';
import { PurchaseOrderService } from '../services/PurchaseOrderService';
import { GoodsReceiptService } from '../services/GoodsReceiptService';
import { InvoiceService } from '../services/InvoiceService';
import { PaymentService } from '../services/PaymentService';
import { AuditService } from '../services/AuditService';
import { DashboardService } from '../services/DashboardService';

export class SupplierController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, activeOnly } = req.query;
      const list = await SupplierService.list(search as string, activeOnly === 'true');
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.getById(req.params.id as string);
      res.json(supplier);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.create(req.body, req.user!);
      res.status(201).json(supplier);
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.update(req.params.id as string, req.body, req.user!);
      res.json(supplier);
    } catch (err) { next(err); }
  }
}

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category } = req.query;
      const list = await ProductService.list(search as string, category as string);
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getById(req.params.id as string);
      res.json(product);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.create(req.body, req.user!);
      res.status(201).json(product);
    } catch (err) { next(err); }
  }
}

export class PurchaseOrderController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await PurchaseOrderService.list();
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await PurchaseOrderService.getById(req.params.id as string);
      res.json(po);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await PurchaseOrderService.create(req.body, req.user!);
      res.status(201).json(po);
    } catch (err) { next(err); }
  }
}

export class GoodsReceiptController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await GoodsReceiptService.list();
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const gr = await GoodsReceiptService.getById(req.params.id as string);
      res.json(gr);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const gr = await GoodsReceiptService.create(req.body, req.user!);
      res.status(201).json(gr);
    } catch (err) { next(err); }
  }
}

export class InvoiceController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await InvoiceService.list();
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const inv = await InvoiceService.getById(req.params.id as string);
      res.json(inv);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const inv = await InvoiceService.create(req.body, req.user!);
      res.status(201).json(inv);
    } catch (err) { next(err); }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes } = req.body;
      const inv = await InvoiceService.verify(req.params.id as string, notes, req.user!);
      res.json(inv);
    } catch (err) { next(err); }
  }
}

export class PaymentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await PaymentService.list();
      res.json(list);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.getById(req.params.id as string);
      res.json(payment);
    } catch (err) { next(err); }
  }

  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.processPayment(req.body, req.user!);
      res.status(201).json(payment);
    } catch (err) { next(err); }
  }
}

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const events = await AuditService.listEvents(limit, offset);
      res.json(events);
    } catch (err) { next(err); }
  }
}

export class DashboardController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getOperationalOverview();
      res.json(data);
    } catch (err) { next(err); }
  }
}
