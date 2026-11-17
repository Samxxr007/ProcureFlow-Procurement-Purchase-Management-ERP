import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { FileSpreadsheet, Download, ShieldCheck, Bug, Terminal, FileText, CheckCircle2 } from 'lucide-react';

export const QualityReports: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (reportType: string) => {
    setDownloading(reportType);
    window.location.href = `/api/qa/reports/${reportType}?format=csv`;
    setTimeout(() => setDownloading(null), 1500);
  };

  const reportCards = [
    {
      id: 'defects',
      title: 'Defect Summary & Regression Breach Report',
      description: 'Comprehensive CSV log of functional defects, unauthorized escalation attempts, and state integrity violations.',
      icon: Bug,
      badge: 'Defects Log',
    },
    {
      id: 'test-runs',
      title: 'Platform Test Execution Audit Report',
      description: 'Detailed execution records across all test runs including execution modes, runtime duration, and pass/fail ratios.',
      icon: ShieldCheck,
      badge: 'Executions',
    },
    {
      id: 'scenarios',
      title: 'Stateful Authorization Oracle Evaluation Report',
      description: 'Step-by-step evaluation results of the 15 multi-role authorization scenarios with HTTP codes and database assertions.',
      icon: Terminal,
      badge: 'Oracles',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Lab Reports & Analytics Export"
        subtitle="Generate and download exportable compliance and testing reports formatted for academic capstone presentation and operational auditing."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportCards.map((rep) => {
          const Icon = rep.icon;
          const isDownloading = downloading === rep.id;

          return (
            <div
              key={rep.id}
              className="bg-white border border-[#E0E5DF] rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-[#426B53]/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded bg-[#EAF1EB] text-[#426B53] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#426B53] bg-[#EAF1EB] px-2 py-0.5 rounded">
                    {rep.badge}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-[#252D28] mb-1.5">{rep.title}</h2>
                <p className="text-xs text-[#727D75] leading-relaxed mb-6">{rep.description}</p>
              </div>

              <button
                onClick={() => handleDownload(rep.id)}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#426B53] hover:bg-[#31523F] text-white rounded text-xs font-medium transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Exporting CSV...' : 'Download Report (.CSV)'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Compliance / Academic Presentation Note */}
      <div className="p-4 bg-white border border-[#E0E5DF] rounded-lg shadow-sm text-xs space-y-2">
        <div className="flex items-center gap-2 font-mono font-bold text-[#252D28]">
          <CheckCircle2 className="w-4 h-4 text-[#397754]" />
          <span>Capstone Viva Demonstration Readiness</span>
        </div>
        <p className="text-[#727D75] leading-relaxed">
          All reports export actual empirical data persisted in the SQLite platform database. Data includes genuine execution times, real Git change metrics, and unsimulated oracle results. To export print-ready PDF summaries, use browser print preview (Ctrl + P) on any Quality Lab analytics page.
        </p>
      </div>
    </div>
  );
};
