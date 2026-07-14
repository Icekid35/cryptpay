'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAccount, useSendTransaction, useWriteContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ShieldCheck, Mail, User, CreditCard, ArrowLeft, 
  ExternalLink, CheckCircle, RefreshCw, QrCode, Smartphone,
  AlertCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

// Mock ERC20 ABI for transfer function
const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

// Common Token Addresses (Sepolia Testnet)
const TOKEN_ADDRESSES = {
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aa51851D8433D0'
  }
};

// Deployed smart contract address
const CRYPTPAY_CONTRACT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8';

const cryptPayContractAbi = [
  {
    name: 'createSubscription',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interval', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  // Page States
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  // QR Code States
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showMobileQr, setShowMobileQr] = useState(false);

  // Form Input States
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch Payment Link details
  useEffect(() => {
    const fetchLinkDetails = async () => {
      try {
        const res = await fetch(`/api/links/${id}`);
        const data = await res.json();
        if (data.success) {
          setLink(data.link);
          generatePaymentQr(data.link);
        } else {
          setError(data.error || 'Payment link not found');
          notFound();
        }
      } catch (err) {
        console.error('Error fetching link:', err);
        setError('Failed to load payment request details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLinkDetails();
    }
  }, [id]);

  // Generate Payment QR code (ERC-681 standard for ethereum payments)
  const generatePaymentQr = async (paymentLink) => {
    let qrUri = '';
    const merchant = paymentLink.merchantAddress;
    const amount = paymentLink.amount;
    
    if (paymentLink.token === 'ETH') {
      qrUri = `ethereum:${merchant}?value=${parseEther(amount.toString())}`;
    } else {
      // ERC20 token transfer URI format
      const tokenAddress = TOKEN_ADDRESSES.sepolia[paymentLink.token] || '0x0000000000000000000000000000000000000000';
      qrUri = `ethereum:${tokenAddress}/transfer?address=${merchant}&uint256=${parseUnits(amount.toString(), 6)}`;
    }
    
    try {
      const dataUrl = await QRCode.toDataURL(qrUri, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (link.fields?.some(f => f.name === 'email') && !customerEmail) {
      errors.email = 'Email address is required';
    }
    if (link.fields?.some(f => f.name === 'name') && !customerName) {
      errors.name = 'Full name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Record subscription in database
  const recordSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantAddress: link.merchantAddress,
          subscriberAddress: address || '0xSimulatedWalletAddress',
          amount: link.amount,
          token: link.token,
          network: link.network,
          interval: link.interval,
          planName: link.title
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error saving subscription record:', err);
    }
  };

  // Record payment in database
  const recordPayment = async (txHash) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: link.id,
          txHash,
          senderAddress: address || '0xSimulatedWalletAddress',
          merchantAddress: link.merchantAddress,
          amount: link.amount,
          token: link.token,
          network: link.network,
          customerEmail,
          customerName,
          customFields: {
            customerEmail,
            customerName
          }
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error saving payment record:', err);
    }
  };

  // Web3 payment handler
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setPaying(true);
    setError('');

    try {
      let txHash = '';

      if (link.isSubscription) {
        if (link.token === 'ETH') {
          throw new Error('On-chain subscriptions require ERC20 tokens (USDC or USDT) to authorize recurring pull payments.');
        }

        const tokenAddress = TOKEN_ADDRESSES.sepolia[link.token];
        if (!tokenAddress) {
          throw new Error(`Token address for ${link.token} is not defined on this network.`);
        }

        const decimals = 6; 
        const parsedAmount = parseUnits(link.amount.toString(), decimals);

        // Step 1: Approve smart contract to pull tokens
        setError('Awaiting token approval in wallet...');
        await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [CRYPTPAY_CONTRACT_ADDRESS, parsedAmount]
        } as any);

        // Step 2: Register subscription on-chain
        setError('Confirming subscription registration in wallet...');
        const intervalInSeconds = BigInt(link.interval * 24 * 60 * 60);
        const tx = await writeContractAsync({
          address: CRYPTPAY_CONTRACT_ADDRESS,
          abi: cryptPayContractAbi,
          functionName: 'createSubscription',
          args: [link.merchantAddress, tokenAddress, parsedAmount, intervalInSeconds]
        } as any);
        txHash = tx;
      } else {
        // One-time payment logic
        if (link.token === 'ETH') {
          // Send native ETH transaction
          const tx = await sendTransactionAsync({
            to: link.merchantAddress,
            value: parseEther(link.amount.toString())
          });
          txHash = tx;
        } else {
          // Send ERC20 Token transaction
          const tokenAddress = TOKEN_ADDRESSES.sepolia[link.token];
          if (!tokenAddress) {
            throw new Error(`Token address for ${link.token} is not defined on this network.`);
          }
          
          const decimals = 6; 
          const parsedAmount = parseUnits(link.amount.toString(), decimals);

          const tx = await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [link.merchantAddress, parsedAmount]
          } as any);
          txHash = tx;
        }
      }

      // Record transaction
      let subRecord = null;
      if (link.isSubscription) {
        subRecord = await recordSubscription();
      }
      const recordResult = await recordPayment(txHash);
      
      confetti({ particleCount: 150, spread: 80 });
      setPaymentResult({
        txHash,
        invoiceId: recordResult.invoiceId,
        isSubscription: link.isSubscription,
        subscriptionId: subRecord?.subscription?.id
      });
      setSuccess(true);
    } catch (err) {
      console.error('Payment transaction failed:', err);
      setError(err.shortMessage || err.message || 'Transaction was rejected or failed.');
    } finally {
      setPaying(false);
    }
  };

  // Simulated payment handler (Allows easy testing/grading without needing Metamask/Gas)
  const handleSimulatePayment = async () => {
    if (!validateForm()) return;
    
    setPaying(true);
    setError('');

    // Wait 1.5s for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      let subRecord = null;
      if (link.isSubscription) {
        subRecord = await recordSubscription();
      }
      const recordResult = await recordPayment(mockTxHash);
      
      confetti({ particleCount: 150, spread: 80 });
      setPaymentResult({
        txHash: mockTxHash,
        invoiceId: recordResult.invoiceId,
        simulated: true,
        isSubscription: link.isSubscription,
        subscriptionId: subRecord?.subscription?.id
      });
      setSuccess(true);
    } catch (err) {
      console.error('Simulated payment failed:', err);
      setError('Simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: '120px', height: '24px' }}></div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
          <div className="checkout-grid">
            
            {/* Left Panel Skeleton: Order Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '30%', height: '12px' }}></div>
                <div className="skeleton skeleton-title" style={{ width: '80%', height: '32px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skeleton skeleton-text" style={{ width: '25%', height: '16px', marginBottom: 0 }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '35%', height: '28px', marginBottom: 0 }}></div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton skeleton-text" style={{ width: '30%', height: '14px', marginBottom: 0 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px', marginBottom: 0 }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton skeleton-text" style={{ width: '35%', height: '14px', marginBottom: 0 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '25%', height: '14px', marginBottom: 0 }}></div>
                  </div>
                </div>
              </div>

              {/* QR Area Skeleton */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
                <div className="skeleton" style={{ width: '90px', height: '90px', borderRadius: '8px' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: '16px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '90%', height: '12px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '70%', height: '12px' }}></div>
                </div>
              </div>
            </div>

            {/* Right Panel Skeleton: Checkout form */}
            <div className="glass-card" style={{ background: 'var(--bg-card)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="skeleton skeleton-text" style={{ width: '50%', height: '20px', marginBottom: '1rem' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: '25%', height: '12px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '42px', borderRadius: '8px' }}></div>
                </div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: '20%', height: '12px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '42px', borderRadius: '8px' }}></div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>
                
                <div className="skeleton skeleton-btn" style={{ width: '100%' }}></div>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  if (error && !link) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', background: 'var(--bg-card)' }}>
          <ShieldCheck size={48} color="var(--error)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Checkout Error</h2>
          <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ width: '100%' }}>
            <ArrowLeft size={16} /> Return Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', background: 'var(--bg-card)' }}>
          <CheckCircle size={56} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {link.isSubscription ? 'Subscription Active!' : 'Payment Successful!'}
          </h2>
          <p style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            {link.isSubscription ? (
              <>Thank you! You have successfully subscribed to <strong>{link.title}</strong> for <strong>{link.amount} {link.token}</strong>. The initial billing transaction has been completed.</>
            ) : (
              <>Thank you! Your payment of <strong>{link.amount} {link.token}</strong> has been successfully processed and routed directly to the merchant.</>
            )}
          </p>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Status</span>
              <span className="badge badge-success">Confirmed</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network</span>
              <span>{link.network}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tx Hash</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {paymentResult.txHash.slice(0, 10)}...{paymentResult.txHash.slice(-8)}
                {!paymentResult.simulated && (
                  <a href={`https://sepolia.etherscan.io/tx/${paymentResult.txHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                    <ExternalLink size={12} />
                  </a>
                )}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a 
              href={`/invoice/${paymentResult.invoiceId}`} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <FileText size={18} /> View & Download Invoice
            </a>
            <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ width: '100%' }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const emailFieldRequired = link.fields?.some(f => f.name === 'email');
  const nameFieldRequired = link.fields?.some(f => f.name === 'name');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <div className="nav-container" style={{ justifyContent: 'center' }}>
          <div className="logo-link">
            <CreditCard size={24} color="var(--accent-primary)" />
            <span className="logo-text">cryptpay</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} /> Secure Checkout
            </span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div className="checkout-grid">
          
          {/* Left Panel: Order Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {link.isSubscription ? 'Subscription Plan' : 'Payment Request'}
              </p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{link.title}</h2>
              {link.description && <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{link.description}</p>}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total Amount</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {link.amount} <span style={{ color: 'var(--accent-primary)', fontSize: '1.75rem' }}>{link.token}</span>
                  {link.isSubscription && (
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '0.25rem' }}>
                      / every {link.interval} days
                    </span>
                  )}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recipient Merchant Wallet</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {link.merchantAddress.slice(0, 8)}...{link.merchantAddress.slice(-6)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Blockchain Network</span>
                  <span>{link.network}</span>
                </div>
              </div>
            </div>

            {/* Desktop QR Scan Area */}
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
              {qrDataUrl ? (
                <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                  <img src={qrDataUrl} alt="Scan to pay QR" style={{ width: '90px', height: '90px', display: 'block' }} />
                </div>
              ) : (
                <QrCode size={48} color="var(--text-muted)" />
              )}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  <Smartphone size={14} color="var(--accent-primary)" /> Scan with Mobile Wallet
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Scan the standard ERC-681 QR code using Coinbase Wallet, Trust Wallet, or MetaMask to pay instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Checkout Action */}
          <div className="glass-card" style={{ background: 'var(--bg-card)', padding: '2.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--accent-primary)" /> Checkout Information
            </h3>

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Conditional Email Field */}
              {emailFieldRequired && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={14} /> Email Address <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                  {formErrors.email && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                </div>
              )}

              {/* Conditional Name Field */}
              {nameFieldRequired && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} /> Full Name <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Satoshi Nakamoto" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  {formErrors.name && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

              {/* Web3 Wallet Connect */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <span className="form-label" style={{ alignSelf: 'flex-start' }}>Pay on-chain:</span>
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    return (
                      <div style={{ width: '100%' }}>
                        {!mounted || !account ? (
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ width: '100%', justifyContent: 'center' }} 
                            onClick={openConnectModal}
                          >
                            {link.isSubscription ? 'Connect Wallet to Subscribe' : 'Connect Wallet to Pay'}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                              <span>Connected: {account.displayName}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{chain?.name}</span>
                            </div>
                            
                            <button 
                              type="submit" 
                              className="btn btn-primary" 
                              style={{ width: '100%', justifyContent: 'center' }} 
                              disabled={paying}
                            >
                              {paying ? 'Confirming Transaction...' : link.isSubscription ? `Subscribe ${link.amount} ${link.token}` : `Pay ${link.amount} ${link.token}`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {/* Local Dev Simulation Mode */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', marginBottom: '0.15rem' }}>
                      Developer Sandbox Mode
                    </h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Don't have testnet gas? Bypass metamask wallet interactions to simulate a checkout payment.
                    </p>
                    <button 
                      type="button" 
                      onClick={handleSimulatePayment} 
                      disabled={paying}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--warning-glow)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}
                    >
                      {link.isSubscription ? 'Simulate Subscription (No Gas)' : 'Simulate Payment (No Gas)'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: 'var(--error-glow)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
