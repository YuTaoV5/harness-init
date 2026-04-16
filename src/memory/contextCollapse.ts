import type { ChangeRecord } from "../state/projectKnowledgeStore.js";

export interface CollapseOptions {
  maxRecords?: number;
  maxFilesSummary?: number;
}

export function createContextCollapser(options: CollapseOptions = {}) {
  const { maxRecords = 10, maxFilesSummary = 20 } = options;

  function collapseHistory(records: ChangeRecord[]): ChangeRecord[] {
    if (records.length <= maxRecords) {
      return records;
    }

    const recent = records.slice(0, maxRecords);
    const older = records.slice(maxRecords);

    const collapsedSummary: ChangeRecord = {
      file: "[collapsed]",
      before: `${older.length} older changes summarized`,
      after: generateSummaryText(older),
      timestamp: older[0]?.timestamp ?? Date.now(),
    };

    return [...recent, collapsedSummary];
  }

  function generateSummaryText(records: ChangeRecord[]): string {
    const files = new Set(records.map((r) => r.file));
    return `Summarized ${records.length} changes across ${files.size} files`;
  }

  function generateSummary(data: {
    filesProcessed: number;
    constraints: string[];
    recentChanges: string[];
  }): string {
    const parts: string[] = [];

    parts.push(`Processed ${data.filesProcessed} files`);

    if (data.constraints.length > 0) {
      parts.push(`Constraints: ${data.constraints.join(", ")}`);
    }

    if (data.recentChanges.length > 0) {
      const shown = data.recentChanges.slice(0, 3);
      parts.push(`Recent: ${shown.join("; ")}`);
      if (data.recentChanges.length > 3) {
        parts.push(`...and ${data.recentChanges.length - 3} more`);
      }
    }

    return parts.join(" | ");
  }

  return {
    collapseHistory,
    generateSummary,
    maxRecords,
    maxFilesSummary,
  };
}
