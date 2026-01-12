
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order, CompanyData } from '../types';
import { Search, Wallet, Printer, Calendar, ArrowRight, User } from 'lucide-react';
import PaymentForm from '../components/PaymentForm';

const PortfolioModule = ({ company }: { company: CompanyData | null }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => 
        o.status !== 'ANULADO' && o.status !== 'ARCHIVADO' && (o.total - o.paidAmount) > 0.01
      );
      setOrders(list.sort((a, b) => b.orderDate - a.orderDate));
    });
  }, []);

  const filtered = orders.filter(o => 
    o.clientName.toUpperCase().includes(search.toUpperCase()) || o.id.toUpperCase().includes(search.toUpperCase())
  );

  const totalPortfolio = filtered.reduce((sum, o) => sum + (o.total - o.paidAmount), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar">
      {selectedOrder && <PaymentForm order={selectedOrder} onSaved={() => setSelectedOrder(null)} onCancel={() => setSelectedOrder(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">CARTERA Y COBROS</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">GESTIÓN DE CUENTAS POR COBRAR</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DEUDA TOTAL FILTRADA</p>
              <p className="text-2xl font-black text-amber-600 font-mono tracking-tighter">${totalPortfolio.toFixed(2)}</p>
           </div>
           <div className="relative w-full md:w-64">
            <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="ID O CLIENTE..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none focus:border-blue-500 shadow-inner" />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(o => (
          <div key={o.id} className="bg-white rounded-[2.5rem] border shadow-sm p-6 space-y-5 hover:shadow-xl transition-all border-l-[12px] border-amber-500 group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-blue-600 font-mono tracking-widest">{o.id}</p>
                <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[200px]">{o.clientName}</h4>
              </div>
              <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors"><User size={18}/></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL VENTA</p>
                <p className="text-xs font-black text-slate-700">${o.total.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">SALDO PENDIENTE</p>
                <p className="text-xs font-black text-amber-600">${(o.total - o.paidAmount).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[9px] font-black text-slate-400 uppercase">
              <Calendar size={12}/> VENCIMIENTO: {new Date(o.eventDateEnd).toLocaleDateString()}
            </div>

            <button onClick={() => setSelectedOrder(o)} className="w-full py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Wallet size={16}/> LIQUIDAR SALDO <ArrowRight size={14}/>
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">SIN SALDOS PENDIENTES EN CARTERA</div>
        )}
      </div>
    </div>
  );
};

export default PortfolioModule;
