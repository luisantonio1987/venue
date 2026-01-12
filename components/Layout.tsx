
import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Truck, RotateCcw, Box, Users, Wallet, Database, Briefcase, Menu, X, Package, ClipboardList, LogOut, FileText, Landmark, Banknote
} from 'lucide-react';
import { UserAccount, CompanyData } from '../types';
import { Logo } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeModule: string;
  setActiveModule: (m: string) => void;
  onLogout: () => void;
  user: UserAccount;
  company: CompanyData | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeModule, setActiveModule, onLogout, user, company }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const modules = [
    { id: 'dashboard', label: 'Tablero', icon: <LayoutDashboard size={18} />, group: 'General' },
    { id: 'sales', label: 'Ventas / Proformas', icon: <ShoppingCart size={18} />, group: 'Operativo' },
    { id: 'confirmed', label: 'Control Pedidos', icon: <ClipboardList size={18} />, group: 'Operativo' },
    { id: 'dispatch', label: 'Despacho', icon: <Truck size={18} />, group: 'Operativo' },
    { id: 'returns', label: 'Retornos', icon: <RotateCcw size={18} />, group: 'Operativo' },
    { id: 'pendings', label: 'Novedades', icon: <Package size={18} />, group: 'Operativo' },
    { id: 'inventory', label: 'Inventario', icon: <Box size={18} />, group: 'Catálogos' },
    { id: 'clients', label: 'Clientes', icon: <Users size={18} />, group: 'Catálogos' },
    { id: 'cash', label: 'Caja Arqueo', icon: <Wallet size={18} />, group: 'Financiero' },
    { id: 'petty-cash', label: 'Caja Chica', icon: <Banknote size={18} />, group: 'Financiero' },
    { id: 'portfolio', label: 'Cartera / CxC', icon: <Landmark size={18} />, group: 'Financiero' },
    { id: 'reports', label: 'Reportes', icon: <FileText size={18} />, group: 'Financiero' },
    { id: 'system', label: 'Sistema', icon: <Database size={18} />, group: 'Configuración' },
    { id: 'company-config', label: 'Empresa', icon: <Briefcase size={18} />, group: 'Configuración' },
  ];

  const grouped = modules.reduce((acc: any, mod) => {
    if (!acc[mod.group]) acc[mod.group] = [];
    acc[mod.group].push(mod);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r z-[100] transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <Logo size="sm" />
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
            {Object.entries(grouped).map(([group, mods]: any) => (
              <div key={group}>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 px-3">{group}</p>
                <div className="space-y-1">
                  {mods.map((mod: any) => (
                    <button key={mod.id} onClick={() => { setActiveModule(mod.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black uppercase text-[10px] ${activeModule === mod.id ? 'shimmer-bg text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`} title={mod.label}>
                      {mod.icon}<span>{mod.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black uppercase text-[10px] text-red-500 hover:bg-red-50" title="SALIR DEL SISTEMA">
              <LogOut size={18} /><span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 sticky top-0 z-[50] flex-shrink-0">
          <div className="flex items-center gap-4 lg:w-1/3">
            <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
            <div className="hidden lg:block"><h2 className="text-[9px] font-black uppercase text-slate-800 tracking-tighter leading-none">{company?.fantasyName || 'VENUE LOGISTICS'}</h2></div>
          </div>
          <div className="lg:w-1/3 flex justify-center text-center"><div className="bg-slate-100/50 px-6 py-2 rounded-full border border-slate-200"><p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">{user.name}</p></div></div>
          <div className="lg:w-1/3 flex justify-end items-center gap-4"><button onClick={onLogout} className="p-2.5 text-slate-400 hover:text-red-500 transition-all"><LogOut size={20}/></button></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-7xl mx-auto w-full no-scrollbar">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
