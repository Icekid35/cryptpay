import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    // Await params to comply with Next.js 15+ specifications if applicable
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const link = await db.getLink(id);
    
    if (!link) {
      return NextResponse.json({ success: false, error: 'Payment link not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error('Error fetching link details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
