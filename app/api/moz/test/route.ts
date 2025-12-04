import { NextRequest, NextResponse } from 'next/server';
import { testMozConnection, isMozConfigured, getMozMetrics, MozMetrics } from '@/lib/modules/moz';

/**
 * Test Moz API connection
 * GET /api/moz/test - Check if Moz API is configured and working
 * GET /api/moz/test?url=example.com - Test with a specific URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url');

  try {
    // Check configuration
    const configured = isMozConfigured();

    if (!configured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Moz API not configured. Add MOZ_API_TOKEN to your .env file.',
        instructions: [
          '1. Sign up at https://moz.com/products/api',
          '2. Create an API token in your dashboard',
          '3. Add to .env: MOZ_API_TOKEN=your_token_here',
          '4. Restart the server'
        ]
      });
    }

    // If URL provided, test with that URL
    if (testUrl) {
      const metrics = await getMozMetrics(testUrl);
      
      return NextResponse.json({
        success: !metrics.error,
        configured: true,
        url: testUrl,
        metrics: {
          domainAuthority: metrics.domainAuthority,
          pageAuthority: metrics.pageAuthority,
          spamScore: metrics.spamScore,
          linkingDomains: metrics.linkingDomains,
          inboundLinks: metrics.inboundLinks
        },
        error: metrics.error || null
      });
    }

    // Default: Test connection with moz.com
    const testResult = await testMozConnection();

    return NextResponse.json({
      success: testResult.success,
      configured: true,
      message: testResult.message,
      sampleData: testResult.sampleData || null
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      configured: isMozConfigured(),
      error: error.message
    }, { status: 500 });
  }
}

