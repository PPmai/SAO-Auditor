import { NextRequest, NextResponse } from 'next/server';

interface ContactRequest {
  name: string;
  email: string;
  company: string;
  telephone: string;
  remark?: string;
  plan?: string;
  price?: string;
}

// In-memory storage for leads (replace with database in production)
const leads: ContactRequest[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, company, telephone, remark, plan, price } = body;

    // Validate required fields
    if (!name || !email || !company || !telephone) {
      return NextResponse.json(
        { error: 'Name, email, company, and telephone are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create lead object
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      company,
      telephone,
      remark: remark || '',
      plan: plan || 'Pro',
      price: price || '$399/month',
      createdAt: new Date().toISOString(),
    };

    // Store lead (in-memory for now, replace with Prisma in production)
    leads.push(lead);

    console.log('📧 New lead received:', {
      name,
      email,
      company,
      plan,
    });

    // In production, you would:
    // 1. Save to database using Prisma
    // 2. Send email notification to sales team
    // 3. Send confirmation email to lead

    // Example Prisma code (uncomment when database is connected):
    /*
    await prisma.lead.create({
      data: {
        name,
        email,
        company,
        telephone,
        remark: remark || '',
        plan: plan || 'PRO',
      },
    });
    */

    // Example email notification (requires nodemailer setup):
    /*
    await sendEmail({
      to: process.env.CONTACT_EMAIL,
      subject: `New SAO Auditor Lead: ${company}`,
      body: `
        New contact request:
        Name: ${name}
        Email: ${email}
        Company: ${company}
        Phone: ${telephone}
        Plan: ${plan} (${price})
        Remark: ${remark || 'None'}
      `,
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our team will contact you within 24 hours.',
      leadId: lead.id,
    });

  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve leads (admin only - add auth in production)
export async function GET(request: NextRequest) {
  // In production, verify admin authentication here
  
  return NextResponse.json({
    leads: leads.slice(-50), // Return last 50 leads
    total: leads.length,
  });
}

