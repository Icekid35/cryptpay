'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CreditCard, Download, ArrowLeft, Printer, ShieldCheck, 
  RefreshCw, CheckCircle, Mail, User, Calendar, FileText
} from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [invoice, setInvoice] = useState(null);
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();
        if (data.success) {
          setInvoice(data.invoice);
          setLink(data.link);
        } else {
          setError(data.error || 'Invoice not found');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="no-print" style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
          <div className="nav-container">
            <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '6px' }}></div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="skeleton" style={{ width: '120px', height: '32px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '180px' }}></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="skeleton" style={{ width: '100px', height: '36px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="skeleton skeleton-text" style={{ width: '30%', marginLeft: 'auto' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '60%', marginLeft: 'auto' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '45%', marginLeft: 'auto' }}></div>
              </div>
            </div>
            <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="skeleton" style={{ width: '300px', height: '80px', borderRadius: '8px' }}></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <FileText size={48} color="var(--error)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Invoice Error</h2>
          <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>{error || 'Could not find invoice record'}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ width: '100%' }}>
            <ArrowLeft size={16} /> Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="invoice-page-container">
      {/* Navbar - hidden on print */}
      <header className="no-print" style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <div className="nav-container">
          <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem' }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Invoice Section */}
      <main style={{ flex: 1, padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="invoice-container glass-card" style={{ maxWidth: '800px', width: '100%', padding: '3rem', background: 'var(--bg-card)' }}>
          
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                <CreditCard size={28} color="var(--accent-primary)" />
                <span>cryptpay</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decentralized Invoice Platform</p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Invoice</h2>
              <p style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                {invoice.invoiceNumber}
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                  <ShieldCheck size={14} style={{ marginRight: '0.25rem' }} /> Paid on-chain
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Info Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Merchant Details
              </h4>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Recipient Wallet:</p>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                {invoice.merchantAddress}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Bill To
              </h4>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                {invoice.customerName || 'Anonymous Customer'}
              </p>
              {invoice.customerEmail && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {invoice.customerEmail}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                <Calendar size={14} /> <span>Issued: {new Date(invoice.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container" style={{ marginBottom: '2.5rem' }}>
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Network</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description}</td>
                    <td style={{ textAlign: 'right' }}>{item.network}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.amount} {item.token}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{invoice.items[0]?.amount} {invoice.items[0]?.token}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fee / Taxes</span>
                <span style={{ fontWeight: 600 }}>0.00 {invoice.items[0]?.token}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Paid</span>
                <span style={{ fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>
                  {invoice.items[0]?.amount} {invoice.items[0]?.token}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Metadata footer */}
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>On-Chain Transaction Details</div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Hash: </span>
              <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{invoice.txHash}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>SUCCESS / CONFIRMED BY NETWORK</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This receipt is cryptographically verified by the blockchain network.
          </div>

        </div>
      </main>

      {/* Custom Styles for Print */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .invoice-page-container {
            min-height: auto !important;
          }
          .invoice-container {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .glow-bg, .glow-orb-1, .glow-orb-2 {
            display: none !important;
          }
          * {
            color: black !important;
            text-shadow: none !important;
            box-shadow: none !important;
            border-color: #ddd !important;
          }
          .badge {
            border: 1px solid #000 !important;
            background: transparent !important;
            color: black !important;
          }
          .custom-table th {
            border-bottom: 1px solid #000 !important;
          }
          .custom-table td {
            border-bottom: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
}
