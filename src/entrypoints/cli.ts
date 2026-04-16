import { createContextCollapser } from "../memory/contextCollapse.js";
import { createProjectKnowledgeStore } from "../state/projectKnowledgeStore.js";
import { getAllTools } from "../tools/tools.js";

interface RefactorOptions {
  mode: "analyze" | "refactor";
  projectRoot: string;
  constraints: string[];
}

export async function startRefactorMode(options: Partial<RefactorOptions> = {}) {
  const store = createProjectKnowledgeStore();
  const collapser = createContextCollapser();

  if (options.constraints?.length) {
    store.updateConstraints(options.constraints);
    store.addFact("initialized", new Date().toISOString());
  }

  const tools = getAllTools();

  console.log("🔧 Refactor Harness started");
  console.log(`   Mode: ${options.mode ?? "analyze"}`);
  console.log(`   Project root: ${options.projectRoot ?? process.cwd()}`);
  console.log(`   Tools available: ${tools.length}`);
  console.log(`   Constraints: ${store.getSessionContext().constraints.join(", ") || "none"}`);

  return {
    store,
    collapser,
    tools,
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const mode = (args.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "analyze") as
    | "analyze"
    | "refactor";
  const projectRoot = args.find((a) => a.startsWith("--root="))?.split("=")[1] ?? process.cwd();
  const constraints = args.filter((a) => a.startsWith("--constraint=")).map((a) => a.split("=")[1]);

  startRefactorMode({ mode, projectRoot, constraints });
}
