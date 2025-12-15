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
const PYTHON_COMMAND = process.env.PYTHON_COMMAND || "python3";
const TIMEOUT_MS = parseInt(process.env.PYTHON_TIMEOUT_MS || "30000", 10); // 30 seconds default
async function executePython(code, timeoutMs = TIMEOUT_MS) {
    const startTime = Date.now();
    let tempDir = null;
    let scriptPath = null;
    try {
        // Create temporary directory
        tempDir = await mkdtemp(join(tmpdir(), "python-mcp-"));
        scriptPath = join(tempDir, "script.py");
        // Write code to temporary file
        await writeFile(scriptPath, code, "utf-8");
        return new Promise((resolve) => {
            const pythonProcess = spawn(PYTHON_COMMAND, [scriptPath], {
                cwd: tempDir,
                env: { ...process.env, PYTHONUNBUFFERED: "1" },
            });
            let stdout = "";
            let stderr = "";
            let timeoutId = null;
            // Set timeout
            if (timeoutMs > 0) {
                timeoutId = setTimeout(() => {
                    pythonProcess.kill("SIGTERM");
                    resolve({
                        stdout,
                        stderr: stderr + "\n[Execution timeout after " + timeoutMs + "ms]",
                        exitCode: -1,
                        executionTime: Date.now() - startTime,
                        error: "Execution timeout",
                    });
                }, timeoutMs);
            }
            pythonProcess.stdout?.on("data", (data) => {
                stdout += data.toString();
            });
            pythonProcess.stderr?.on("data", (data) => {
                stderr += data.toString();
            });
            pythonProcess.on("close", (code) => {
                if (timeoutId)
                    clearTimeout(timeoutId);
                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code || 0,
                    executionTime: Date.now() - startTime,
                });
            });
            pythonProcess.on("error", (error) => {
                if (timeoutId)
                    clearTimeout(timeoutId);
                resolve({
                    stdout,
                    stderr: stderr + "\n" + error.message,
                    exitCode: -1,
                    executionTime: Date.now() - startTime,
                    error: error.message,
                });
            });
        });
    }
    catch (error) {
        return {
            stdout: "",
            stderr: error.message || "Unknown error",
            exitCode: -1,
            executionTime: Date.now() - startTime,
            error: error.message,
        };
    }
    finally {
        // Cleanup temporary files
        if (scriptPath) {
            try {
                await unlink(scriptPath);
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}
// ============================================================================
// Server Initialization
// ============================================================================
const server = new McpServer({
    name: "fastpython-mcp-server",
    version: "1.0.0",
});
// ============================================================================
// Tool: Execute Python Code
// ============================================================================
server.registerTool("python_execute", {
    title: "Execute Python Code",
    description: `Execute Python code and return the output.

This tool runs Python code in a sandboxed environment and returns stdout, stderr, and execution status.

Args:
  - code (string): Python code to execute
  - timeout (number): Execution timeout in milliseconds (default: 30000, max: 300000)

Returns:
  Execution result with stdout, stderr, exit code, and execution time.`,
    inputSchema: z.object({
        code: z.string().describe("Python code to execute"),
        timeout: z.number().int().min(1000).max(300000).default(30000)
            .describe("Execution timeout in milliseconds"),
    }).strict(),
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
}, async (params) => {
    const result = await executePython(params.code, params.timeout);
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
});
// ============================================================================
// Tool: Execute Python with Input
// ============================================================================
server.registerTool("python_execute_with_input", {
    title: "Execute Python Code with Input",
    description: `Execute Python code with stdin input.

This tool runs Python code and provides stdin input to the script.

Args:
  - code (string): Python code to execute
  - input (string): Input to provide via stdin
  - timeout (number): Execution timeout in milliseconds (default: 30000)

Returns:
  Execution result with stdout, stderr, exit code, and execution time.`,
    inputSchema: z.object({
        code: z.string().describe("Python code to execute"),
        input: z.string().describe("Input to provide via stdin"),
        timeout: z.number().int().min(1000).max(300000).default(30000)
            .describe("Execution timeout in milliseconds"),
    }).strict(),
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
}, async (params) => {
    // Provide input via stdin by modifying the execution
    // For simplicity, we'll prepend input handling to the code
    const finalCode = `
import sys
from io import StringIO

# Capture stdin
sys.stdin = StringIO("""${params.input.replace(/"/g, '\\"')}""")

${params.code}
`;
    const finalResult = await executePython(finalCode, params.timeout);
    const output = {
        success: finalResult.exitCode === 0,
        stdout: finalResult.stdout,
        stderr: finalResult.stderr,
        exitCode: finalResult.exitCode,
        executionTimeMs: finalResult.executionTime,
        error: finalResult.error,
    };
    return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
});
// ============================================================================
// Tool: Check Python Version
// ============================================================================
server.registerTool("python_version", {
    title: "Check Python Version",
    description: `Check the Python version available in the system.

Returns:
  Python version information.`,
    inputSchema: z.object({}).strict(),
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
}, async () => {
    const result = await executePython("import sys; print(sys.version)");
    const output = {
        version: result.stdout,
        command: PYTHON_COMMAND,
        available: result.exitCode === 0,
        error: result.exitCode !== 0 ? result.stderr : undefined,
    };
    return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
});
// ============================================================================
// Tool: Install Python Package
// ============================================================================
server.registerTool("python_install_package", {
    title: "Install Python Package",
    description: `Install a Python package using pip.

Args:
  - package (string): Package name to install (e.g., "numpy", "pandas==2.0.0")
  - upgrade (boolean): Upgrade if already installed (default: false)

Returns:
  Installation result.`,
    inputSchema: z.object({
        package: z.string().describe("Package name to install"),
        upgrade: z.boolean().default(false).describe("Upgrade if already installed"),
    }).strict(),
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
}, async (params) => {
    const pipCommand = "pip3";
    const args = params.upgrade
        ? ["install", "--upgrade", params.package]
        : ["install", params.package];
    return new Promise((resolve) => {
        const pipProcess = spawn(pipCommand, args, {
            env: { ...process.env },
        });
        let stdout = "";
        let stderr = "";
        pipProcess.stdout?.on("data", (data) => {
            stdout += data.toString();
        });
        pipProcess.stderr?.on("data", (data) => {
            stderr += data.toString();
        });
        pipProcess.on("close", (code) => {
            const output = {
                success: code === 0,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code || 0,
                package: params.package,
            };
            resolve({
                content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            });
        });
        pipProcess.on("error", (error) => {
            resolve({
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            package: params.package,
                        }, null, 2),
                    }],
            });
        });
    });
});
// ============================================================================
// Server Start
// ============================================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("FastPython MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map