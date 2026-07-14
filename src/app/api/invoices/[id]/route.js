import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const invoice = await db.getInvoice(id);
    
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    
    // Enrich with link info if present
    const link = await db.getLink(invoice.linkId);
    
    return NextResponse.json({ success: true, invoice, link });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
