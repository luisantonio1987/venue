
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order } from '../types';
import { 
  Calendar as CalendarIcon, Clock, AlertCircle, Wallet, ArrowRight, Quote, ChevronLeft, ChevronRight, 
  TrendingUp, Bell, Sparkles, CheckCircle2, Download, Plus, LogOut, Monitor
} from 'lucide-react';

const Dashboard = ({ setActiveModule }: { setActiveModule: (m: string) => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [quote, setQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const quotes = [
      { text: "LA ELEGANCIA NO ES DESTACAR, SINO SER RECORDADO.", author: "EQUIPO VENUE" },
      { text: "CADA EVENTO ES UNA OPORTUNIDAD PARA CREAR MAGIA.", author: "EQUIPO VENUE" },
      { text: "LA LOGÍSTICA IMPECABLE ES EL CORAZÓN DEL ÉXITO.", author: "REFLEXIÓN LOGÍSTICA" },
      { text: "UN BUEN SERVICIO SUPERA CUALQUIER EXPECTATIVA.", author: "FILOSOFÍA VENUE" }
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    const timer = setInterval(() => setNow(new Date()), 1000);
    const sub = dbService.subscribe((data) => setOrders(data.orders || []));
    return () => { clearInterval(timer); sub(); };
  }, []);

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const pendingPayments = orders.filter(o => (o.total || 0) > (o.paidAmount || 0) && o.status !== 'ANULADO' && o.status !== 'ARCHIVADO');
  const noveltyOrders = orders.filter(o => o.status === 'INGRESO_PARCIAL');

  return (
    <div className="space-y-6 animate-fade-in relative pb-10 no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">HOJA DE RUTA SEMANAL</h1>
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] mt-2">
             <CalendarIcon size={14} />
             <span>{now.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border shadow-inner">
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all"><ChevronLeft size={20}/></button>
          <span className="text-[10px] font-black uppercase px-6 min-w-[150px] text-center tracking-widest">NAVEGACIÓN</span>
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all"><ChevronRight size={20}/></button>
        </div>

        <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
          <Monitor size={16}/> INSTALAR APP
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayOrders = orders.filter(o => new Date(o.eventDateStart).toDateString() === day.toDateString());
          const isToday = day.toDateString() === new Date().toDateString();
          const isCritical = dayOrders.length >= 4;
          return (
            <div key={day.toString()} className={`bg-white rounded-[2.5rem] border min-h-[220px] flex flex-col transition-all overflow-hidden ${isToday ? 'border-blue-500 ring-4 ring-blue-50 shadow-xl scale-[1.02] z-10' : 'border-slate-100 shadow-sm opacity-90'} ${isCritical ? 'ring-4 ring-red-50 border-red-200' : ''}`}>
              <div className={`p-4 border-b text-center ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">{day.toLocaleDateString('es', { weekday: 'short' }).toUpperCase()}</p>
                <p className="text-xl font-black leading-none">{day.getDate()}</p>
                {isCritical && <div className="mt-1 flex justify-center text-red-500 animate-pulse" title="CARGA CRÍTICA"><Bell size={12}/></div>}
              </div>
              <div className="p-3 space-y-2 flex-1 overflow-y-auto no-scrollbar bg-slate-50/20">
                {dayOrders.map(o => (
                  <div key={o.id} onClick={() => setActiveModule('orders')} className="p-2.5 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                    <p className="text-[8px] font-black uppercase truncate text-slate-800 leading-tight">{o.clientName}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[7px] font-black text-slate-400 font-mono tracking-tighter">{o.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[160px] group border-t-[8px] border-t-blue-500 shadow-lg">
            <div className="absolute top-4 right-6 text-blue-100 group-hover:text-blue-500 transition-colors">
              <Sparkles size={32} />
            </div>
            <Quote className="text-blue-500 mb-3 opacity-50" size={24} />
            <p className="text-[11px] font-black text-slate-700 italic leading-relaxed uppercase tracking-tight">"{quote.text}"</p>
            <div className="mt-4 flex items-center gap-2">
               <div className="w-4 h-0.5 bg-blue-600"></div>
               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">— {quote.author}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex-1 min-h-[180px]">
             <div className="absolute top-0 right-0 w-32 h-32 shimmer-bg opacity-10 rounded-full -mr-16 -mt-16"></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-3 mb-6"><TrendingUp size={18}/> BALANCE RÁPIDO</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-2">EN DESARROLLO</p>
                  <span className="text-3xl font-black">{orders.filter(o => o.status === 'EN_DESARROLLO').length}</span>
                </div>
                <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-2">PENDIENTES</p>
                  <span className="text-3xl font-black text-blue-400">{pendingPayments.length}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center border-b pb-5">
              <h3 className="text-[12px] font-black uppercase text-slate-800 flex items-center gap-4"><AlertCircle className="text-red-500" size={24}/> NOVEDADES ACTIVAS</h3>
              <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[11px] font-black">{noveltyOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {noveltyOrders.map(o => (
                <div key={o.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-red-50/50 transition-all" onClick={() => setActiveModule('pendings')}>
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{o.clientName}</p>
                    <p className="text-[9px] font-bold text-red-400 mt-2 uppercase tracking-widest italic truncate max-w-[150px]">{o.nuisances || 'DAÑO SIN DETALLAR'}</p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-red-500 transition-colors"><ArrowRight size={20} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center border-b pb-5">
              <h3 className="text-[12px] font-black uppercase text-slate-800 flex items-center gap-4"><Wallet className="text-emerald-500" size={24}/> COBROS PENDIENTES</h3>
              <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-black">{pendingPayments.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {pendingPayments.map(o => (
                <div key={o.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{o.clientName}</p>
                    <p className="text-[14px] font-black text-emerald-600 mt-2 tracking-tighter font-mono">${((o.total || 0) - (o.paidAmount || 0)).toFixed(2)}</p>
                  </div>
                  <button onClick={() => setActiveModule('orders')} className="p-4 bg-white rounded-[1.5rem] text-emerald-500 hover:bg-emerald-600 hover:text-white border-2 border-emerald-50 shadow-sm transition-all"><Wallet size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
