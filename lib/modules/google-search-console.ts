/**
 * Google Search Console API Integration Module
 * 
 * Provides access to:
 * - Real keyword data for verified sites
 * - Clicks, impressions, CTR
 * - Average position per keyword
 * - Page performance data
 * 
 * API Documentation: https://developers.google.com/webmaster-tools/v1/api_reference_index
 * Cost: FREE (requires user OAuth authentication)
 * 
 * Note: This requires user to authenticate with their Google account
 * and grant access to their Search Console data.
 */

import axios from 'axios';

// For server-side usage (would need proper OAuth flow in production)
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const SEARCHCONSOLE_API_BASE = 'https://searchconsole.googleapis.com/v1';

export interface GSCKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: GSCKeyword[];
  topPages: GSCPage[];
  dateRange: {
    start: string;
    end: string;
  };
  error?: string;
}

/**
 * Get Search Console data using user's access token
 * 
 * In production, you would:
 * 1. Implement OAuth 2.0 flow for user to sign in with Google
 * 2. Request 'https://www.googleapis.com/auth/webmasters.readonly' scope
 * 3. Store and refresh the access token
 */
export async function getSearchConsoleData(
  siteUrl: string,
  accessToken: string,
  startDate?: string,
  endDate?: string
): Promise<GSCMetrics> {
  if (!accessToken) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: 0,
      topQueries: [],
      topPages: [],
      dateRange: { start: '', end: '' },
      error: 'Access token required',
    };
  }

  try {
    // Default to last 28 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Encode site URL
    const encodedSiteUrl = encodeURIComponent(siteUrl);

    console.log(`🔍 Fetching GSC data for: ${siteUrl}`);

    // Get search analytics data
    const response = await axios.post(
      `${SEARCHCONSOLE_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        startDate: start,
        endDate: end,
        dimensions: ['query'],
        rowLimit: 25,
        startRow: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const rows = response.data.rows || [];

    // Calculate totals
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalPosition = 0;

    const topQueries: GSCKeyword[] = rows.map((row: any) => {
      totalClicks += row.clicks || 0;
      totalImpressions += row.impressions || 0;
      totalPosition += (row.position || 0) * (row.impressions || 1);

      return {
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    });

    // Get top pages separately
    const pagesResponse = await axios.post(
      `${SEARCHCONSOLE_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        startDate: start,
        endDate: end,
        dimensions: ['page'],
        rowLimit: 10,
        startRow: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const topPages: GSCPage[] = (pagesResponse.data.rows || []).map((row: any) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    const averagePosition = totalImpressions > 0 ? totalPosition / totalImpressions : 0;
    const averageCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    console.log(`✅ GSC: ${totalClicks} clicks, ${topQueries.length} queries`);

    return {
      totalClicks,
      totalImpressions,
      averageCTR,
      averagePosition,
      topQueries,
      topPages,
      dateRange: { start, end },
    };

  } catch (error: any) {
    console.error('❌ GSC API error:', error.response?.data || error.message);
    
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: 0,
      topQueries: [],
      topPages: [],
      dateRange: { start: '', end: '' },
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Get list of sites the user has access to in Search Console
 */
export async function getSearchConsoleSites(accessToken: string): Promise<{
  sites: { siteUrl: string; permissionLevel: string }[];
  error?: string;
}> {
  if (!accessToken) {
    return { sites: [], error: 'Access token required' };
  }

  try {
    const response = await axios.get(
      `${SEARCHCONSOLE_API_BASE}/sites`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 10000,
      }
    );

    const sites = (response.data.siteEntry || []).map((site: any) => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel,
    }));

    return { sites };

  } catch (error: any) {
    return {
      sites: [],
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Convert GSC metrics to scoring components
 */
export function gscMetricsToScores(metrics: GSCMetrics): {
  keywordsScore: number;      // Max 6 points
  trafficScore: number;       // Max 5 points
  positionsScore: number;     // Max 5 points
  trendScore: number;         // Max 4 points (needs historical comparison)
} {
  // Keywords Score (6 points) - Based on number of ranking queries
  let keywordsScore = 0;
  const queryCount = metrics.topQueries.length;
  if (queryCount >= 100) keywordsScore = 6;
  else if (queryCount >= 50) keywordsScore = 4;
  else if (queryCount >= 20) keywordsScore = 2;
  else if (queryCount > 0) keywordsScore = 1;

  // Traffic Score (5 points) - Based on total clicks
  let trafficScore = 0;
  if (metrics.totalClicks >= 10000) trafficScore = 5;
  else if (metrics.totalClicks >= 5000) trafficScore = 4;
  else if (metrics.totalClicks >= 1000) trafficScore = 3;
  else if (metrics.totalClicks >= 100) trafficScore = 2;
  else if (metrics.totalClicks > 0) trafficScore = 1;

  // Positions Score (5 points) - Based on average position
  let positionsScore = 0;
  if (metrics.averagePosition > 0) {
    if (metrics.averagePosition <= 3) positionsScore = 5;
    else if (metrics.averagePosition <= 10) positionsScore = 3;
    else if (metrics.averagePosition <= 20) positionsScore = 1;
  }

  // Trend Score (4 points) - Would need historical data to compare
  // For now, give neutral score
  let trendScore = 2;

  return {
    keywordsScore,
    trafficScore,
    positionsScore,
    trendScore,
  };
}

/**
 * Configuration for OAuth flow
 * In production, these would be in environment variables
 */
export const GSC_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
};

/**
 * Generate OAuth URL for user to authenticate
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GSC_OAUTH_CONFIG.clientId,
    redirect_uri: GSC_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GSC_OAUTH_CONFIG.scope,
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  error?: string;
}> {
  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: GSC_OAUTH_CONFIG.clientId,
        client_secret: GSC_OAUTH_CONFIG.clientSecret,
        redirect_uri: GSC_OAUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };

  } catch (error: any) {
    return {
      accessToken: '',
      refreshToken: '',
      expiresIn: 0,
      error: error.response?.data?.error_description || error.message,
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  error?: string;
}> {
  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GSC_OAUTH_CONFIG.clientId,
        client_secret: GSC_OAUTH_CONFIG.clientSecret,
        grant_type: 'refresh_token',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };

  } catch (error: any) {
    return {
      accessToken: '',
      expiresIn: 0,
      error: error.response?.data?.error_description || error.message,
    };
  }
}

















