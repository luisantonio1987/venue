
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { Wallet, RefreshCw, AlertCircle, Search, PackageCheck } from 'lucide-react';

const PendingsModule = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => o.status === 'INGRESO_PARCIAL');
      setOrders(list.sort((a, b) => b.orderDate - a.orderDate));
    });
  }, []);

  const resolveNuisance = async (o: Order, type: 'PAID' | 'REPLACED') => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'RESOLVER NOVEDAD',
      message: type === 'PAID' 
        ? `¿CONFIRMA QUE EL CLIENTE PAGÓ POR EL DAÑO? EL ÍTEM SE DARÁ DE BAJA DEFINITIVA DEL INVENTARIO.` 
        : `¿CONFIRMA QUE EL CLIENTE REPUSO EL ARTÍCULO? EL ÍTEM SE REINTEGRARÁ AL STOCK DISPONIBLE.`,
      onConfirm: async () => {
        await dbService.update('orders', o.id, { 
          status: 'RETIRO_EXITOSO',
          nuisancesResolved: true,
          resolutionType: type
        });
        setModal({ isOpen: true, type: 'success', title: 'RESUELTO', message: 'EL PEDIDO HA PASADO A INGRESO EXITOSO Y SE HA ARCHIVADO.', autoClose: 1500 });
      }
    });
  };

  const filtered = orders.filter(o => 
    (o.clientName || '').toUpperCase().includes(search.toUpperCase()) || 
    (o.id || '').toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 no-scrollbar relative">
      <Modal 
        isOpen={modal.isOpen} 
        type={modal.type} 
        title={modal.title} 
        message={modal.message} 
        onConfirm={modal.onConfirm} 
        autoClose={modal.autoClose}
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">PENDIENTES POR NOVEDAD</h2>
        <div className="relative w-full md:w-64">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="FILTRAR PENDIENTES..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black pr-12 outline-none shadow-inner" />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(o => (
          <div key={o.id} className="bg-white rounded-[2.5rem] border shadow-sm flex flex-col hover:shadow-xl transition-all border-l-[12px] border-amber-500 overflow-hidden relative group">
            <div className="p-7 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-800 uppercase text-xs leading-none">{o.clientName}</h4>
                  <p className="text-[9px] font-mono text-slate-400 mt-2 uppercase tracking-widest leading-none">{o.id}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle size={20}/>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">DETALLE DE LA NOVEDAD:</p>
                <p className="text-[11px] font-bold text-slate-700 italic leading-tight">"{o.nuisances || 'SIN DESCRIPCIÓN'}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => resolveNuisance(o, 'PAID')}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
                  title="REGISTRAR QUE EL CLIENTE PAGÓ EL ARTÍCULO"
                >
                  <Wallet size={16}/> PAGO
                </button>
                <button 
                  onClick={() => resolveNuisance(o, 'REPLACED')}
                  className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
                  title="REGISTRAR QUE EL CLIENTE REPUSO EL ARTÍCULO FÍSICAMENTE"
                >
                  <RefreshCw size={16}/> REPOSICIÓN
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center opacity-20 flex flex-col items-center">
             <PackageCheck size={80} />
             <p className="text-[10px] font-black uppercase tracking-widest mt-4">SIN PEDIDOS PENDIENTES DE RESOLUCIÓN</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingsModule;
