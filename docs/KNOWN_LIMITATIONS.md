# ProcureFlow — Known Technical Limitations & Design Decisions

In accordance with academic standards and Section 21 of the specification, the known architectural boundaries and real limitations are documented below:

1. **SQLite Database Concurrency**:
   - SQLite is used as the zero-dependency local database engine. While ideal for capstone demonstrations and rapid local execution without cloud costs, SQLite locks the entire database file during write transactions. High-concurrency enterprise workloads would require migrating to PostgreSQL with row-level locking.

2. **ML Cold-Start Period**:
   - The machine learning regression selector requires at least 5 empirical test execution observations to train. During initial startup, the readiness score is low (< 0.35) and the selector safely defaults to `FULL` regression execution. This is an intentional safety feature, not an architectural flaw.

3. **Git History Depth**:
   - When running on a freshly cloned shallow repository with fewer than 2 commits, Git diff inspection gracefully falls back to inspected database commit records.

4. **PDF Report Export**:
   - Dedicated server-side PDF rasterization engines (such as Puppeteer/Chromium server rendering) were avoided to prevent heavy cloud binary overhead on local development environments. Downloadable export is provided via CSV format, with browser native print formatting (Ctrl + P) for PDF generation.
