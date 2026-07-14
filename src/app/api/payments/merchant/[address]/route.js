import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { address } = resolvedParams;
    
    if (!address) {
      return NextResponse.json({ success: false, error: 'Merchant address is required' }, { status: 400 });
    }
    
    const payments = await db.getMerchantPayments(address);
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching merchant payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
