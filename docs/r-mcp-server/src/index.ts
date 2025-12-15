import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// ============================================================================
// Configuration
// ============================================================================

const R_COMMAND = process.env.R_COMMAND || "Rscript";
const TIMEOUT_MS = parseInt(process.env.R_TIMEOUT_MS || "30000", 10); // 30 seconds default

// ============================================================================
// R Execution
// ============================================================================

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  error?: string;
}

async function executeR(
  code: string,
  timeoutMs: number = TIMEOUT_MS
): Promise<ExecutionResult> {
  const startTime = Date.now();
  let tempDir: string | null = null;
  let scriptPath: string | null = null;

  try {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), "r-mcp-"));
    scriptPath = join(tempDir, "script.R");

    // Write code to temporary file
    await writeFile(scriptPath, code, "utf-8");

    return new Promise((resolve) => {
      const rProcess = spawn(R_COMMAND, [scriptPath], {
        cwd: tempDir,
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          rProcess.kill("SIGTERM");
          resolve({
            stdout,
            stderr: stderr + "\n[Execution timeout after " + timeoutMs + "ms]",
            exitCode: -1,
            executionTime: Date.now() - startTime,
            error: "Execution timeout",
          });
        }, timeoutMs);
      }

      rProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      rProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      rProcess.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          executionTime: Date.now() - startTime,
        });
      });

      rProcess.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr: stderr + "\n" + error.message,
          exitCode: -1,
          executionTime: Date.now() - startTime,
          error: error.message,
        });
      });
    });
  } catch (error: any) {
    return {
      stdout: "",
      stderr: error.message || "Unknown error",
      exitCode: -1,
      executionTime: Date.now() - startTime,
      error: error.message,
    };
  } finally {
    // Cleanup temporary files
    if (scriptPath) {
      try {
        await unlink(scriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================================================
// Server Initialization
// ============================================================================

const server = new McpServer({
  name: "r-mcp-server",
  version: "1.0.0",
});

// ============================================================================
// Tool: Execute R Code
// ============================================================================

server.registerTool(
  "r_execute",
  {
    title: "Execute R Code",
    description: `Execute R code and return the output.

This tool runs R code using Rscript and returns stdout, stderr, and execution status.

Args:
  - code (string): R code to execute
  - timeout (number): Execution timeout in milliseconds (default: 30000, max: 300000)

Returns:
  Execution result with stdout, stderr, exit code, and execution time.`,
    inputSchema: z.object({
      code: z.string().describe("R code to execute"),
      timeout: z.number().int().min(1000).max(300000).default(30000)
        .describe("Execution timeout in milliseconds"),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    const result = await executeR(params.code, params.timeout);
    
    const output = {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTime,
      error: result.error,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Execute R with Data
// ============================================================================

server.registerTool(
  "r_execute_with_data",
  {
    title: "Execute R Code with Data",
    description: `Execute R code with CSV or JSON data input.

This tool runs R code and provides data as a variable.

Args:
  - code (string): R code to execute
  - data (string): CSV or JSON data (will be parsed and available as 'data' variable)
  - dataFormat (string): Format of input data - 'csv' or 'json' (default: 'csv')
  - timeout (number): Execution timeout in milliseconds (default: 30000)

Returns:
  Execution result with stdout, stderr, exit code, and execution time.`,
    inputSchema: z.object({
      code: z.string().describe("R code to execute"),
      data: z.string().describe("CSV or JSON data string"),
      dataFormat: z.enum(["csv", "json"]).default("csv")
        .describe("Format of input data"),
      timeout: z.number().int().min(1000).max(300000).default(30000)
        .describe("Execution timeout in milliseconds"),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    let dataCode = "";
    
    if (params.dataFormat === "csv") {
      dataCode = `
# Read CSV data
data_text <- "${params.data.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
data <- read.csv(text = data_text, stringsAsFactors = FALSE)
`;
    } else {
      dataCode = `
# Read JSON data
library(jsonlite)
data_text <- "${params.data.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
data <- fromJSON(data_text)
`;
    }

    const fullCode = `${dataCode}\n\n${params.code}`;
    const result = await executeR(fullCode, params.timeout);
    
    const output = {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTime,
      error: result.error,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Check R Version
// ============================================================================

server.registerTool(
  "r_version",
  {
    title: "Check R Version",
    description: `Check the R version available in the system.

Returns:
  R version information.`,
    inputSchema: z.object({}).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const result = await executeR("cat(R.version.string)");
    
    const output = {
      version: result.stdout,
      command: R_COMMAND,
      available: result.exitCode === 0,
      error: result.exitCode !== 0 ? result.stderr : undefined,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Install R Package
// ============================================================================

server.registerTool(
  "r_install_package",
  {
    title: "Install R Package",
    description: `Install an R package from CRAN.

Args:
  - package (string): Package name to install (e.g., "dplyr", "ggplot2")
  - repo (string): CRAN repository URL (default: "https://cloud.r-project.org")

Returns:
  Installation result.`,
    inputSchema: z.object({
      package: z.string().describe("Package name to install"),
      repo: z.string().default("https://cloud.r-project.org")
        .describe("CRAN repository URL"),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    const installCode = `
if (!require("${params.package}", quietly = TRUE)) {
  install.packages("${params.package}", repos = "${params.repo}")
  library("${params.package}")
} else {
  library("${params.package}")
}
cat("Package ${params.package} is available\\n")
`;

    const result = await executeR(installCode, 120000); // 2 minutes for package installation
    
    const output = {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      package: params.package,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

// ============================================================================
// Tool: Execute R Script File
// ============================================================================

server.registerTool(
  "r_execute_file",
  {
    title: "Execute R Script from File Path",
    description: `Execute an R script file from the filesystem.

Args:
  - filePath (string): Path to the R script file (.R)
  - timeout (number): Execution timeout in milliseconds (default: 30000)

Returns:
  Execution result with stdout, stderr, exit code, and execution time.`,
    inputSchema: z.object({
      filePath: z.string().describe("Path to R script file"),
      timeout: z.number().int().min(1000).max(300000).default(30000)
        .describe("Execution timeout in milliseconds"),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const rProcess = spawn(R_COMMAND, [params.filePath], {
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";
      let timeoutId: NodeJS.Timeout | null = null;

      if (params.timeout > 0) {
        timeoutId = setTimeout(() => {
          rProcess.kill("SIGTERM");
          resolve({
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                stdout,
                stderr: stderr + "\n[Execution timeout]",
                exitCode: -1,
                executionTimeMs: Date.now() - startTime,
                error: "Execution timeout",
              }, null, 2),
            }],
          });
        }, params.timeout);
      }

      rProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      rProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      rProcess.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        const output = {
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          executionTimeMs: Date.now() - startTime,
        };
        resolve({
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        });
      });

      rProcess.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              stdout,
              stderr: stderr + "\n" + error.message,
              exitCode: -1,
              executionTimeMs: Date.now() - startTime,
              error: error.message,
            }, null, 2),
          }],
        });
      });
    });
  }
);

// ============================================================================
// Server Start
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("R MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});



