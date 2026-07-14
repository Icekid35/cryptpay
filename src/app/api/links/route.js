import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchant = searchParams.get('merchant');
    
    let links;
    if (merchant) {
      links = await db.getMerchantLinks(merchant);
    } else {
      links = await db.getLinks();
    }
    
    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { merchantAddress, title, description, amount, token, network, fields, isSubscription, interval } = body;
    
    if (!merchantAddress || !title || !amount || !token || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const newLink = await db.createLink({
      merchantAddress,
      title,
      description: description || '',
      amount: parseFloat(amount),
      token,
      network,
      fields: fields || [],
      isSubscription: !!isSubscription,
      interval: interval || null
    });
    
    return NextResponse.json({ success: true, link: newLink }, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
