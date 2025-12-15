/**
 * Google Search Console OAuth Callback
 * 
 * GET /api/gsc/callback - Handle OAuth callback from Google
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getSearchConsoleSites } from '@/lib/modules/google-search-console';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle error from Google
  if (error) {
    console.error('GSC OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // No code received
  if (!code) {
    return NextResponse.json({
      status: 'error',
      message: 'No authorization code received'
    }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResult = await exchangeCodeForToken(code);

    if (tokenResult.error) {
      console.error('Token exchange error:', tokenResult.error);
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(tokenResult.error)}`, request.url)
      );
    }

    // Get list of verified sites
    const sitesResult = await getSearchConsoleSites(tokenResult.accessToken);

    console.log('✅ GSC OAuth successful');
    console.log(`📊 Sites available: ${sitesResult.sites.length}`);

    // In production, you would:
    // 1. Store tokens securely (encrypted in database)
    // 2. Associate with user account
    // 3. Set up token refresh mechanism

    // For now, redirect with success message
    // In real implementation, you'd store the tokens and redirect to dashboard
    return NextResponse.json({
      status: 'success',
      message: 'Google Search Console connected successfully!',
      accessToken: tokenResult.accessToken.substring(0, 20) + '...', // Partial for security
      refreshToken: tokenResult.refreshToken ? 'Received' : 'None',
      expiresIn: tokenResult.expiresIn,
      sites: sitesResult.sites,
      note: 'In production, tokens would be stored securely in the database.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('GSC callback error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to complete OAuth flow',
      error: error.message
    }, { status: 500 });
  }
}
















