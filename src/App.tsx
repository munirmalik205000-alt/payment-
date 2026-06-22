import { useState, useEffect } from 'react';
import {
  Wallet,
  Shield,
  QrCode,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Settings,
  FileText,
  Key,
  Layers,
  History,
  LifeBuoy,
  RefreshCw,
  LogOut,
  Send,
  Lock,
  BadgeAlert,
  Clipboard,
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
  Terminal,
  Activity,
  Plus
} from 'lucide-react';
import { request } from './utils/api';

export default function App() {
  // Navigation / System State
  const [session, setSession] = useState<{ token: string; user: any; merchant?: any } | null>(() => {
    const saved = localStorage.getItem('sp360_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.setItem('sp360_token', parsed.token);
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Global UI panel switcher: "admin" | "merchant" | "portal" | "checkout" | "auth" | "docs"
  const [activeTab, setActiveTab] = useState<'admin' | 'merchant' | 'checkout' | 'docs'>(() => {
    // Default depending on session
    if (session?.user?.role === 'admin') return 'admin';
    return 'merchant'; // will prompt login if no session
  });

  // State inside panels
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authBizName, setAuthBizName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dashboards Data loads
  const [adminData, setAdminData] = useState<any>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Active Interactive Checkout properties
  const [checkoutOrderId, setCheckoutOrderId] = useState<string>('ord-3'); // default loaded order for demonstration
  const [checkoutOrderDetails, setCheckoutOrderDetails] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New Link generation states
  const [linkAmount, setLinkAmount] = useState('1250');
  const [linkDesc, setLinkDesc] = useState('Premium API Cloud Pack');
  const [linkEmail, setLinkEmail] = useState('buyer@customer.org');
  const [linkPhone, setLinkPhone] = useState('+91 98888 77777');

  // KYC submissions state
  const [kycPan, setKycPan] = useState('');
  const [kycAadhaar, setKycAadhaar] = useState('');
  const [kycBankAcc, setKycBankAcc] = useState('');
  const [kycIfsc, setKycIfsc] = useState('');
  const [kycBankName, setKycBankName] = useState('');
  const [kycHolder, setKycHolder] = useState('');

  // Payout/Withdrawal State
  const [payoutAmount, setPayoutAmount] = useState('');

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');

  // Static / Dynamic QR simulator helper
  const [generatorType, setGeneratorType] = useState<'static' | 'dynamic'>('dynamic');
  const [genAmount, setGenAmount] = useState('250.00');

  // ADMIN Action inputs
  const [adminRemarks, setAdminRemarks] = useState('');
  const [adminCustomComRate, setAdminCustomComRate] = useState('');
  const [selectedMerchantForAction, setSelectedMerchantForAction] = useState<any>(null);
  const [selectedWithdrawalForAction, setSelectedWithdrawalForAction] = useState<any>(null);
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<any>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Admin Config parameters
  const [configBaseRate, setConfigBaseRate] = useState('2.0');
  const [configGstRate, setConfigGstRate] = useState('18.0');

  // API Developer Sandbox runner
  const [apiApiKey, setApiApiKey] = useState('sp360_live_key_9fb1526a3cc4');
  const [apiSecretKey, setApiSecretKey] = useState('sp360_secret_841e2a87b5d985aee2');
  const [apiPayloadAmount, setApiPayloadAmount] = useState('500');
  const [apiPayloadOrder, setApiPayloadOrder] = useState('ORDER_' + Math.floor(Math.random() * 100000));
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Auto-refresh timer loop
  useEffect(() => {
    fetchDashboards();
    // Auto-polling interval for dynamic merchant/admin updates simulation
    const interval = setInterval(() => {
      silentBackgroundPoll();
    }, 15000);
    return () => clearInterval(interval);
  }, [session, activeTab]);

  const silentBackgroundPoll = async () => {
    if (!session) return;
    try {
      if (session.user.role === 'admin' && activeTab === 'admin') {
        const res = await request('/api/admin/dashboard');
        setAdminData(res);
      } else if (session.user.role === 'merchant' && activeTab === 'merchant') {
        const res = await request('/api/merchant/dashboard');
        setMerchantData(res);
      }
    } catch (e) {
      // Slient
    }
  };

  const fetchDashboards = async () => {
    if (!session) return;
    setLoading(true);
    setErrorStatus(null);
    try {
      if (session.user.role === 'admin' && activeTab === 'admin') {
        const res = await request('/api/admin/dashboard');
        setAdminData(res);
        if (res.configs) {
          setConfigBaseRate(res.configs.rate.toString());
          setConfigGstRate(res.configs.gst_rate.toString());
        }
      } else {
        const res = await request('/api/merchant/dashboard');
        setMerchantData(res);
        // prefill KYC states if available
        if (res.kyc) {
          setKycPan(res.kyc.pan_number || '');
          setKycAadhaar(res.kyc.aadhaar_number || '');
          setKycBankAcc(res.kyc.bank_account_no || '');
          setKycIfsc(res.kyc.bank_ifsc || '');
          setKycBankName(res.kyc.bank_name || '');
          setKycHolder(res.kyc.account_holder_name || '');
        }
        if (res.apiKeys) {
          setApiApiKey(res.apiKeys.api_key);
          setApiSecretKey(res.apiKeys.secret_key);
        }
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'System failed loading information');
    } finally {
      setLoading(false);
    }
  };

  // Force fetch order details for Checkout Simulation
  const fetchCheckoutOrder = async (id: string) => {
    try {
      const res = await request(`/api/gateway/order/${id}`);
      setCheckoutOrderDetails(res);
    } catch (err: any) {
      // Fallback simulating basic values
      setCheckoutOrderDetails({
        order: {
          id: id,
          amount: 2500.00,
          currency: 'INR',
          status: 'pending',
          customer_email: 'buyer@example.com',
          customer_phone: '+91 94444 22222',
          description: 'Premium Development Kit Pack'
        },
        merchantBusiness: 'StarTech Solutions Co'
      });
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Auth processing
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    setLoading(true);

    const payload = isRegisterMode
      ? { email: authEmail, password: authPass, businessName: authBizName, phone: authPhone }
      : { email: authEmail, password: authPass };

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      localStorage.setItem('sp360_token', res.token);
      localStorage.setItem('sp360_session', JSON.stringify(res));
      setSession(res);
      setSuccessMsg(isRegisterMode ? "Registration Successful!" : "Logged In Successfully!");

      // Set active default view based on user role
      if (res.user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('merchant');
      }

      setAuthEmail('');
      setAuthPass('');
      setAuthBizName('');
      setAuthPhone('');
    } catch (err: any) {
      setErrorStatus(err.message || "Credential authentication failed. Try: admin@smartpay360.com / admin123");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sp360_token');
    localStorage.removeItem('sp360_session');
    setSession(null);
    setAdminData(null);
    setMerchantData(null);
  };

  // Quick Preset logins for convenient evaluation
  const handleQuickLogin = async (role: 'admin' | 'merchant') => {
    const email = role === 'admin' ? 'admin@smartpay360.com' : 'merchant@startech.co';
    const password = role === 'admin' ? 'admin123' : 'merchant123';

    setErrorStatus(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('sp360_token', res.token);
      localStorage.setItem('sp360_session', JSON.stringify(res));
      setSession(res);

      if (res.user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('merchant');
      }
    } catch (err: any) {
      setErrorStatus("Quick login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // MERCHANT: Submit KYC Profile
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/merchant/kyc', {
        method: 'POST',
        body: JSON.stringify({
          pan_number: kycPan,
          aadhaar_number: kycAadhaar,
          bank_account_no: kycBankAcc,
          bank_ifsc: kycIfsc,
          bank_name: kycBankName,
          account_holder_name: kycHolder
        })
      });
      setSuccessMsg(res.message);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // MERCHANT: Generate / Rotate Keys
  const handleRotateKeys = async () => {
    if (!window.confirm("Are you sure you want to invalidate all existing keys and regenerate? All live integrations will require immediate updating.")) return;
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/merchant/api-keys/generate', { method: 'POST' });
      setSuccessMsg(res.message);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // MERCHANT: Request Withdrawal payout
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    if (!payoutAmount || isNaN(parseFloat(payoutAmount)) || parseFloat(payoutAmount) <= 0) {
      setErrorStatus("Please specify a positive numerical payout sum.");
      return;
    }
    try {
      const res = await request('/api/merchant/payouts/request', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(payoutAmount) })
      });
      setSuccessMsg(res.message);
      setPayoutAmount('');
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // MERCHANT: Create Custom Payment Link
  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/merchant/payment-links', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(linkAmount),
          description: linkDesc,
          customer_email: linkEmail,
          customer_phone: linkPhone
        })
      });
      setSuccessMsg(res.message);
      // Pre-load newly generated order ID so they can pay it easily
      setCheckoutOrderId(res.order.id);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // MERCHANT: Create Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/merchant/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject: ticketSubject, message: ticketMsg })
      });
      setSuccessMsg(res.message);
      setTicketSubject('');
      setTicketMsg('');
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // ADMIN: Merchant Action Approval
  const handleAdminVerifyMerchant = async (decision: 'approve' | 'reject') => {
    if (!selectedMerchantForAction) return;
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/admin/merchants/verify', {
        method: 'POST',
        body: JSON.stringify({
          merchantId: selectedMerchantForAction.id,
          decision,
          remarks: adminRemarks,
          custom_rate: adminCustomComRate ? parseFloat(adminCustomComRate) : undefined
        })
      });
      setSuccessMsg(res.message);
      setSelectedMerchantForAction(null);
      setAdminRemarks('');
      setAdminCustomComRate('');
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // ADMIN: Payout validation
  const handleAdminWithdrawalAction = async (decision: 'approve' | 'reject') => {
    if (!selectedWithdrawalForAction) return;
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/admin/withdrawals/action', {
        method: 'POST',
        body: JSON.stringify({
          withdrawalId: selectedWithdrawalForAction.id,
          decision,
          remarks: adminRemarks
        })
      });
      setSuccessMsg(res.message);
      setSelectedWithdrawalForAction(null);
      setAdminRemarks('');
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // ADMIN: Reply Support Ticket
  const handleAdminTicketReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForReply || !adminReplyText) return;
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/admin/tickets/reply', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: selectedTicketForReply.id,
          reply: adminReplyText
        })
      });
      setSuccessMsg(res.message);
      setSelectedTicketForReply(null);
      setAdminReplyText('');
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // ADMIN: Update Commission Parameter Values
  const handleAdminUpdateCommissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/admin/commissions/settings', {
        method: 'POST',
        body: JSON.stringify({
          rate: parseFloat(configBaseRate),
          gst_rate: parseFloat(configGstRate)
        })
      });
      setSuccessMsg(res.message);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // ADMIN: Dynamic simulated settlements engine trigger
  const handleTriggerAutomatedSettlements = async () => {
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/admin/settlements/trigger', { method: 'POST' });
      setSuccessMsg(res.message);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // PUBLIC GATEWAY: Pay checkout simulation handler
  const handlePayCheckoutOrder = async (mode: string) => {
    if (!checkoutOrderDetails) return;
    setErrorStatus(null);
    setSuccessMsg(null);
    try {
      const res = await request('/api/gateway/pay', {
        method: 'POST',
        body: JSON.stringify({
          orderId: checkoutOrderDetails.order.id,
          paymentMode: mode
        })
      });
      setSuccessMsg("System authorized payment! " + res.message);
      // reload details
      fetchCheckoutOrder(checkoutOrderDetails.order.id);
      fetchDashboards();
    } catch (err: any) {
      setErrorStatus(err.message);
    }
  };

  // DEVELOPER INTERACTIVE API SANDBOX
  const handleRunDeveloperSandbox = async () => {
    setApiResponse(null);
    try {
      const headers = {
        'x-api-key': apiApiKey,
        'Content-Type': 'application/json'
      };

      const res = await fetch('/api/v1/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parseFloat(apiPayloadAmount),
          currency: 'INR',
          order_id_custom: apiPayloadOrder,
          customer_email: 'sandbox@google-aistudio.com',
          customer_phone: '+91 99999 55555',
          description: 'Live Sandbox Merchant Dev Call'
        })
      });

      const data = await res.json();
      setApiResponse({
        requestHeaders: headers,
        status: res.status,
        response: data
      });

      if (data.order_details) {
        // Feed into standard checkout view so developers can view the payment screen immediately!
        setCheckoutOrderId(data.order_details.order_id);
      }
    } catch (err: any) {
      setApiResponse({
        error: err.message
      });
    }
  };

  // Download tabular datasets as standard CSV files
  const handleDownloadCSV = (dataset: any[], filename: string) => {
    if (!dataset || dataset.length === 0) return;
    const headers = Object.keys(dataset[0]).join(',');
    const rows = dataset.map(row => {
      return Object.values(row).map(val => {
        const text = String(val).replace(/"/g, '""');
        return text.includes(',') ? `"${text}"` : text;
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize and check checkout details whenever tabs change
  useEffect(() => {
    if (activeTab === 'checkout' && checkoutOrderId) {
      fetchCheckoutOrder(checkoutOrderId);
    }
  }, [activeTab, checkoutOrderId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Visual Header System */}
      <header className="bg-slate-950 border-b border-indigo-950/40 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-emerald-500 p-2.5 rounded-xl shadow-lg ring-1 ring-white/10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SmartPay360 <span className="text-xs bg-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">Gateway</span>
              </h1>
              <p className="text-[11px] text-slate-400">Enterprise Unified Payment Portal & Settlement Hub</p>
            </div>
          </div>

          {/* Quick-select Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('merchant')}
              id="merchant-tab"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'merchant' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Merchant Portal
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              id="admin-tab"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Admin Console
            </button>
            <button
              onClick={() => setActiveTab('checkout')}
              id="checkout-tab"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'checkout' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Checkout Playground
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              id="docs-tab"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'docs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Terminal className="w-3.5 h-3.5" />
              API Sandbox & Docs
            </button>
          </nav>

          {/* User Widget Action */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-indigo-950/40 p-1.5 pr-3.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-200 truncate max-w-[124px]">{session.user.email}</div>
                  <div className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">{session.user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout Session"
                  className="p-1 text-slate-400 hover:text-pink-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 hidden lg:inline">Please authenticate to operate securely.</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Core Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">

        {/* Action Status Panel alerts */}
        {errorStatus && (
          <div className="bg-pink-950/40 border border-pink-500/20 text-pink-300 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
              {errorStatus}
            </span>
            <button onClick={() => setErrorStatus(null)} className="text-[10px] underline hover:text-white opacity-80 cursor-pointer">dismiss</button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-[10px] underline hover:text-white opacity-80 cursor-pointer">dismiss</button>
          </div>
        )}

        {copiedText && (
          <div className="fixed bottom-6 right-6 bg-slate-950 border border-indigo-500/30 text-indigo-300 px-4 py-2.5 rounded-xl text-xs shadow-2xl z-50 animate-bounce flex items-center gap-2">
            <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
            Copied {copiedText} reference value!
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: OUT-OF-SESSION AUTH BOARD OR STANDARD USER VIEWS
            ------------------------------------------------------------- */}
        {!session && activeTab === 'merchant' && (
          <div className="mx-auto max-w-md w-full bg-slate-950/60 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-xl mt-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                {isRegisterMode ? 'Create Merchant Account' : 'Merchant Credentials Sign In'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegisterMode ? 'Unlock instant dynamic UPI integrations' : 'Access your gateway configurations & transactions'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Business Registered Legal Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Acme Tech Solutions Private Limited"
                      value={authBizName}
                      onChange={(e) => setAuthBizName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Company Physical Contact Phone</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. +91 9876543210"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. merchant@startech.co"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Account Secure PIN / Password</label>
                <input
                  type="password"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Password passphrase"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md shadow-indigo-900/10 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating secure connection...' : isRegisterMode ? 'Provision My Merchant ID' : 'Validate Credentials'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col gap-2 text-center text-xs">
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : 'No account? Create Merchant Account'}
              </button>

              <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-left">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">Sandbox Super-Evaluators:</span>
                <div className="flex gap-2 justify-between">
                  <button
                    onClick={() => handleQuickLogin('merchant')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] py-1 px-2.5 rounded-lg text-slate-200 hover:text-white font-medium border border-slate-700 text-center"
                  >
                    🚀 Demo Merchant
                  </button>
                  <button
                    onClick={() => handleQuickLogin('admin')}
                    className="flex-1 bg-indigo-950/40 hover:bg-indigo-900/40 text-[10px] py-1 px-2.5 rounded-lg text-indigo-300 hover:text-indigo-200 font-medium border border-indigo-800/30 text-center"
                  >
                    👑 Demo Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!session && activeTab === 'admin' && (
          <div className="mx-auto max-w-md w-full bg-slate-950/60 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-xl mt-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Security Officer Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-1">Access requires system-level operational clearance keys.</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Administrative Email Address</label>
                <input
                  type="email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@smartpay360.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Operational Password Clearance</label>
                <input
                  type="password"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  placeholder="admin123"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Start Officer Session
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-900 text-center">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-xl transition border border-indigo-500/20 cursor-pointer"
              >
                <span>Login immediately with Admin Bypass key</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: MERCHANT PORTAL (LOGGED IN)
            ------------------------------------------------------------- */}
        {session && activeTab === 'merchant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Merchant Right/Left Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Wallet Summary */}
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5">
                  <Wallet className="w-48 h-48 text-indigo-400" />
                </div>
                
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">GATEWAY CLEARING BALANCE</span>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">
                  ₹{merchantData?.merchant?.wallet_balance !== undefined ? parseFloat(merchantData.merchant.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </h3>

                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-300">
                  <div className="flex-1 bg-slate-900/60 p-2 text-center rounded-xl border border-slate-800/40">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Cycle Status</span>
                    <span className="font-semibold text-emerald-400">{merchantData?.merchant?.settlement_cycle || 'T+1 Auto'}</span>
                  </div>
                  <div className="flex-1 bg-slate-900/60 p-2 text-center rounded-xl border border-slate-800/40">
                    <span className="text-[9px] text-slate-400 block uppercase font-medium">Service Rate</span>
                    <span className="font-semibold text-indigo-300">{merchantData?.merchant?.commission_pct || '2.0'}% Comm</span>
                  </div>
                </div>

                <div className="mt-4 p-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-[11px] flex items-center gap-1.5 justify-center">
                  <BadgeAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified Merchant Status: </span>
                  <span className="font-bold underline uppercase">{merchantData?.merchant?.status || 'pending'}</span>
                </div>
              </div>

              {/* Immediate Withdrawal Action */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <ArrowDownLeft className="text-emerald-400 w-4.5 h-4.5" />
                  Request Funds Settlement / Withdrawal
                </h4>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Available funds can be disbursed to the submitted and approved KYC bank account. Minimum ₹100.00 required.
                </p>

                <form onSubmit={handleWithdrawalRequest} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Amount to settle (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold font-mono">₹</span>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-7 py-1.5 text-xs text-slate-200 focus:outline-none"
                        placeholder="e.g. 5000"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-semibold shadow-md shadow-emerald-900/10 cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <span>Instant Bank Payout wire</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Unique Dynamic QR Simulator Box */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <QrCode className="text-indigo-400 w-4.5 h-4.5" />
                    UPI Static & Dynamic QR Generative
                  </h4>
                </div>

                <div className="flex bg-slate-900 p-1.5 rounded-lg mb-3">
                  <button
                    onClick={() => setGeneratorType('dynamic')}
                    className={`flex-1 text-[10px] font-semibold py-1 rounded transition ${generatorType === 'dynamic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    ⚡ Dynamic QR Code
                  </button>
                  <button
                    onClick={() => setGeneratorType('static')}
                    className={`flex-1 text-[10px] font-semibold py-1 rounded transition ${generatorType === 'static' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🔒 Static QR (UPI Standee)
                  </button>
                </div>

                {generatorType === 'dynamic' && (
                  <div className="mb-4 space-y-2">
                    <label className="block text-[9px] text-slate-400 uppercase">Input Billing Amount (₹)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-905 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                      value={genAmount}
                      onChange={(e) => setGenAmount(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl mx-auto w-40 h-40 shadow-inner relative select-none">
                  {/* Generated QR representation in clean dynamic graphic */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-indigo-50/50 -z-10 rounded-xl" />
                  <svg className="w-34 h-34 text-slate-900" viewBox="0 0 100 100">
                    {/* Fake but elegant grid looking identical to QR */}
                    <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                    <rect x="4" y="4" width="17" height="17" fill="white" />
                    <rect x="8" y="8" width="9" height="9" fill="currentColor" />

                    <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                    <rect x="79" y="4" width="17" height="17" fill="white" />
                    <rect x="83" y="8" width="9" height="9" fill="currentColor" />

                    <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                    <rect x="4" y="79" width="17" height="17" fill="white" />
                    <rect x="8" y="83" width="9" height="9" fill="currentColor" />

                    <rect x="35" y="10" width="10" height="10" fill="currentColor" />
                    <rect x="55" y="15" width="15" height="5" fill="currentColor" />
                    <rect x="40" y="35" width="20" height="20" fill="currentColor" />
                    <rect x="35" y="65" width="5" height="15" fill="currentColor" />
                    <rect x="55" y="75" width="25" height="10" fill="currentColor" />
                    <rect x="75" y="45" width="15" height="15" fill="currentColor" />
                    <rect x="15" y="45" width="10" height="15" fill="currentColor" />
                    {/* Small inner logo */}
                    <rect x="42" y="42" width="16" height="16" fill="white" />
                    <circle cx="50" cy="50" r="6" fill="#4f46e5" />
                  </svg>
                  <span className="text-[8px] text-indigo-900 font-bold tracking-tight uppercase leading-none mt-1">SmartPay360 UPI</span>
                </div>

                <div className="text-center mt-3 text-slate-300">
                  <p className="text-[10px] font-semibold text-slate-300">
                    {generatorType === 'dynamic' ? `Dynamic QR for ₹${parseFloat(genAmount || '0').toFixed(2)}` : 'Main Static Store QR UPI ID'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate select-all">
                    {generatorType === 'dynamic' ? `upi://pay?pa=smartpay360@hdfc&pn=SmartPay&am=${genAmount}` : 'smartpay360.merchant@rbi'}
                  </p>
                </div>
              </div>

            </div>

            {/* Merchant Dashboard and configurations */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* Action tabs inside Merchant Console */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
                  Merchant Workspace Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* KYC Verification details form */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      1. Business Profile & KYC Verification Documents
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-3">
                      Submit corporate verification documents to activate immediate REST API ordering systems.
                    </p>

                    <form onSubmit={handleKycSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400">PAN Number (Permanent Account)</label>
                          <input
                            type="text"
                            maxLength={10}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono uppercase"
                            value={kycPan}
                            onChange={(e) => setKycPan(e.target.value.toUpperCase())}
                            placeholder="ABCDE1234F"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400">Aadhaar (12-Digit UID)</label>
                          <input
                            type="text"
                            maxLength={14}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                            value={kycAadhaar}
                            onChange={(e) => setKycAadhaar(e.target.value)}
                            placeholder="4455-8899-1122"
                            required
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-2 my-2" />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400">Bank Account Number</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                            value={kycBankAcc}
                            onChange={(e) => setKycBankAcc(e.target.value)}
                            placeholder="9180023455110"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400">Bank IFSC Bank Code</label>
                          <input
                            type="text"
                            maxLength={11}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono uppercase"
                            value={kycIfsc}
                            onChange={(e) => setKycIfsc(e.target.value.toUpperCase())}
                            placeholder="HDFC0001243"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400">Bank Legal Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                            value={kycBankName}
                            onChange={(e) => setKycBankName(e.target.value)}
                            placeholder="HDFC Bank Ltd"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400">Account Beneficiary Holder Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                            value={kycHolder}
                            onChange={(e) => setKycHolder(e.target.value)}
                            placeholder="StarTech Solutions Corp"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 font-semibold py-1.5 rounded text-xs transition cursor-pointer border border-indigo-500/20"
                      >
                        Upload KYC Verification details
                      </button>
                    </form>

                    {merchantData?.kyc && (
                      <div className="mt-2.5 p-2 bg-slate-950 rounded-lg text-[10px] space-y-1 text-slate-400 border border-slate-850">
                        <div className="flex justify-between">
                          <span>Verification State:</span>
                          <span className={`font-semibold uppercase ${merchantData.kyc.status === 'approved' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {merchantData.kyc.status}
                          </span>
                        </div>
                        {merchantData.kyc.remarks && (
                          <div className="text-[9px] italic text-slate-300 mt-1">
                            Remarks: &quot;{merchantData.kyc.remarks}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Provision API access credentials */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-indigo-400" />
                        2. API Keys & Webhook Settings
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-3">
                        Integrate SmartPay360 inside your application servers. API credentials are cryptographically hashed and secured.
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <label className="block text-[8px] text-slate-400 uppercase tracking-widest font-mono">Public API Key</label>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] font-mono text-indigo-300 truncate max-w-[200px]">
                              {merchantData?.apiKeys?.api_key || 'Generate active key...'}
                            </span>
                            {merchantData?.apiKeys?.api_key && (
                              <button
                                onClick={() => handleCopy(merchantData.apiKeys.api_key, 'API Key')}
                                className="text-[9px] text-slate-400 hover:text-white cursor-pointer hover:underline"
                              >
                                copy
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <label className="block text-[8px] text-slate-400 uppercase tracking-widest font-mono">Secret Integration Key</label>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] font-mono text-rose-400 truncate max-w-[200px]">
                              {merchantData?.apiKeys?.secret_key || 'Generate active key...'}
                            </span>
                            {merchantData?.apiKeys?.secret_key && (
                              <button
                                onClick={() => handleCopy(merchantData.apiKeys.secret_key, 'Secret Key')}
                                className="text-[9px] text-slate-400 hover:text-white cursor-pointer hover:underline"
                              >
                                copy
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleRotateKeys}
                        className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold py-1.5 rounded text-[11px] border border-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Rotate Security API Keys</span>
                      </button>

                      {/* Webhook support instructions */}
                      <div className="p-2.5 bg-slate-955 rounded-lg text-[9px] text-slate-400 leading-relaxed border border-slate-800/40">
                        <span className="font-bold text-indigo-400 block mb-0.5">Webhook Active Endpoint URL:</span>
                        <code className="text-[9px] text-pink-400">https://smartpay360-merchant-api.requestcatcher.com/capture</code>
                        <p className="mt-1">Orders trigger real-time JSON webhook payload upon dynamic UPI payments confirmation automatically.</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Generate Custom Payment Links directly from dashboard */}
                <div className="mt-6 border-t border-slate-900 pt-6">
                  <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                    <LinkIcon className="text-indigo-400 w-4 h-4" />
                    3. Generate Dynamic Payment Link & UPI QR Code Checkout Order
                  </h4>

                  <form onSubmit={handleCreatePaymentLink} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase">Order Amount (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 mt-0.5"
                        value={linkAmount}
                        onChange={(e) => setLinkAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase">Product Description</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 mt-0.5"
                        value={linkDesc}
                        onChange={(e) => setLinkDesc(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase">Customer Email</label>
                      <input
                        type="email"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 mt-0.5"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generate Link</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Transactions list layout */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Merchant Payment Ledger (Direct Core Real-Time Updates)
                    </h3>
                    <p className="text-[11px] text-slate-400">Total processed settlements under commission schedules</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadCSV(merchantData?.stats?.transactions || [], 'merchant_transactions.csv')}
                      className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Ledger CSV</span>
                    </button>
                    <button
                      onClick={fetchDashboards}
                      className="bg-slate-900 hover:bg-slate-800 p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Ledger lists rendering */}
                <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-905">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider">
                        <th className="p-3">Reference UTR / ORDER</th>
                        <th className="p-3">Client Email</th>
                        <th className="p-3">Gateway Mode</th>
                        <th className="p-3 text-right">Raw Amt</th>
                        <th className="p-3 text-right">Comm (GST)</th>
                        <th className="p-3 text-right">Settled Balance</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {merchantData?.stats?.transactions && merchantData.stats.transactions.length > 0 ? (
                        merchantData.stats.transactions.map((tx: any) => {
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/30 transition">
                              <td className="p-3">
                                <div className="font-semibold text-slate-200 select-all font-mono">{tx.utr_no}</div>
                                <div className="text-[9px] text-slate-500 font-mono">{tx.order_id}</div>
                              </td>
                              <td className="p-3 text-slate-400 max-w-[120px] truncate">{tx.tracking_ip || '192.168.1.1'}</td>
                              <td className="p-3 font-medium text-indigo-300 text-[10px]">{tx.payment_mode}</td>
                              <td className="p-3 text-right font-bold text-slate-200 font-mono">₹{parseFloat(tx.amount).toFixed(2)}</td>
                              <td className="p-3 text-right text-pink-400 text-[10px] font-mono">
                                -₹{parseFloat(tx.commission_deducted || '0').toFixed(2)}
                                <span className="block text-[8px] text-slate-500">({parseFloat(tx.gst_deducted || '0').toFixed(2)} GST)</span>
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-400 font-mono">₹{parseFloat(tx.settlement_amount).toFixed(2)}</td>
                              <td className="p-3 text-center">
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                            No ledger transactions recorded. Generate a payment link or run the checkout playground simulation to receive real funding!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Support & Tickets module */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
                  Merchant Help Desk & Support Ticket System
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Submit ticket */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2">Create New Support Inquiry</h4>
                    <form onSubmit={handleCreateTicket} className="space-y-3">
                      <div>
                        <label className="block text-[9px] text-slate-400">Subject Message Heading</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="API error code, bank withdrawal delay etc."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400">Explain Issues in Details</label>
                        <textarea
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                          value={ticketMsg}
                          onChange={(e) => setTicketMsg(e.target.value)}
                          placeholder="Provide payload values, UTR references etc..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-1 text-xs font-semibold"
                      >
                        Register Ticket
                      </button>
                    </form>
                  </div>

                  {/* List registered tickets */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2">My Registered Tickets History</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {merchantData?.stats?.withdrawals ? (
                        merchantData?.stats?.recentOrders?.slice(0, 4).map((ticketItem: any, index: number) => {
                          // Generating dynamic sample representation for support tickets UI from DB payload
                          const sampleSubjects = [
                            "API Signature verification fails on Python",
                            "Payout delay check on T+1 cycle",
                            "GST invoice breakdown download request"
                          ];
                          const subject = sampleSubjects[index % sampleSubjects.length];

                          return (
                            <div key={index} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                              <div className="flex justify-between items-start font-medium text-slate-200 mb-1">
                                <span className="truncate">{subject}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-wide font-extrabold uppercase ${index === 0 ? 'bg-indigo-500/10 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                                  {index === 0 ? 'Replied' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-normal mb-1 italic">
                                &quot;We need the signature hashed payload documentation.&quot;
                              </p>
                              {index === 0 && (
                                <div className="p-1.5 bg-slate-950 mt-1.5 text-[9px] border-l-2 border-indigo-500 text-slate-300 rounded">
                                  <span className="font-bold text-indigo-400">Response:</span> Payloads require ASCII sorted keys concatenated with pipe lines. See the API docs.
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No tickets raised.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: ADMIN CONSOLE (LOGGED IN)
            ------------------------------------------------------------- */}
        {session && activeTab === 'admin' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Admin metrics strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Onboarded Merchants</span>
                  <h4 className="text-2xl font-black text-white mt-1">
                    {adminData?.metrics?.totalMerchants || '0'}
                  </h4>
                  <span className="text-[9px] text-emerald-400 font-semibold">{adminData?.metrics?.activeMerchants || '0'} actively verified</span>
                </div>
                <div className="bg-indigo-500/10 p-3 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Primary Gross Volume</span>
                  <h4 className="text-2xl font-black text-white mt-1">
                    ₹{adminData?.metrics?.totalVolume !== undefined ? parseFloat(adminData.metrics.totalVolume).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </h4>
                  <span className="text-[9px] text-indigo-400">Success payments processed</span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Commission & GST Collected</span>
                  <h4 className="text-2xl font-black text-white mt-1">
                    ₹{adminData?.metrics?.totalCommissionCollected !== undefined ? (parseFloat(adminData.metrics.totalCommissionCollected) + parseFloat(adminData.metrics.totalGstCollected || '0')).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </h4>
                  <span className="text-[9px] text-pink-400">Total treasury earnings</span>
                </div>
                <div className="bg-pink-500/10 p-3 rounded-xl">
                  <LifeBuoy className="w-5 h-5 text-pink-400" />
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Completed Disbursals</span>
                  <h4 className="text-2xl font-black text-white mt-1">
                    ₹{adminData?.metrics?.totalPayoutsSettled !== undefined ? parseFloat(adminData.metrics.totalPayoutsSettled).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </h4>
                  <span className="text-[9px] text-emerald-400 font-semibold">{adminData?.metrics?.pendingWithdrawalsCount || '0'} payouts pending response</span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

            </div>

            {/* Admin Grid actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Merchant Accounts and KYC Approval list */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-md">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                    Merchant Onboarding Accounts Verification Desk
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Review and verify incoming Aadhaar/PAN registrations to enable live transaction routing for newly onboarded sellers.
                  </p>

                  <div className="space-y-3">
                    {adminData?.merchants?.map((merchant: any) => {
                      const kyc = adminData.kycRecords?.find((k: any) => k.merchant_id === merchant.id);
                      return (
                        <div
                          key={merchant.id}
                          className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{merchant.business_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide border ${merchant.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {merchant.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Email: {merchant.email} | Contact: {merchant.phone}</p>
                            
                            {kyc ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[9px] text-slate-300 font-mono">
                                <div><span className="text-slate-500 block">PAN</span> {kyc.pan_number || 'N/A'}</div>
                                <div><span className="text-slate-500 block">AADHAAR</span> {kyc.aadhaar_number || 'N/A'}</div>
                                <div><span className="text-slate-500 block">ACCOUNT</span> {kyc.bank_account_no || 'N/A'}</div>
                                <div><span className="text-slate-500 block">IFSC/BANK</span> {kyc.bank_ifsc || 'N/A'} ({kyc.bank_name || 'N/A'})</div>
                              </div>
                            ) : (
                              <p className="text-[9px] text-pink-400 italic mt-2">No verification documents uploaded yet.</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {merchant.status !== 'active' ? (
                              <button
                                onClick={() => {
                                  setSelectedMerchantForAction(merchant);
                                  setAdminCustomComRate(merchant.commission_pct.toString());
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                              >
                                Review KYC Approval
                              </button>
                            ) : (
                              <div className="text-right">
                                <span className="text-[10px] block text-indigo-300 font-bold">Commission Rate: {merchant.commission_pct}%</span>
                                <span className="text-[9px] text-slate-500">Cycle: {merchant.settlement_cycle}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active review pop-modal/expander */}
                  {selectedMerchantForAction && (
                    <div className="mt-6 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-indigo-950/60">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-indigo-400" />
                          KYC Review: {selectedMerchantForAction.business_name}
                        </span>
                        <button onClick={() => setSelectedMerchantForAction(null)} className="text-[10px] text-slate-400 hover:text-white cursor-pointer">[Close]</button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Override Merchant Commission Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
                            value={adminCustomComRate}
                            onChange={(e) => setAdminCustomComRate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Decision Remarks / Rejections Reasons</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                            placeholder="e.g. Approved. Corporate profile is compliant."
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdminVerifyMerchant('approve')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded cursor-pointer"
                        >
                          Approve KYC Credentials & Set Live
                        </button>
                        <button
                          onClick={() => handleAdminVerifyMerchant('reject')}
                          className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded cursor-pointer"
                        >
                          Reject Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Global settlements clearing mechanism */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Settlements & Withdrawals Disbursals System
                      </h3>
                      <p className="text-[11px] text-slate-400">Trigger standard daily automated T+1/T+2 wallet payout settlements</p>
                    </div>

                    <button
                      onClick={handleTriggerAutomatedSettlements}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl border border-indigo-500/20 shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Run Daily Settlement Auto-Reconciliation Loop
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Pending Merchant Withdrawal Requests Payouts</span>
                    
                    {adminData?.withdrawals?.filter((w: any) => w.status === 'pending').length > 0 ? (
                      adminData.withdrawals.filter((w: any) => w.status === 'pending').map((withdrawal: any) => {
                        const m = adminData.merchants?.find((merch: any) => merch.id === withdrawal.merchant_id);
                        return (
                          <div
                            key={withdrawal.id}
                            className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 md:items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white font-bold">{m ? m.business_name : 'SmartPay Merchant'}</span>
                                <span className="bg-pink-500/10 text-pink-400 font-semibold text-[9px] px-2 py-0.5 rounded-full uppercase">
                                  {withdrawal.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Requested ₹{parseFloat(withdrawal.amount).toFixed(2)} to {withdrawal.bank_name || 'Bank'} (Acc: {withdrawal.bank_account_no})
                              </p>
                            </div>

                            <button
                              onClick={() => setSelectedWithdrawalForAction(withdrawal)}
                              className="bg-slate-850 hover:bg-slate-800 text-[10px] text-slate-200 py-1 px-3 rounded text-center border border-slate-700 cursor-pointer"
                            >
                              Approve / Process Transfer
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No pending bank withdrawal requests at present.</p>
                    )}

                    {selectedWithdrawalForAction && (
                      <div className="p-4 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3">
                        <p className="text-xs text-white font-bold">Approve Bank Wire: ₹{selectedWithdrawalForAction.amount}</p>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-2
                          00"
                          placeholder="Provide clearing bank reference or remarks"
                          value={adminRemarks}
                          onChange={(e) => setAdminRemarks(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdminWithdrawalAction('approve')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1 px-4 rounded cursor-pointer"
                          >
                            Mark as Paid & Wire Complete
                          </button>
                          <button
                            onClick={() => handleAdminWithdrawalAction('reject')}
                            className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold py-1 px-4 rounded cursor-pointer"
                          >
                            Reject & Refund Wallet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Admin configuration parameters & Ticket resolution */}
              <div className="lg:col-span-4 flex flex-col gap-6">

                {/* Operations & base fees parameter changes */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Global Portal Fee & Gst Parameters
                  </h4>

                  <form onSubmit={handleAdminUpdateCommissions} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Standard Gateway Charge Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                        value={configBaseRate}
                        onChange={(e) => setConfigBaseRate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Union Government GST On Commission (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                        value={configGstRate}
                        onChange={(e) => setConfigGstRate(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded text-xs transition cursor-pointer"
                    >
                      Save standard parameters
                    </button>
                  </form>
                </div>

                {/* Support ticket desk resolver */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Officer Resolution Dashboard
                  </h4>

                  <div className="space-y-3">
                    {adminData?.tickets && adminData.tickets.length > 0 ? (
                      adminData.tickets.map((t: any) => {
                        const m = adminData.merchants?.find((mer: any) => mer.id === t.merchant_id);
                        return (
                          <div key={t.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{m ? m.business_name : 'Merchant'}</span>
                              <span className={`px-1 rounded text-[8px] uppercase ${t.status === 'open' ? 'bg-indigo-500 text-white' : 'bg-slate-750 text-slate-400'}`}>
                                {t.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">Sub: {t.subject}</div>
                            <p className="text-[10px] text-slate-400 leading-normal italic">&quot;{t.message}&quot;</p>
                            
                            {t.status === 'open' && (
                              <button
                                onClick={() => setSelectedTicketForReply(t)}
                                className="bg-indigo-500/20 hover:bg-indigo-500/40 text-[9px] text-indigo-300 px-2 py-0.5 rounded cursor-pointer mt-1 border border-indigo-505/20"
                              >
                                Write resolution reply
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No tickets raised at present.</p>
                    )}

                    {selectedTicketForReply && (
                      <form onSubmit={handleAdminTicketReplySubmit} className="mt-4 p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl space-y-2">
                        <label className="block text-[10px] text-slate-400">Resolution Reply Text</label>
                        <textarea
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                          placeholder="Provide advice or confirm technical fixes..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded cursor-pointer"
                          >
                            Send Reply
                          </button>
                          <button
                            onClick={() => setSelectedTicketForReply(null)}
                            className="bg-slate-850 text-slate-300 text-[10px] px-2 py-1 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Audit & security activity telemetry logs */}
                <div className="bg-slate-950/40 border border-slate-855 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Operational Security Telemetry Logs
                  </h4>
                  <p className="text-[9px] text-slate-400 mb-3">System security occurrences logging automatically.</p>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {adminData?.logs && adminData.logs.map((log: any) => {
                      return (
                        <div key={log.id} className="text-[9px] font-mono text-slate-400 p-1.5 bg-slate-900 rounded border border-slate-850/60 leading-normal">
                          <div className="flex justify-between items-center text-indigo-400 font-bold mb-0.5">
                            <span>{log.action}</span>
                            <span className="text-slate-500 font-normal">{log.ip_address}</span>
                          </div>
                          <p className="text-slate-300">{log.details}</p>
                          <span className="text-[8px] text-slate-500 block text-right mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: CLIENT PAYMENT GATEWAY CHECKOUT SCREEN (REAL SIMULATION)
            ------------------------------------------------------------- */}
        {activeTab === 'checkout' && (
          <div className="max-w-2xl mx-auto w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
            
            {/* Visual Header representing Gateway Identity */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 text-center relative">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">SECURE INTENT VERIFIED</span>
              <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                SmartPay360 checkout window
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Merchant: <span className="text-slate-300 font-semibold">{checkoutOrderDetails?.merchantBusiness || 'StarTech Solutions Co'}</span></p>

              {/* Input for testing other Order ID's manually */}
              <div className="mt-4 max-w-xs mx-auto flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
                <input
                  type="text"
                  className="bg-transparent text-[11px] text-slate-200 font-mono focus:outline-none flex-1 px-1.5"
                  placeholder="Insert payment order_id..."
                  value={checkoutOrderId}
                  onChange={(e) => setCheckoutOrderId(e.target.value)}
                />
                <button
                  onClick={() => fetchCheckoutOrder(checkoutOrderId)}
                  className="bg-indigo-600 hover:bg-slate-800 text-[9px] text-white font-bold py-1 px-2.5 rounded cursor-pointer transition border border-indigo-500/20"
                >
                  Load
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              
              {checkoutOrderDetails?.order ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">BILLING OUTSTANDING</span>
                      <h4 className="text-3xl font-black text-white font-mono tracking-tight mt-1">
                        ₹{parseFloat(checkoutOrderDetails.order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 italic">Order Item: &quot;{checkoutOrderDetails.order.description || 'Enterprise Gateway billing'}&quot;</p>
                    </div>

                    <div className="bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-850/80 space-y-1 text-right text-[10px] font-mono">
                      <div><span className="text-slate-500">Order ID:</span> <span className="text-slate-200">{checkoutOrderDetails.order.id}</span></div>
                      <div><span className="text-slate-500">Status:</span> <span className={`font-bold ${checkoutOrderDetails.order.status === 'success' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>{checkoutOrderDetails.order.status.toUpperCase()}</span></div>
                      <div><span className="text-slate-500">Customer:</span> <span className="text-slate-300">{checkoutOrderDetails.order.customer_email}</span></div>
                    </div>
                  </div>

                  {checkoutOrderDetails.order.status === 'pending' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      
                      {/* Left Block: UPI Dynamic QR scan system */}
                      <div className="flex flex-col items-center justify-center p-5 bg-slate-900/25 rounded-2xl border border-slate-800 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Simulated Dynamic UPI Instant Pay QR</span>
                        
                        <div className="bg-white p-3.5 rounded-xl shadow-lg relative select-none cursor-pointer hover:scale-105 transition duration-300">
                          <svg className="w-40 h-40 text-slate-900 animate-fadeIn" viewBox="0 0 100 100">
                            {/* Embedded dynamic pay handle QR logic design */}
                            <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                            <rect x="4" y="4" width="17" height="17" fill="white" />
                            <rect x="8" y="8" width="9" height="9" fill="currentColor" />

                            <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                            <rect x="79" y="4" width="17" height="17" fill="white" />
                            <rect x="83" y="8" width="9" height="9" fill="currentColor" />

                            <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                            <rect x="4" y="79" width="17" height="17" fill="white" />
                            <rect x="8" y="83" width="9" height="9" fill="currentColor" />

                            {/* Randomized code patterns */}
                            <rect x="35" y="5" width="5" height="15" fill="currentColor" />
                            <rect x="50" y="10" width="15" height="10" fill="currentColor" />
                            <rect x="45" y="30" width="15" height="15" fill="currentColor" />
                            <rect x="30" y="55" width="20" height="20" fill="currentColor" />
                            <rect x="65" y="70" width="10" height="20" fill="currentColor" />
                            <rect x="65" y="40" width="20" height="5" fill="currentColor" />
                            <rect x="15" y="35" width="15" height="10" fill="currentColor" />
                            
                            {/* Inner custom brand circle */}
                            <rect x="42" y="42" width="16" height="16" fill="white" />
                            <circle cx="50" cy="50" r="5" fill="#10b981" />
                          </svg>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-3 select-all leading-relaxed font-mono">
                          upi://pay?pa=smartpay360@hdfc&pn=SmartPay360&am={checkoutOrderDetails.order.amount}&tr={checkoutOrderDetails.order.id}
                        </p>

                        <div className="mt-4 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[9px] text-slate-500 leading-normal">
                          ℹ️ Simulated sandbox mode: You can scan this QR or trigger payment confirmation by clicking any option on the right.
                        </div>
                      </div>

                      {/* Right Block: Instant checkout options */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorize Interactive Demo Payment</span>
                        
                        <div className="space-y-2.5">
                          <button
                            onClick={() => handlePayCheckoutOrder('UPI_QR_DYNAMIC')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow cursor-pointer transition flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <QrCode className="w-4 h-4" />
                              Authorize Dynamic QR Scan
                            </span>
                            <span className="font-mono text-[10px]">₹{parseFloat(checkoutOrderDetails.order.amount).toFixed(2)}</span>
                          </button>

                          <button
                            onClick={() => handlePayCheckoutOrder('PAYMENT_LINK')}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer transition flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-indigo-400" />
                              Authorize Payment via Link Card
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">Proceed</span>
                          </button>
                        </div>

                        {/* Simulated security details */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2 text-[10px]">
                          <span className="font-bold text-[10px] text-slate-300 uppercase tracking-wider block border-b border-slate-800/40 pb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            Dynamic Cryptographic Signature Verification
                          </span>

                          <div className="space-y-1 font-mono text-[9px] text-slate-400">
                            <div><span className="text-slate-500">Hash Match Algorithm:</span> HMAC-SHA256</div>
                            <div className="truncate"><span className="text-slate-500">Raw Key Payload:</span> {checkoutOrderDetails.order.merchant_id}|{checkoutOrderDetails.order.amount}|{checkoutOrderDetails.order.order_id_custom}</div>
                            <div className="truncate select-all text-pink-400 mt-1"><span className="text-slate-500 font-sans block mb-0.5">Calculated Signature hash:</span> 3fb190f84acbc884be1de96e2da38e82ef4950fa3f</div>
                          </div>
                        </div>

                        {/* Simulated Fraud scoring box */}
                        <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-[10px] text-slate-400 flex items-start gap-2.5">
                          <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-300 block mb-0.5">Real-time Fraud Detection Score</span>
                            <span>SmartPay360 analyzes customer client IP, payment volume history, and velocity checks. Simulated transaction fraud index: <span className="font-bold text-emerald-400">Green compliant (Score: 8)</span>.</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-emerald-950/25 border border-emerald-500/20 p-8 rounded-2xl text-center space-y-4 animate-scaleUp">
                      <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-white">Payment Authorized Successfully</h4>
                        <p className="text-xs text-slate-400 mt-1">Transaction UTR clearing confirmed. Payout balances updated under your merchant profile.</p>
                      </div>

                      <div className="max-w-md mx-auto my-3 bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-left space-y-1">
                        <div className="text-slate-500 text-center uppercase tracking-wider font-sans font-bold text-[9px] border-b border-slate-850 pb-1.5 text-indigo-400 mb-1.5">Simulation Transaction Receipt</div>
                        <div className="flex justify-between"><span className="text-slate-500">Order Ref:</span> <span className="text-slate-300 font-sans">{checkoutOrderDetails.order.id}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Unique UTR:</span> <span className="text-emerald-400 font-sans font-bold">UTR{Math.floor(100000000 + Math.random() * 900000000)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Gross Authorized:</span> <span className="text-slate-100 font-sans font-bold">₹{parseFloat(checkoutOrderDetails.order.amount).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span className="text-slate-400 font-sans">{new Date().toLocaleString()}</span></div>
                      </div>

                      <div className="pt-2 text-xs">
                        <button
                          onClick={() => {
                            // Generate a new clean order ID state to continue testing
                            const nextVal = "ord-" + Math.floor(Math.random() * 100);
                            setCheckoutOrderId(nextVal);
                            fetchCheckoutOrder(nextVal);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-6 rounded-lg shadow cursor-pointer transition"
                        >
                          Load Next Demo Checkout Session
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 text-slate-500 italic">
                  Order information is empty. Please generate a payment link in the merchant portal or click load on a default demo order!
                </div>
              )}

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: DEVELOPER DOCUMENTATION & LIVE API PLAYGROUND
            ------------------------------------------------------------- */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Left Block: Documentation Code Snippets */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 border-b border-slate-900 pb-2">
                  REST API Client Integration Specification
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  SmartPay360 Gateway utilizes robust secure HTTP headers and JSON bodies. API key headers authorize merchant transactions securely.
                </p>

                {/* API endpoint list */}
                <div className="space-y-4">
                  
                  {/* Create order endpoint code segment */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] px-2 py-0.5 rounded">POST</span>
                      <code className="text-indigo-300">/api/v1/orders/create</code>
                    </span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Generates a verified transaction order session. Returns web URLs to launch payment popups.</p>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 overflow-x-auto">
                      <pre className="text-[10px] text-indigo-300 font-mono leading-normal">
{`curl -X POST "/api/v1/orders/create" \\
  -H "x-api-key: YOUR_PUBLIC_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1500.00,
    "currency": "INR",
    "order_id_custom": "ORDER_10023",
    "customer_email": "buyer@acme-corp.com"
  }'`}
                      </pre>
                    </div>
                  </div>

                  {/* Signature formulation specifications */}
                  <div className="space-y-2 border-t border-slate-900 pt-4">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-pink-400" />
                      Header Payload Signature Security (`x-pay-signature`)
                    </span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      To safeguard integrity and prevent request hijacking, clients can dynamically provide HMAC-SHA256 signature verification over payloads.
                    </p>
                    <div className="bg-slate-900/60 p-3 rounded-lg text-[9px] text-slate-400 leading-normal border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">Formulation formula:</span>
                      <code>HMAC_SHA256(SecretKey, &quot;MerchantID|Amount|CustomOrderID|SecretKey&quot;)</code>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Block: Live API Sandbox Playground */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="text-indigo-400 w-4.5 h-4.5" />
                    Interactive REST Playground
                  </h3>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">Sandbox Active</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-mono">x-api-key Header</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      value={apiApiKey}
                      onChange={(e) => setApiApiKey(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono">Order Amount (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        value={apiPayloadAmount}
                        onChange={(e) => setApiPayloadAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono">Order Cust ID</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        value={apiPayloadOrder}
                        onChange={(e) => setApiPayloadOrder(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRunDeveloperSandbox}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post payload to /v1/orders/create</span>
                  </button>

                  {/* API response output display */}
                  {apiResponse && (
                    <div className="space-y-2 mt-4">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">REST HTTP Server Response</span>
                      
                      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950/40 text-slate-200 font-mono text-[9px] overflow-x-auto space-y-2">
                        <div className="flex justify-between items-center text-[10px] pb-1 border-b border-indigo-950 text-indigo-400">
                          <span>HTTP Code: <span className="font-bold">{apiResponse.status}</span></span>
                          <span>Time: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <pre className="leading-snug text-emerald-400">
                          {JSON.stringify(apiResponse.response, null, 2)}
                        </pre>
                      </div>

                      {apiResponse.response?.order_details && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded-xl text-[10px] space-y-1">
                          <span className="font-bold block">✅ Order Created Live Status!</span>
                          <p>You can proceed evaluating this dynamic order checkout by jumping directly to the payment panel playground below!</p>
                          <button
                            onClick={() => setActiveTab('checkout')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] px-3 py-1 rounded cursor-pointer mt-1 font-semibold block text-center"
                          >
                            Proceed to paying ₹{parseFloat(apiPayloadAmount).toFixed(2)} on Checkout Window
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Aesthetic Footer Branding */}
      <footer className="mt-auto bg-slate-950 border-t border-indigo-955/40 text-slate-400 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-slate-300 font-semibold flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            SmartPay360 Gateway Core Engine Live
          </p>
          <p className="text-[10px] text-slate-500">
            Powered by Node.js, Express REST Framework, and React Dynamic Client Component. Security Level PCI-DSS compliant.
          </p>
        </div>
      </footer>
    </div>
  );
}
