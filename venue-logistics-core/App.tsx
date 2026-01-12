import React, { useState, useEffect } from 'react';
import { dbService, DbStatus } from './firebaseService';
import { UserAccount, CompanyData } from './types';
import Layout from './components/Layout';
import Modal, { ModalType } from './components/Modal';
import LoginScreen from './modules/LoginScreen';
import Dashboard from './modules/Dashboard';
import SalesModule from './modules/SalesModule';
import ConfirmedOrders from './modules/ConfirmedOrders';
import DispatchModule from './modules/DispatchModule';
import ReturnsModule from './modules/ReturnsModule';
import PendingsModule from './modules/PendingsModule';
import InventoryModule from './modules/InventoryModule';
import ClientsModule from './modules/ClientsModule';
import CashModule from './modules/CashModule';
import SystemModule from './modules/SystemModule';
import PortfolioModule from './modules/PortfolioModule';
import PettyCashModule from './modules/PettyCashModule';
import ReportsModule from './modules/ReportsModule';
import CompanySettings from './modules/CompanySettings';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Logo = ({ size = "md", light = false }: { size?: "sm" | "md" | "lg", light?: boolean }) => {
  const sizes = { sm: "h-10", md: "h-16", lg: "h-24" };
  return (
    <div className={`flex items-center gap-3 ${sizes[size]}`}>
      <div className="relative group">
        <svg viewBox="0 0 100 100" className="h-full overflow-visible shrink-0 drop-shadow-xl">
          <defs>
            <linearGradient id="logoGrad" x1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>
          <rect x="15" y="15" width="70" height="70" rx="18" fill="none" stroke="url(#logoGrad)" strokeWidth="12" className="animate-shimmer" />
          <circle cx="50" cy="50" r="18" fill="url(#logoGrad)" className="animate-pulse" />
          <rect x="42" y="42" width="16" height="16" rx="4" fill="white" className="animate-spin-slow" />
        </svg>
        <div className="absolute inset-0 shimmer-bg opacity-20 rounded-full blur-xl"></div>
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className={`font-black tracking-tighter uppercase ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'} ${light ? 'text-white' : 'shimmer-text'}`}>VENUE</span>
        <span className={`font-black tracking-[0.5em] uppercase opacity-60 ${size === 'lg' ? 'text-[11px]' : 'text-[8px]'} ${light ? 'text-blue-200' : 'text-slate-400'}`}>LOGISTICS</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState(() => sessionStorage.getItem('last_mod') || 'dashboard');
  const [dbStatus, setDbStatus] = useState<DbStatus>('loading');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const s = sessionStorage.getItem('v_user'); return s ? JSON.parse(s) : null;
  });
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [sessionMsg, setSessionMsg] = useState<{ visible: boolean; type: 'in' | 'out' }>({ visible: false, type: 'in' });
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, type: 'info', title: '', message: '' });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const hPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', hPrompt);
    const sub = dbService.subscribe((data: any, status: DbStatus) => {
      setDbStatus(status); setCompany(data.company?.[0] || null);
    });
    return () => { window.removeEventListener('beforeinstallprompt', hPrompt); sub(); };
  }, []);

  const navigateTo = (m: string) => { setActiveModule(m); sessionStorage.setItem('last_mod', m); };

  const handleLogin = (u: UserAccount) => {
    setSessionMsg({ visible: true, type: 'in' });
    setTimeout(() => {
      setCurrentUser(u); sessionStorage.setItem('v_user', JSON.stringify(u));
      setSessionMsg({ visible: false, type: 'in' });
    }, 1500);
  };

  const handleLogout = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'CERRAR SESIÓN',
      message: '¿ESTÁ SEGURO QUE DESEA SALIR DEL SISTEMA?',
      onConfirm: () => {
        setSessionMsg({ visible: true, type: 'out' });
        setTimeout(() => {
          sessionStorage.clear(); setCurrentUser(null);
          setSessionMsg({ visible: false, type: 'out' }); navigateTo('dashboard');
        }, 1500);
      }
    });
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const renderModule = () => {
    if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
    if (currentUser.mustChangePassword) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-md shadow-2xl space-y-8 animate-scale-in border-t-[16px] border-blue-600">
            <ShieldCheck className="mx-auto text-blue-600" size={60}/>
            <h2 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tighter">ACTUALIZAR CLAVE</h2>
            <input id="newPin" type="password" placeholder="NUEVO PIN" className="w-full p-6 bg-slate-50 border-4 rounded-3xl font-black text-center text-3xl outline-none focus:border-blue-500 uppercase tracking-widest" />
            <button onClick={async () => {
              const p = (document.getElementById('newPin') as HTMLInputElement).value;
              if(p.length < 3) return;
              await dbService.update('users', currentUser.id, { password: p.toUpperCase(), mustChangePassword: false });
              handleLogin({...currentUser, mustChangePassword: false});
            }} className="w-full py-6 shimmer-bg text-white rounded-3xl font-black uppercase text-[11px] shadow-2xl">ACTIVAR CUENTA</button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard': return <Dashboard setActiveModule={navigateTo} handleLogout={handleLogout} handleInstall={handleInstall} hasInstallPrompt={!!deferredPrompt} />;
      case 'sales': return <SalesModule onSaved={() => navigateTo('confirmed')} company={company} user={currentUser} />;
      case 'confirmed': return <ConfirmedOrders onEdit={() => navigateTo('sales')} company={company} user={currentUser} />;
      case 'dispatch': return <DispatchModule />;
      case 'returns': return <ReturnsModule />;
      case 'pendings': return <PendingsModule />;
      case 'inventory': return <InventoryModule />;
      case 'clients': return <ClientsModule user={currentUser} />;
      case 'cash': return <CashModule company={company} />;
      case 'petty-cash': return <PettyCashModule />;
      case 'portfolio': return <PortfolioModule company={company} />;
      case 'reports': return <ReportsModule />;
      case 'system': return <SystemModule user={currentUser} />;
      case 'company-config': return <CompanySettings company={company} />;
      default: return <Dashboard setActiveModule={navigateTo} handleLogout={handleLogout} handleInstall={handleInstall} hasInstallPrompt={!!deferredPrompt} />;
    }
  };

  if (dbStatus === 'loading') return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-10">
      <Logo size="lg" />
      <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-blue-600 w-1/3 animate-[shimmer_2s_infinite_linear]"></div></div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans antialiased bg-slate-50 no-scrollbar overflow-hidden">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, isOpen: false })} />
      {sessionMsg.visible ? (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center animate-fade-in">
          <div className="p-12 bg-white rounded-[3rem] flex flex-col items-center gap-6 shadow-2xl border-t-[12px] border-blue-600">
             <CheckCircle2 size={72} className="text-emerald-500 animate-bounce" />
             <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">{sessionMsg.type === 'in' ? 'BIENVENIDO' : 'ADIÓS'}</h2>
          </div>
        </div>
      ) : (
        !currentUser || currentUser.mustChangePassword ? renderModule() : (
          <Layout activeModule={activeModule} setActiveModule={navigateTo} onLogout={handleLogout} user={currentUser} company={company}>
            {renderModule()}
          </Layout>
        )
      )}
    </div>
  );
};

export default App;