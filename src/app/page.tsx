'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { 
  Plus, Copy, Check, ExternalLink, QrCode, DollarSign, 
  Link2, Users, FileText, CreditCard, Download, ArrowUpRight, 
  Trash2, Layers, AlertCircle, Mail, User, ShieldCheck, 
  Smartphone, BarChart3, HelpCircle, ArrowRight, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [links, setLinks] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState('links'); // 'links' | 'subscriptions' | 'activity'
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedLinkForQr, setSelectedLinkForQr] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Landing Page Interactive States
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form States for creating Link
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  const [network, setNetwork] = useState('Sepolia Testnet');
  const [collectEmail, setCollectEmail] = useState(false);
  const [collectName, setCollectName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkType, setLinkType] = useState('one-time'); // 'one-time' or 'subscription'
  const [billingInterval, setBillingInterval] = useState('30');

  // Fetch Merchant Data
  const fetchDashboardData = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const linksRes = await fetch(`/api/links?merchant=${address}`);
      const linksData = await linksRes.json();
      if (linksData.success) setLinks(linksData.links);

      const paymentsRes = await fetch(`/api/payments/merchant/${address}`);
      const paymentsData = await paymentsRes.json();
      if (paymentsData.success) setPayments(paymentsData.payments);

      const subsRes = await fetch(`/api/subscriptions?merchant=${address}`);
      const subsData = await subsRes.json();
      if (subsData.success) setSubscriptions(subsData.subscriptions);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData();
    }
  }, [isConnected, address]);

  // Create payment link handler
  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!address) return;
    setSubmitting(true);
    
    const fields = [];
    if (collectEmail) fields.push({ name: 'email', label: 'Email Address', type: 'email', required: true });
    if (collectName) fields.push({ name: 'name', label: 'Full Name', type: 'text', required: true });

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantAddress: address,
          title,
          description,
          amount,
          token,
          network,
          fields,
          isSubscription: linkType === 'subscription',
          interval: linkType === 'subscription' ? parseInt(billingInterval) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setAmount('');
        setCollectEmail(false);
        setCollectName(false);
        setLinkType('one-time');
        setBillingInterval('30');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error creating link:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Link Helper
  const handleCopyLink = (id) => {
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // QR Code Modal helper
  const handleOpenQr = async (link) => {
    setSelectedLinkForQr(link);
    const url = `${window.location.origin}/pay/${link.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
      setShowQrModal(true);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  // Toggle FAQ Accordion
  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  // Stats Calculations
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const activeLinksCount = links.length;
  const recentPaymentsCount = payments.length;
  const activeSubsCount = subscriptions.filter(s => s.status === 'active').length;

  // Render Marketing Landing Page if not connected
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
          <div className="nav-container">
            <a href="#" className="logo-link">
              <CreditCard size={22} color="var(--accent-primary)" />
              <span className="logo-text">cryptpay</span>
            </a>
            
            {/* Header Links */}
            <div className="no-print nav-links">
              <a href="#features" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Features</a>
              <a href="#workflow" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>How It Works</a>
              <a href="#pricing" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Pricing</a>
              <a href="#faq" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>FAQ</a>
            </div>

            <button onClick={openConnectModal} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Connect Wallet
            </button>
          </div>
        </header>

        {/* --- SECTION 1: HERO --- */}
        <main style={{ flex: 1 }}>
          <div className="hero-container">
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.15)', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              fontSize: '0.8rem', 
              fontWeight: 500, 
              color: 'var(--accent-primary)' 
            }}>
              <ShieldCheck size={14} /> Peer-to-Peer Payment Infrastructure
            </div>
            <h1 className="hero-title">
              Request and Accept Cryptographic Payments
            </h1>
            <p className="hero-subtitle">
              Generate non-custodial checkout links, create scan-to-pay QR codes, track incoming settlement details, and manage billing receipts directly from a unified interface.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={openConnectModal} className="btn btn-primary">
                Launch Merchant Hub
              </button>
              <a href="#features" className="btn btn-secondary">
                Explore Features
              </a>
            </div>
          </div>

          {/* --- SECTION 2: LIVE STATS --- */}
          <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', textAlign: 'center' }}>
              <div>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>0%</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Platform Transaction Fees</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>&lt; 2s</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Settlement Processing Speed</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>100%</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Non-Custodial Direct Payments</p>
              </div>
            </div>
          </div>

          {/* --- SECTION 3: PRODUCT FEATURES --- */}
          <div id="features" className="landing-section">
            <div className="section-header">
              <span className="section-label">Core Capabilities</span>
              <h2 className="section-title">Designed for modern Web3 commerce</h2>
              <p className="section-desc">Everything you need to integrate decentralized billing, subscriptions, and receipts into your business operations.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card">
                <Link2 size={24} color="var(--accent-primary)" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>Shareable Payment Links</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Create permanent checkout links tailored for service agreements, subscriptions, or digital invoices.</p>
              </div>
              <div className="glass-card">
                <QrCode size={24} color="var(--accent-primary)" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>Standard QR Codes</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Generate ERC-681 compatible QR codes that allow users to scan and pay directly using mobile wallet clients.</p>
              </div>
              <div className="glass-card">
                <FileText size={24} color="var(--accent-primary)" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>Automated Receipts</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Generate structured commercial receipts. Users can view transaction metadata and print directly to PDF.</p>
              </div>
              <div className="glass-card">
                <Layers size={24} color="var(--accent-primary)" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>On-Chain Subscriptions</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Utilize pull-payment Solidity smart contracts that authorize recurring billing frequencies directly on the blockchain.</p>
              </div>
            </div>
          </div>

          {/* --- SECTION 4: HOW IT WORKS --- */}
          <div id="workflow" className="landing-section">
            <div className="section-header">
              <span className="section-label">Workflow Integration</span>
              <h2 className="section-title">Get started in three steps</h2>
              <p className="section-desc">Deploy your on-chain cashier registry within minutes without writing any smart contract code.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-num">1</div>
                <h3 style={{ fontSize: '1.1rem' }}>Connect Wallet</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Securely connect your admin wallet using our integrated WalletConnect, MetaMask, or Rainbow login buttons.</p>
              </div>
              <div className="step-card">
                <div className="step-num">2</div>
                <h3 style={{ fontSize: '1.1rem' }}>Configure Request</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Specify the item name, settlement token (ETH, USDC, USDT), target network, and custom fields to collect from buyers.</p>
              </div>
              <div className="step-card">
                <div className="step-num">3</div>
                <h3 style={{ fontSize: '1.1rem' }}>Distribute Link</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>Copy the payment link or download the generated QR code to share on your storefront, invoice emails, or social media channels.</p>
              </div>
            </div>
          </div>

          {/* --- SECTION 5: PRICING --- */}
          <div id="pricing" className="landing-section">
            <div className="section-header">
              <span className="section-label">Transparent Pricing</span>
              <h2 className="section-title">Zero fees, unlimited billing</h2>
              <p className="section-desc">We do not charge platform commissions. Choose the pricing tier that matches your integration scope.</p>
            </div>

            <div className="pricing-grid">
              <div className="glass-card" style={{ border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Direct P2P Model</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0' }}>$0</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '60px' }}>
                  Best for individual freelancers and startups. Settle customer transactions directly wallet-to-wallet.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> Unlimited payment links</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> Automated invoice generation</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> Standard QR code generation</div>
                </div>
              </div>

              <div className="glass-card" style={{ border: '1px solid var(--border-active)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Smart Contract Routing</h3>
                  <span className="badge badge-primary">Enterprise</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0' }}>Custom</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '60px' }}>
                  Best for commercial dApps. Routes customer funds through a audited registry contract.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> All Direct P2P features</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> Smart contract event indexing</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={14} color="var(--success)" /> Pull-subscription capabilities</div>
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 6: FAQ --- */}
          <div id="faq" className="landing-section" style={{ borderBottom: 'none' }}>
            <div className="section-header">
              <span className="section-label">FAQ</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-desc">Clear information about how the system handles on-chain checkout billing.</p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  q: "Are the payments processed directly, or does CryptPay hold custody?",
                  a: "CryptPay is entirely non-custodial. When a buyer completes a checkout transaction, the assets go directly from their Web3 wallet address to the merchant's connected wallet address. We never hold custody of user funds."
                },
                {
                  q: "How are standard transaction fees computed?",
                  a: "There are no platform fees for the direct checkout routing. The only fees incurred during payment are the standard network gas fees necessary to execute transactions on the Ethereum, Polygon, or Arbitrum block networks."
                },
                {
                  q: "Can I collect buyer information during payment?",
                  a: "Yes. When creating a link from your merchant panel, you can toggle fields requiring customers to supply their email addresses and full names. These parameters are archived in our database for audit queries."
                },
                {
                  q: "How does the Sandbox Simulation work?",
                  a: "Our sandbox checkout option permits team managers to test user payment flows without sending actual gas or needing mock testnet tokens. A simulated transaction hash is generated to create mock invoices."
                }
              ].map((faq, index) => (
                <div key={index} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div 
                    onClick={() => toggleFaq(index)} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      padding: '0.75rem 0'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.25rem', color: 'var(--accent-primary)' }}>{openFaq === index ? '−' : '+'}</span>
                  </div>
                  {openFaq === index && (
                    <div style={{ padding: '0.5rem 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 1rem', background: 'var(--bg-card)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&copy; 2026 CryptPay. Non-custodial payment requests.</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decentralized On-Chain Checkout Gateway.</span>
          </div>
        </footer>
      </div>
    );
  }

  // Render Dashboard if connected
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-container">
          <a href="#" className="logo-link">
            <CreditCard size={22} color="var(--accent-primary)" />
            <span className="logo-text mobile-hide">cryptpay</span>
            <span className="badge badge-primary mobile-hide" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>Merchant Hub</span>
          </a>
          <ConnectButton showBalance={false} chainStatus={{ smallScreen: 'none', largeScreen: 'icon' }} />
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 0' }}>
        {/* Stats Row */}
        <div className="dashboard-grid">
          <div className="col-12 dashboard-header-row" style={{ marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Merchant Overview</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time statistics for connected wallet: {address.slice(0,6)}...{address.slice(-4)}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Link
            </button>
          </div>

          <div className="col-3 glass-card stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{totalRevenue.toFixed(4)} ETH</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> +12% this week</div>
          </div>
          
          <div className="col-3 glass-card stat-card">
            <div className="stat-label">Total Payments</div>
            <div className="stat-value">{recentPaymentsCount}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> +8% volume</div>
          </div>

          <div className="col-3 glass-card stat-card">
            <div className="stat-label">Active Links</div>
            <div className="stat-value">{activeLinksCount}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> +2 active today</div>
          </div>

          <div className="col-3 glass-card stat-card">
            <div className="stat-label">Active Subscriptions</div>
            <div className="stat-value">{activeSubsCount}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> Recurring billing</div>
          </div>
        </div>

        {/* Mobile Tab Control */}
        <div className="mobile-tabs-bar">
          <button 
            onClick={() => setMobileActiveTab('links')}
            className={`mobile-tab-item ${mobileActiveTab === 'links' ? 'active' : ''}`}
          >
            Links
          </button>
          <button 
            onClick={() => setMobileActiveTab('activity')}
            className={`mobile-tab-item ${mobileActiveTab === 'activity' ? 'active' : ''}`}
          >
            Activity
          </button>
          <button 
            onClick={() => setMobileActiveTab('subscriptions')}
            className={`mobile-tab-item ${mobileActiveTab === 'subscriptions' ? 'active' : ''}`}
          >
            Subscriptions
          </button>
        </div>

        {/* Dashboard Main Content */}
        <div className="dashboard-grid">
          {/* Payment Links Table */}
          <div className={`col-8 glass-card mobile-tab-section ${mobileActiveTab === 'links' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Active Payment Links</h3>
              <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="skeleton" style={{ flex: 3, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 2, height: '36px' }}></div>
                    <div className="skeleton" style={{ width: '90px', height: '36px' }}></div>
                  </div>
                ))}
              </div>
            ) : links.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                <Link2 size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No payment links yet</p>
                <p style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>Create your first link to start accepting payments directly to your wallet.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>Create Link</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Token</th>
                      <th>Network</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {link.title}
                            {link.isSubscription && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                Subscription
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{link.amount}</td>
                        <td><span className="badge badge-primary">{link.token}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{link.network}</td>
                        <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                            onClick={() => handleCopyLink(link.id)}
                            title="Copy Payment Link"
                          >
                            {copiedId === link.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                            onClick={() => handleOpenQr(link)}
                            title="View QR Code"
                          >
                            <QrCode size={14} />
                          </button>
                          <a 
                            href={`/pay/${link.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                            title="Test Checkout Page"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment History Card */}
          <div className={`col-4 glass-card mobile-tab-section ${mobileActiveTab === 'activity' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Recent Activity</h3>
              {payments.length > 0 && (
                <button
                  onClick={() => {
                    const headers = ['ID', 'Customer', 'Email', 'Amount', 'Token', 'Network', 'Date', 'TX Hash', 'Status'];
                    const rows = payments.map(p => [
                      p.id, p.customerName || 'Anonymous', p.customerEmail || '',
                      p.amount, p.token, p.network,
                      new Date(p.timestamp).toISOString(), p.txHash || '', 'confirmed'
                    ]);
                    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Download size={14} /> CSV
                </button>
              )}
            </div>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px', marginBottom: '0.4rem' }}></div>
                      <div className="skeleton skeleton-text" style={{ width: '35%', height: '10px' }}></div>
                    </div>
                    <div className="skeleton" style={{ width: '60px', height: '20px' }}></div>
                  </div>
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <DollarSign size={28} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8rem' }}>No payment activity yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '380px' }}>
                {payments.map((payment) => (
                  <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {payment.customerName || 'Anonymous Customer'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(payment.timestamp).toLocaleDateString()} &bull; {payment.network}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                        +{payment.amount} {payment.token}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                        <a 
                          href={`/invoice/${payment.id.replace('pay_', 'inv_')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.1rem', textDecoration: 'none', color: 'var(--accent-primary)' }}
                        >
                          <FileText size={10} /> Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscriptions section */}
          <div className={`col-12 glass-card mobile-tab-section ${mobileActiveTab === 'subscriptions' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Recurring Subscriptions</h3>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="skeleton" style={{ flex: 2, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 3, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 2, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 2, height: '36px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '36px' }}></div>
                  </div>
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                <CreditCard size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No subscriptions found</p>
                <p style={{ fontSize: '0.8rem' }}>Subscriptions are created when subscribers sign authorization on-chain.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Subscriber</th>
                      <th>Amount</th>
                      <th>Token</th>
                      <th>Interval</th>
                      <th>Next Billing</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.planName}</td>
                        <td style={{ fontSize: '0.8rem' }}>{sub.subscriberAddress.slice(0, 8)}...{sub.subscriberAddress.slice(-6)}</td>
                        <td>{sub.amount}</td>
                        <td><span className="badge badge-primary">{sub.token}</span></td>
                        <td>Every {sub.interval} Days</td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- CREATE PAYMENT LINK MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Create Payment Link</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateLink}>
              <div className="tabs-container" style={{ marginBottom: '1.25rem' }}>
                <button 
                  type="button" 
                  className={`tab-btn ${linkType === 'one-time' ? 'active' : ''}`}
                  onClick={() => setLinkType('one-time')}
                  style={{ flex: 1, padding: '0.6rem', textAlign: 'center' }}
                >
                  One-Time Payment
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${linkType === 'subscription' ? 'active' : ''}`}
                  onClick={() => {
                    setLinkType('subscription');
                    if (token === 'ETH') setToken('USDC');
                  }}
                  style={{ flex: 1, padding: '0.6rem', textAlign: 'center' }}
                >
                  Recurring Subscription
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Link Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Design Services, SaaS Pro Plan" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Details of the payment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    className="form-input" 
                    placeholder="e.g. 0.05" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Token</label>
                  <select className="form-select" value={token} onChange={(e) => setToken(e.target.value)}>
                    {linkType !== 'subscription' && <option value="ETH">ETH</option>}
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Network</label>
                  <select className="form-select" value={network} onChange={(e) => setNetwork(e.target.value)}>
                    <option value="Sepolia Testnet">Sepolia</option>
                    <option value="Ethereum Mainnet">Ethereum</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                  </select>
                </div>
              </div>

              {linkType === 'subscription' && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Billing Cycle (Interval)</label>
                  <select 
                    className="form-select" 
                    value={billingInterval} 
                    onChange={(e) => setBillingInterval(e.target.value)}
                  >
                    <option value="1">Daily (Demo / Testing)</option>
                    <option value="7">Weekly</option>
                    <option value="30">Monthly</option>
                    <option value="365">Yearly</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="collectEmail" 
                    checked={collectEmail} 
                    onChange={(e) => setCollectEmail(e.target.checked)}
                    style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                  />
                  <label htmlFor="collectEmail" style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={12} color="var(--text-muted)" /> Collect Customer Email (auto-invoice)
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="collectName" 
                    checked={collectName} 
                    onChange={(e) => setCollectName(e.target.checked)}
                    style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                  />
                  <label htmlFor="collectName" style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} color="var(--text-muted)" /> Collect Customer Name
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Generating...' : 'Create Payment Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QR CODE VIEW MODAL --- */}
      {showQrModal && selectedLinkForQr && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center', background: 'var(--bg-card)' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Share QR Code</h3>
              <button className="close-btn" onClick={() => setShowQrModal(false)}>
                &times;
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>{selectedLinkForQr.title}</p>
            
            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img src={qrCodeDataUrl} alt="Payment Link QR Code" style={{ display: 'block', maxWidth: '100%' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', marginTop: '1.5rem' }}>
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/pay/${selectedLinkForQr.id}`} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', width: '100%', outline: 'none' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} 
                onClick={() => handleCopyLink(selectedLinkForQr.id)}
              >
                {copiedId === selectedLinkForQr.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
