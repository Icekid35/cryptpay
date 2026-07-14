import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchant = searchParams.get('merchant');
    const subscriber = searchParams.get('subscriber');
    
    let subs;
    if (merchant) {
      subs = await db.getMerchantSubscriptions(merchant);
    } else if (subscriber) {
      subs = await db.getSubscriberSubscriptions(subscriber);
    } else {
      subs = await db.getSubscriptions();
    }
    
    return NextResponse.json({ success: true, subscriptions: subs });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { merchantAddress, subscriberAddress, amount, token, network, interval, planName } = body;
    
    if (!merchantAddress || !subscriberAddress || !amount || !token || !network || !interval || !planName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Calculate next billing date (based on interval in days)
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + parseInt(interval));
    
    const newSub = await db.createSubscription({
      merchantAddress,
      subscriberAddress,
      amount: parseFloat(amount),
      token,
      network,
      interval: parseInt(interval), // in days
      planName,
      nextBillingDate: nextBilling.toISOString(),
      lastCharged: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, subscription: newSub }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
