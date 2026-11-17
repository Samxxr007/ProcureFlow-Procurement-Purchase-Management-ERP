import { Request, Response, NextFunction } from 'express';
import { PurchaseRequestService } from '../services/PurchaseRequestService';
import { ApprovalService } from '../services/ApprovalService';

export class PurchaseRequestController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const list = await PurchaseRequestService.list(req.user!, {
        status: status as string,
        search: search as string,
      });
      res.json(list);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pr = await PurchaseRequestService.getById(req.params.id as string, req.user!);
      res.json(pr);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const pr = await PurchaseRequestService.create(req.body, req.user!);
      res.status(201).json(pr);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const pr = await PurchaseRequestService.update(req.params.id as string, req.body, req.user!);
      res.json(pr);
    } catch (err) {
      next(err);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const pr = await PurchaseRequestService.submit(req.params.id as string, req.user!);
      res.json(pr);
    } catch (err) {
      next(err);
    }
  }

  static async transition(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetStatus } = req.body;
      if (!targetStatus) {
        res.status(400).json({ error: 'targetStatus is required.' });
        return;
      }
      const pr = await PurchaseRequestService.transition(req.params.id as string, targetStatus, req.user!);
      res.json(pr);
    } catch (err) {
      next(err);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { comments } = req.body;
      const result = await ApprovalService.processDecision(
        req.params.id as string,
        { decision: 'APPROVED', comments },
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { comments } = req.body;
      const result = await ApprovalService.processDecision(
        req.params.id as string,
        { decision: 'REJECTED', comments },
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export class ApprovalController {
  static async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const pending = await ApprovalService.listPending(req.user!);
      res.json(pending);
    } catch (err) {
      next(err);
    }
  }

  static async decide(req: Request, res: Response, next: NextFunction) {
    try {
      const { decision, comments } = req.body;
      if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
        res.status(400).json({ error: 'Valid decision ("APPROVED" or "REJECTED") required.' });
        return;
      }
      const result = await ApprovalService.processDecision(
        req.params.id as string,
        { decision, comments },
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
