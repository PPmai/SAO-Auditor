# FastPython MCP Server

A Model Context Protocol (MCP) server for executing Python code through AI assistants like Cursor.

## Features

This MCP server provides tools for Python code execution:

- **python_execute** - Execute Python code and get output
- **python_execute_with_input** - Execute Python code with stdin input
- **python_version** - Check Python version
- **python_install_package** - Install Python packages via pip

## Prerequisites

- Node.js 18+
- Python 3.x installed and available as `python3` (or set `PYTHON_COMMAND` env var)

## Installation

### Step 1: Install Dependencies

```bash
cd docs/fastpython-mcp-server
npm install
```

### Step 2: Build the Server

```bash
npm run build
```

### Step 3: Configure Cursor

Add to your Cursor MCP configuration file (see location in [Ahrefs MCP Guide](./AHREFS_MCP_GUIDE.md)):

```json
{
  "mcpServers": {
    "fastpython": {
      "command": "node",
      "args": ["/FULL/PATH/TO/fastpython-mcp-server/dist/index.js"],
      "env": {
        "PYTHON_COMMAND": "python3",
        "PYTHON_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

**Important**: Replace `/FULL/PATH/TO/` with the actual absolute path to your server directory.

### Step 4: Restart Cursor

After saving the configuration, restart Cursor to load the MCP server.

## Usage Examples

Once configured, you can ask Claude in Cursor:

```
"Execute this Python code: print('Hello, World!')"

"Run this Python script and show me the output:
import math
result = math.sqrt(144)
print(f'The square root of 144 is {result}')"

"Check what Python version is available"

"Install the pandas package and then use it to create a DataFrame"
```

## Available Tools

### 1. Execute Python Code

Execute Python code and get stdout, stderr, and exit code.

**Parameters:**
- `code` (string): Python code to execute
- `timeout` (number): Execution timeout in milliseconds (default: 30000, max: 300000)

**Example:**
```python
import json
data = {"name": "John", "age": 30}
print(json.dumps(data))
```

### 2. Execute Python with Input

Execute Python code with stdin input.

**Parameters:**
- `code` (string): Python code to execute
- `input` (string): Input to provide via stdin
- `timeout` (number): Execution timeout in milliseconds

**Example:**
```python
user_input = input()
print(f"You entered: {user_input}")
```

### 3. Check Python Version

Check the Python version available in the system.

**Parameters:** None

### 4. Install Python Package

Install a Python package using pip.

**Parameters:**
- `package` (string): Package name (e.g., "numpy", "pandas==2.0.0")
- `upgrade` (boolean): Upgrade if already installed (default: false)

## Environment Variables

- `PYTHON_COMMAND`: Python command to use (default: "python3")
- `PYTHON_TIMEOUT_MS`: Default timeout in milliseconds (default: 30000)

## Security Considerations

⚠️ **Warning**: This server executes arbitrary Python code. Use with caution:

- Code runs in a temporary directory that is cleaned up
- Timeout protection prevents infinite loops
- No network isolation (code can make network requests)
- No file system restrictions beyond temporary directory cleanup

For production use, consider:
- Running in a Docker container with restricted permissions
- Using a sandboxed Python environment
- Implementing additional security measures

## Troubleshooting

### Python not found

- Verify Python is installed: `python3 --version`
- Set `PYTHON_COMMAND` environment variable to your Python path
- On Windows, you may need to use `python` instead of `python3`

### Execution timeout

- Increase `PYTHON_TIMEOUT_MS` in environment variables
- Or specify `timeout` parameter in tool calls (max: 300000ms = 5 minutes)

### Package installation fails

- Ensure pip is available: `pip3 --version`
- Check package name is correct
- Some packages may require system dependencies

## License

MIT



