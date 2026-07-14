'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1.5rem',
      backgroundColor: 'var(--bg-main)'
    }}>
      <div className="glass-card" style={{ 
        maxWidth: '450px', 
        width: '100%', 
        textAlign: 'center', 
        background: 'var(--bg-card)',
        padding: '3rem 2rem',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        <ShieldAlert size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          The link you followed is broken, does not exist, or the payment request has expired. Please verify the address and try again.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => router.push('/')} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Return Home
        </button>
      </div>
    </div>
  );
}
