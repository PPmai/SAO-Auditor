/**
 * Google Search Console OAuth Endpoints
 * 
 * GET /api/gsc/auth - Start OAuth flow, redirect to Google
 * 
 * For production, you need:
 * 1. Create a Google Cloud Project
 * 2. Enable Search Console API
 * 3. Create OAuth 2.0 credentials
 * 4. Set up authorized redirect URIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, GSC_OAUTH_CONFIG } from '@/lib/modules/google-search-console';

export async function GET(request: NextRequest) {
  // Check if Google OAuth is configured
  if (!GSC_OAUTH_CONFIG.clientId || !GSC_OAUTH_CONFIG.clientSecret) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Google Search Console OAuth is not configured',
      setup: {
        instructions: [
          '1. Go to Google Cloud Console (https://console.cloud.google.com)',
          '2. Create a new project or select existing',
          '3. Enable "Search Console API"',
          '4. Go to APIs & Services > Credentials',
          '5. Create OAuth 2.0 Client ID (Web application)',
          '6. Add authorized redirect URI: http://localhost:3000/api/gsc/callback',
          '7. Copy Client ID and Client Secret'
        ],
        variables: [
          'GOOGLE_CLIENT_ID=your_client_id',
          'GOOGLE_CLIENT_SECRET=your_client_secret',
          'GOOGLE_REDIRECT_URI=http://localhost:3000/api/gsc/callback'
        ],
        documentation: 'https://developers.google.com/webmaster-tools/v1/api_reference_index',
        cost: 'FREE - Requires user to authenticate with their Google account'
      }
    }, { status: 200 });
  }

  // Generate state for CSRF protection
  const state = `sao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate OAuth URL
  const authUrl = getGoogleAuthUrl(state);
  
  // In production, you would store the state in session/cookie for verification
  
  // Redirect to Google OAuth
  return NextResponse.redirect(authUrl);
}


