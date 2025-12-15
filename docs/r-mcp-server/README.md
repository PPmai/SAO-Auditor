# R MCP Server

A Model Context Protocol (MCP) server for executing R code through AI assistants like Cursor.

## Features

This MCP server provides tools for R code execution:

- **r_execute** - Execute R code and get output
- **r_execute_with_data** - Execute R code with CSV or JSON data input
- **r_version** - Check R version
- **r_install_package** - Install R packages from CRAN
- **r_execute_file** - Execute R script from file path

## Prerequisites

- Node.js 18+
- R installed and available as `Rscript` (or set `R_COMMAND` env var)

### Installing R

**macOS:**
```bash
brew install r
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install r-base
```

**Windows:**
Download and install from [CRAN](https://cran.r-project.org/bin/windows/base/)

## Installation

### Step 1: Install Dependencies

```bash
cd docs/r-mcp-server
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
    "r": {
      "command": "node",
      "args": ["/FULL/PATH/TO/r-mcp-server/dist/index.js"],
      "env": {
        "R_COMMAND": "Rscript",
        "R_TIMEOUT_MS": "30000"
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
"Execute this R code: print('Hello, World!')"

"Run this R script:
x <- 1:10
mean(x)
sd(x)"

"Check what R version is available"

"Install the dplyr package and use it to filter data"

"Analyze this CSV data with R:
name,age,score
John,25,85
Jane,30,92
Bob,28,78"
```

## Available Tools

### 1. Execute R Code

Execute R code and get stdout, stderr, and exit code.

**Parameters:**
- `code` (string): R code to execute
- `timeout` (number): Execution timeout in milliseconds (default: 30000, max: 300000)

**Example:**
```r
x <- 1:100
summary(x)
cat("Mean:", mean(x), "\n")
cat("SD:", sd(x), "\n")
```

### 2. Execute R with Data

Execute R code with CSV or JSON data input.

**Parameters:**
- `code` (string): R code to execute
- `data` (string): CSV or JSON data string
- `dataFormat` (string): "csv" or "json" (default: "csv")
- `timeout` (number): Execution timeout in milliseconds

**Example:**
```r
# Data is available as 'data' variable
head(data)
summary(data)
```

### 3. Check R Version

Check the R version available in the system.

**Parameters:** None

### 4. Install R Package

Install an R package from CRAN.

**Parameters:**
- `package` (string): Package name (e.g., "dplyr", "ggplot2")
- `repo` (string): CRAN repository URL (default: "https://cloud.r-project.org")

### 5. Execute R Script File

Execute an R script from a file path.

**Parameters:**
- `filePath` (string): Path to R script file (.R)
- `timeout` (number): Execution timeout in milliseconds

## Environment Variables

- `R_COMMAND`: R command to use (default: "Rscript")
- `R_TIMEOUT_MS`: Default timeout in milliseconds (default: 30000)

## Common R Packages

Popular packages you might want to install:

- **dplyr** - Data manipulation
- **ggplot2** - Data visualization
- **tidyr** - Data tidying
- **readr** - Reading data files
- **jsonlite** - JSON handling
- **lubridate** - Date/time handling
- **stringr** - String manipulation

## Security Considerations

⚠️ **Warning**: This server executes arbitrary R code. Use with caution:

- Code runs in a temporary directory that is cleaned up
- Timeout protection prevents infinite loops
- No network isolation (code can make network requests)
- No file system restrictions beyond temporary directory cleanup

For production use, consider:
- Running in a Docker container with restricted permissions
- Using a sandboxed R environment
- Implementing additional security measures

## Troubleshooting

### R not found

- Verify R is installed: `Rscript --version`
- Set `R_COMMAND` environment variable to your Rscript path
- On Windows, ensure R is in your PATH

### Execution timeout

- Increase `R_TIMEOUT_MS` in environment variables
- Or specify `timeout` parameter in tool calls (max: 300000ms = 5 minutes)

### Package installation fails

- Ensure internet connection is available
- Check CRAN repository URL is accessible
- Some packages may require system dependencies (e.g., `libcurl`, `libxml2`)

### JSON data not working

- Install `jsonlite` package first: `r_install_package` with package "jsonlite"
- Ensure JSON string is properly formatted

## Example: Data Analysis Workflow

```r
# Install required packages
install.packages(c("dplyr", "ggplot2"), repos = "https://cloud.r-project.org")

# Load libraries
library(dplyr)
library(ggplot2)

# Create sample data
data <- data.frame(
  x = 1:100,
  y = rnorm(100, mean = 50, sd = 10)
)

# Analyze
summary(data)
cor(data$x, data$y)

# Visualize
plot(data$x, data$y)
```

## License

MIT



