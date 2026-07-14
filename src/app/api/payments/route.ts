import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const payments = await db.getPayments();
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { linkId, txHash, senderAddress, merchantAddress, amount, token, network, customerEmail, customerName, customFields } = body;
    
    if (!linkId || !txHash || !senderAddress || !amount || !token || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const newPayment = await db.createPayment({
      linkId,
      txHash,
      senderAddress,
      merchantAddress,
      amount: parseFloat(amount),
      token,
      network,
      customerEmail: customerEmail || '',
      customerName: customerName || '',
      customFields: customFields || {}
    });
    
    // Also, if this payment includes email/billing details, automatically create an invoice
    const newInvoice = await db.createInvoice({
      id: newPayment.id.replace('pay_', 'inv_'),
      linkId,
      paymentId: newPayment.id,
      customerName: customerName || 'Anonymous Customer',
      customerEmail: customerEmail || '',
      items: [
        {
          description: 'Payment via CryptPay link',
          amount: parseFloat(amount),
          token,
          network
        }
      ],
      txHash,
      merchantAddress,
      status: 'paid'
    });
    
    return NextResponse.json({ success: true, payment: newPayment, invoiceId: newInvoice.id }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
