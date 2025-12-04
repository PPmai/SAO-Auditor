import axios from 'axios';

export interface PageSpeedResult {
  url: string;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  lcp: number;
  fid: number;
  cls: number;
  lcpCategory: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  fidCategory: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  clsCategory: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  mobileScore: number;
  error?: string;
  isEstimate?: boolean;
}

export async function analyzePageSpeed(url: string): Promise<PageSpeedResult> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || '';
    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    
    // Run mobile analysis
    const mobileResponse = await axios.get(apiUrl, {
      params: {
        url,
        key: apiKey || undefined, // Only include key if provided
        strategy: 'mobile',
        category: ['performance', 'accessibility', 'best-practices', 'seo']
      },
      timeout: 60000 // Increased timeout for slow connections
    });
    
    const mobileData = mobileResponse.data;
    const lighthouse = mobileData.lighthouseResult;
    const categories = lighthouse.categories;
    
    // Extract Core Web Vitals
    const audits = lighthouse.audits;
    
    // LCP (Largest Contentful Paint)
    const lcpValue = audits['largest-contentful-paint']?.numericValue || 0;
    const lcp = lcpValue / 1000; // Convert to seconds
    const lcpCategory = lcp <= 2.5 ? 'GOOD' : lcp <= 4 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    
    // FID (First Input Delay) - approximated by TBT (Total Blocking Time)
    const tbtValue = audits['total-blocking-time']?.numericValue || 0;
    const fid = tbtValue; // in milliseconds
    const fidCategory = fid <= 100 ? 'GOOD' : fid <= 300 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    
    // CLS (Cumulative Layout Shift)
    const clsValue = audits['cumulative-layout-shift']?.numericValue || 0;
    const cls = clsValue;
    const clsCategory = cls <= 0.1 ? 'GOOD' : cls <= 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    
    return {
      url,
      performanceScore: Math.round((categories.performance?.score || 0) * 100),
      accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
      seoScore: Math.round((categories.seo?.score || 0) * 100),
      bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
      lcp,
      fid,
      cls,
      lcpCategory,
      fidCategory,
      clsCategory,
      mobileScore: Math.round((categories.performance?.score || 0) * 100),
      isEstimate: false
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.error?.code;
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    // Log the specific error
    if (errorCode === 429) {
      console.warn('⚠️ PageSpeed API rate limit reached. Using estimated scores.');
    } else {
      console.error('PageSpeed API Error:', errorMessage);
    }
    
    // Return estimated fallback values when API fails
    // These are conservative middle-range estimates
    return {
      url,
      performanceScore: 50,
      accessibilityScore: 70,
      seoScore: 70,
      bestPracticesScore: 60,
      lcp: 3.0,
      fid: 150,
      cls: 0.15,
      lcpCategory: 'NEEDS_IMPROVEMENT',
      fidCategory: 'NEEDS_IMPROVEMENT',
      clsCategory: 'NEEDS_IMPROVEMENT',
      mobileScore: 50,
      error: errorCode === 429 ? 'Rate limit reached - using estimates' : errorMessage,
      isEstimate: true
    };
  }
}

