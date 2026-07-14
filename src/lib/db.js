import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first. This prevents local connection timeouts 
// caused by NAT64/IPv6 translation issues on some network configurations.
if (typeof window === 'undefined' && dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const useSupabase = !!(supabaseUrl && supabaseAnonKey);
const supabase = useSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

// JSON Local Fallback Helpers
const DB_FILE = path.join(process.cwd(), 'db.json');

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      links: [],
      payments: [],
      invoices: [],
      subscriptions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { links: [], payments: [], invoices: [], subscriptions: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// Database CRUD Export
export const db = {
  // --- Payment Links ---
  getLinks: async () => {
    if (useSupabase) {
      const { data, error } = await supabase.from('links').select('*');
      if (!error) return data || [];
      console.error('Supabase error fetching links:', error);
    }
    return readDb().links;
  },

  getLink: async (id) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('links').select('*').eq('id', id).maybeSingle();
      if (!error) return data;
      console.error(`Supabase error fetching link ${id}:`, error);
    }
    return readDb().links.find(link => link.id === id);
  },

  getMerchantLinks: async (merchantAddress) => {
    const address = merchantAddress.toLowerCase();
    if (useSupabase) {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .ilike('merchantAddress', address);
      if (!error) return data || [];
      console.error(`Supabase error fetching merchant links for ${address}:`, error);
    }
    return readDb().links.filter(link => link.merchantAddress.toLowerCase() === address);
  },

  createLink: async (linkData) => {
    const newLink = {
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      active: true,
      ...linkData
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('links')
        .insert([newLink])
        .select()
        .single();
      if (!error) return data;
      console.error('Supabase error creating link:', error);
    }

    const data = readDb();
    data.links.push(newLink);
    writeDb(data);
    return newLink;
  },

  updateLink: async (id, updateData) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('links')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (!error) return data;
      console.error(`Supabase error updating link ${id}:`, error);
    }

    const data = readDb();
    const index = data.links.findIndex(link => link.id === id);
    if (index !== -1) {
      data.links[index] = { ...data.links[index], ...updateData };
      writeDb(data);
      return data.links[index];
    }
    return null;
  },

  // --- Payments ---
  getPayments: async () => {
    if (useSupabase) {
      const { data, error } = await supabase.from('payments').select('*');
      if (!error) return data || [];
      console.error('Supabase error fetching payments:', error);
    }
    return readDb().payments;
  },

  getPayment: async (id) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
      if (!error) return data;
      console.error(`Supabase error fetching payment ${id}:`, error);
    }
    return readDb().payments.find(p => p.id === id);
  },

  getLinkPayments: async (linkId) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('payments').select('*').eq('linkId', linkId);
      if (!error) return data || [];
      console.error(`Supabase error fetching payments for link ${linkId}:`, error);
    }
    return readDb().payments.filter(p => p.linkId === linkId);
  },

  getMerchantPayments: async (merchantAddress) => {
    const address = merchantAddress.toLowerCase();
    if (useSupabase) {
      // Find all payments that belong to links created by this merchant, or explicitly have merchantAddress
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('merchantAddress', address);
      if (!error) return data || [];
      console.error(`Supabase error fetching payments for merchant ${address}:`, error);
    }

    const data = readDb();
    const merchantLinks = new Set(data.links.filter(l => l.merchantAddress.toLowerCase() === address).map(l => l.id));
    return data.payments.filter(p => merchantLinks.has(p.linkId) || (p.merchantAddress && p.merchantAddress.toLowerCase() === address));
  },

  createPayment: async (paymentData) => {
    const newPayment = {
      id: 'pay_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      ...paymentData
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('payments')
        .insert([newPayment])
        .select()
        .single();
      if (!error) return data;
      console.error('Supabase error creating payment:', error);
    }

    const data = readDb();
    data.payments.push(newPayment);
    writeDb(data);
    return newPayment;
  },

  // --- Invoices ---
  getInvoices: async () => {
    if (useSupabase) {
      const { data, error } = await supabase.from('invoices').select('*');
      if (!error) return data || [];
      console.error('Supabase error fetching invoices:', error);
    }
    return readDb().invoices;
  },

  getInvoice: async (id) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (!error) return data;
      console.error(`Supabase error fetching invoice ${id}:`, error);
    }
    return readDb().invoices.find(inv => inv.id === id);
  },

  getLinkInvoices: async (linkId) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('invoices').select('*').eq('linkId', linkId);
      if (!error) return data || [];
      console.error(`Supabase error fetching invoices for link ${linkId}:`, error);
    }
    return readDb().invoices.filter(inv => inv.linkId === linkId);
  },

  createInvoice: async (invoiceData) => {
    const newInvoice = {
      id: 'inv_' + Math.random().toString(36).substring(2, 11),
      invoiceNumber: 'CP-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      ...invoiceData
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();
      if (!error) return data;
      console.error('Supabase error creating invoice:', error);
    }

    const data = readDb();
    data.invoices.push(newInvoice);
    writeDb(data);
    return newInvoice;
  },

  // --- Subscriptions ---
  getSubscriptions: async () => {
    if (useSupabase) {
      const { data, error } = await supabase.from('subscriptions').select('*');
      if (!error) return data || [];
      console.error('Supabase error fetching subscriptions:', error);
    }
    return readDb().subscriptions;
  },

  getSubscription: async (id) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).maybeSingle();
      if (!error) return data;
      console.error(`Supabase error fetching subscription ${id}:`, error);
    }
    return readDb().subscriptions.find(sub => sub.id === id);
  },

  getMerchantSubscriptions: async (merchantAddress) => {
    const address = merchantAddress.toLowerCase();
    if (useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .ilike('merchantAddress', address);
      if (!error) return data || [];
      console.error(`Supabase error fetching merchant subscriptions for ${address}:`, error);
    }
    return readDb().subscriptions.filter(sub => sub.merchantAddress.toLowerCase() === address);
  },

  getSubscriberSubscriptions: async (subscriberAddress) => {
    const address = subscriberAddress.toLowerCase();
    if (useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .ilike('subscriberAddress', address);
      if (!error) return data || [];
      console.error(`Supabase error fetching subscriber subscriptions for ${address}:`, error);
    }
    return readDb().subscriptions.filter(sub => sub.subscriberAddress.toLowerCase() === address);
  },

  createSubscription: async (subData) => {
    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      status: 'active',
      ...subData
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([newSub])
        .select()
        .single();
      if (!error) return data;
      console.error('Supabase error creating subscription:', error);
    }

    const data = readDb();
    data.subscriptions.push(newSub);
    writeDb(data);
    return newSub;
  },

  updateSubscription: async (id, updateData) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (!error) return data;
      console.error(`Supabase error updating subscription ${id}:`, error);
    }

    const data = readDb();
    const index = data.subscriptions.findIndex(sub => sub.id === id);
    if (index !== -1) {
      data.subscriptions[index] = { ...data.subscriptions[index], ...updateData };
      writeDb(data);
      return data.subscriptions[index];
    }
    return null;
  }
};
