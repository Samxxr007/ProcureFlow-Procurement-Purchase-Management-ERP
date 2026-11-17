import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AUTH_SCENARIOS, TEST_CATALOG } from '@procureflow/test-catalog';
import { ScenarioRunner } from '../testing/ScenarioRunner';
import { RegressionIntelligenceService } from '../services/RegressionIntelligenceService';
import { GitAnalysisService } from '../services/GitAnalysisService';
import { ExecutionMode } from '@procureflow/shared';

export class QAController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalTestRuns,
        latestRun,
        openDefectsCount,
        criticalDefectsCount,
        allTestHistory,
        readiness,
        recentDefects,
      ] = await Promise.all([
        prisma.testRun.count(),
        prisma.testRun.findFirst({
          orderBy: { startedAt: 'desc' },
          include: { scenarioResults: true, results: true },
        }),
        prisma.defect.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'RETEST'] } } }),
        prisma.defect.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.testExecutionHistory.findMany(),
        RegressionIntelligenceService.calculateModelReadiness(),
        prisma.defect.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const passedHistorical = allTestHistory.filter((h) => h.outcome === 'PASSED').length;
      const failedHistorical = allTestHistory.filter((h) => h.outcome === 'FAILED').length;

      // Calculate runtime reduction ratio if selective runs exist
      const fullSuiteRun = await prisma.testRun.findFirst({
        where: { mode: 'FULL', status: 'COMPLETED' },
        orderBy: { durationMs: 'desc' },
      });
      const selectiveRun = await prisma.testRun.findFirst({
        where: { mode: 'SELECTIVE', status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
      });

      const fullDuration = fullSuiteRun?.durationMs || 1200;
      const selectiveDuration = selectiveRun?.durationMs || 420;
      const timeReductionPct = Math.round(((fullDuration - selectiveDuration) / fullDuration) * 100);

      res.json({
        totalTestCatalogCount: TEST_CATALOG.length,
        totalAuthScenariosCount: AUTH_SCENARIOS.length,
        totalExecutionRuns: totalTestRuns,
        latestRun,
        openDefects: openDefectsCount,
        criticalDefects: criticalDefectsCount,
        modelReadiness: readiness,
        runtimeReductionPct: Math.max(0, timeReductionPct),
        passRatePct: allTestHistory.length > 0 ? Math.round((passedHistorical / allTestHistory.length) * 100) : 100,
        recentDefects,
      });
    } catch (err) { next(err); }
  }

  static async listScenarios(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(AUTH_SCENARIOS);
    } catch (err) { next(err); }
  }

  static async runScenarios(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, environment } = req.body;
      const app = req.app;
      const result = await ScenarioRunner.runScenarios(
        app,
        scenarioId || 'ALL',
        environment === 'vulnerable' ? 'vulnerable' : 'standard'
      );
      res.json(result);
    } catch (err) { next(err); }
  }

  static async listRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runs = await prisma.testRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 30,
        include: {
          _count: { select: { scenarioResults: true, results: true, defects: true } },
        },
      });
      res.json(runs);
    } catch (err) { next(err); }
  }

  static async getRunById(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await prisma.testRun.findUnique({
        where: { id: req.params.id as string },
        include: {
          scenarioResults: { include: { scenario: true } },
          results: { include: { testCase: true } },
          defects: true,
        },
      });
      if (!run) {
        res.status(404).json({ error: 'Test run not found.' });
        return;
      }
      res.json(run);
    } catch (err) { next(err); }
  }

  static async analyzeRegression(req: Request, res: Response, next: NextFunction) {
    try {
      const { commitHash, mode } = req.query;
      const selection = await RegressionIntelligenceService.selectRegressionTests(
        commitHash as string,
        mode as ExecutionMode
      );
      res.json(selection);
    } catch (err) { next(err); }
  }

  static async getGitAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { baseCommit } = req.query;
      const analysis = await GitAnalysisService.analyzeRecentChanges(baseCommit as string);
      res.json(analysis);
    } catch (err) { next(err); }
  }

  static async getModelStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const readiness = await RegressionIntelligenceService.calculateModelReadiness();
      const latestTraining = await prisma.modelTrainingRun.findFirst({
        orderBy: { trainedAt: 'desc' },
      });
      res.json({
        readiness,
        latestTraining,
      });
    } catch (err) { next(err); }
  }

  static async trainModel(req: Request, res: Response, next: NextFunction) {
    try {
      const { algorithm } = req.body;
      const result = await RegressionIntelligenceService.triggerModelRetraining(algorithm || 'RandomForest');
      res.json(result);
    } catch (err) { next(err); }
  }

  static async listDefects(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, severity, module } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (module) where.module = module;

      const defects = await prisma.defect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          testRun: { select: { id: true, mode: true, environment: true, startedAt: true } },
        },
      });
      res.json(defects);
    } catch (err) { next(err); }
  }

  static async updateDefect(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, assignedToId, retestResult, priority, severity } = req.body;
      const updated = await prisma.defect.update({
        where: { defectId: req.params.id as string },
        data: {
          status: status || undefined,
          assignedToId: assignedToId || undefined,
          retestResult: retestResult || undefined,
          priority: priority || undefined,
          severity: severity || undefined,
        },
      });
      res.json(updated);
    } catch (err) { next(err); }
  }

  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const format = req.query.format || 'json';

      let data: any = [];
      let filename = `report_${type}_${Date.now()}`;

      if (type === 'defects') {
        data = await prisma.defect.findMany({ orderBy: { createdAt: 'desc' } });
        filename = 'procureflow_defects_report.csv';
      } else if (type === 'test-runs') {
        data = await prisma.testRun.findMany({
          orderBy: { startedAt: 'desc' },
          include: { _count: { select: { scenarioResults: true, defects: true } } },
        });
        filename = 'procureflow_test_runs_report.csv';
      } else if (type === 'scenarios') {
        data = await prisma.testScenarioResult.findMany({
          orderBy: { executedAt: 'desc' },
          take: 100,
        });
        filename = 'procureflow_scenario_results.csv';
      }

      if (format === 'csv' && Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((d: any) =>
          Object.values(d)
            .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
            .join(',')
        );
        const csvContent = [headers, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
        return;
      }

      res.json({ reportType: type, count: data.length, data });
    } catch (err) { next(err); }
  }
}
