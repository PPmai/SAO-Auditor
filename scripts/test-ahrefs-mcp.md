# Test Ahrefs MCP with theconductor.co

## Instructions for Cursor AI

Copy and paste these prompts to test Ahrefs MCP:

### Test 1: Get Organic Keywords
```
Use Ahrefs MCP to get organic keywords for theconductor.co. 
Query with:
- target: theconductor.co
- mode: domain  
- country: us
- date: 2024-12-04 (or yesterday's date)
- select: keyword,best_position,sum_traffic,is_informational,is_commercial,is_transactional,is_navigational
- limit: 20

Show me the results and convert them to the format used in lib/modules/ahrefs.ts
```

### Test 2: Get Domain Rating
```
Use Ahrefs MCP to get domain rating for theconductor.co.
Query with:
- target: theconductor.co
- date: 2024-12-04 (or yesterday's date)

Show me the domain rating value.
```

### Test 3: Get Backlinks Stats
```
Use Ahrefs MCP to get backlink statistics for theconductor.co.
Query with:
- target: theconductor.co
- mode: domain
- date: 2024-12-04 (or yesterday's date)

Show me the backlinks count, referring domains, and domain rating.
```

### Test 4: Get Site Metrics
```
Use Ahrefs MCP to get comprehensive site metrics for theconductor.co.
Query with:
- target: theconductor.co
- mode: domain
- date: 2024-12-04 (or yesterday's date)

Show me the key metrics.
```

## Expected Results

If MCP is working correctly, you should see:
- ✅ Organic keywords with positions and traffic
- ✅ Domain Rating (DR) value
- ✅ Backlinks and referring domains count
- ✅ Search intent breakdown (informational, commercial, etc.)

## If You Get 401 Errors

1. Check MCP server configuration
2. Verify AHREFS_API_KEY is set in MCP server environment
3. Make sure your Ahrefs plan supports API v3
4. Try with test domains first (ahrefs.com, wordcount.com)

## Next Steps

Once MCP is working:
1. Use it for development and testing
2. For production, use direct API calls or alternative APIs
3. Consider creating a data export script that uses MCP




