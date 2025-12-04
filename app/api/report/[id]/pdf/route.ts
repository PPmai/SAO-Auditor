import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scanId = params.id;
    
    // Get scan data
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        recommendations: true,
        competitors: true,
      },
    });
    
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }
    
    // Generate HTML report (simpler than react-pdf for server-side)
    const html = generateHTMLReport(scan);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="has-report-${scan.id}.html"`,
      },
    });
    
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateHTMLReport(scan: any) {
  const scoreColor = scan.totalScore >= 70 ? '#22c55e' : 
                    scan.totalScore >= 50 ? '#eab308' : '#ef4444';
  
  const recommendations = scan.recommendations || [];
  const competitors = scan.competitors || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HAS Scorecard Report - ${scan.url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .url { color: #94a3b8; font-size: 14px; word-break: break-all; }
    .date { color: #64748b; font-size: 12px; margin-top: 5px; }
    .score-circle { width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); margin: 30px auto; display: flex; align-items: center; justify-content: center; }
    .score-inner { width: 130px; height: 130px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; }
    .score-value { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
    .pillars { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 40px 0; }
    .pillar { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
    .pillar-name { font-size: 14px; color: #94a3b8; margin-bottom: 8px; }
    .pillar-score { font-size: 24px; font-weight: bold; color: white; }
    .pillar-bar { height: 6px; background: #334155; border-radius: 3px; margin-top: 10px; }
    .pillar-fill { height: 100%; background: #3b82f6; border-radius: 3px; }
    .section { margin: 40px 0; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 10px; }
    .recommendation { background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid; }
    .rec-high { border-left-color: #ef4444; }
    .rec-medium { border-left-color: #eab308; }
    .rec-low { border-left-color: #22c55e; }
    .rec-title { font-weight: 600; margin-bottom: 4px; }
    .rec-desc { font-size: 14px; color: #94a3b8; }
    .competitors { width: 100%; border-collapse: collapse; }
    .competitors th, .competitors td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
    .competitors th { color: #94a3b8; font-weight: 500; }
    .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
    @media print { body { background: white; color: #1e293b; } .pillar, .recommendation { background: #f8fafc; border-color: #e2e8f0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛠️ HAS Digital Scorecard</div>
      <div class="url">${scan.url}</div>
      <div class="date">Generated on ${new Date(scan.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    
    <div class="score-circle">
      <div class="score-inner">
        <div class="score-value">${scan.totalScore}</div>
      </div>
    </div>
    
    <div class="pillars">
      <div class="pillar">
        <div class="pillar-name">Content Structure</div>
        <div class="pillar-score">${scan.contentStructureScore}/30</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width: ${(scan.contentStructureScore / 30) * 100}%"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Brand Ranking</div>
        <div class="pillar-score">${scan.brandRankingScore}/30</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width: ${(scan.brandRankingScore / 30) * 100}%"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Keyword Visibility</div>
        <div class="pillar-score">${scan.keywordVisibilityScore}/20</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width: ${(scan.keywordVisibilityScore / 20) * 100}%"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">AI Trust</div>
        <div class="pillar-score">${scan.aiTrustScore}/20</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width: ${(scan.aiTrustScore / 20) * 100}%"></div></div>
      </div>
    </div>
    
    ${recommendations.length > 0 ? `
    <div class="section">
      <div class="section-title">📋 Recommendations</div>
      ${recommendations.map((rec: any) => `
        <div class="recommendation rec-${rec.priority.toLowerCase()}">
          <div class="rec-title">${rec.title}</div>
          <div class="rec-desc">${rec.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${competitors.length > 0 ? `
    <div class="section">
      <div class="section-title">📊 Competitor Comparison</div>
      <table class="competitors">
        <thead>
          <tr>
            <th>Website</th>
            <th>Total</th>
            <th>Content</th>
            <th>Brand</th>
            <th>Keywords</th>
            <th>Trust</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #3b82f620;">
            <td><strong>Your Site</strong></td>
            <td><strong>${scan.totalScore}</strong></td>
            <td>${scan.contentStructureScore}</td>
            <td>${scan.brandRankingScore}</td>
            <td>${scan.keywordVisibilityScore}</td>
            <td>${scan.aiTrustScore}</td>
          </tr>
          ${competitors.map((comp: any) => `
            <tr>
              <td>${comp.url}</td>
              <td>${comp.totalScore}</td>
              <td>${comp.contentStructureScore}</td>
              <td>${comp.brandRankingScore}</td>
              <td>${comp.keywordVisibilityScore}</td>
              <td>${comp.aiTrustScore}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Report generated by HAS Digital Scorecard</p>
      <p>© ${new Date().getFullYear()} Conductor. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

