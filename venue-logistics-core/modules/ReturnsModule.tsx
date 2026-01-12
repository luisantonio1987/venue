
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { RotateCcw, AlertTriangle, CheckCircle2, Search, ArrowRight, PackageOpen, X, Check } from 'lucide-react';

const ReturnsModule = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  // Estado para capturar novedad mediante modal
  const [novedadPrompt, setNovedadPrompt] = useState<{ isOpen: boolean; orderId: string } | null>(null);
  const [novedadText, setNovedadText] = useState('');

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => 
        ['ENTREGADO', 'EN_DESARROLLO', 'POR_RETIRAR'].includes(o.status)
      );
      setOrders(list.sort((a, b) => a.eventDateEnd - b.eventDateEnd));
    });
  }, []);

  const handleReturnAction = async (o: Order, type: 'TOTAL' | 'PARTIAL') => {
    if (type === 'TOTAL') {
      setModal({
        isOpen: true,
        type: 'confirm',
        title: 'RETIRO EXITOSO',
        message: `¿CONFIRMA QUE TODO EL MOBILIARIO DEL PEDIDO ${o.id} HA REGRESADO EN PERFECTAS CONDICIONES? EL PEDIDO SE ARCHIVARÁ.`,
        onConfirm: async () => {
          await dbService.update('orders', o.id, { status: 'RETIRO_EXITOSO' });
          setModal({ isOpen: true, type: 'success', title: 'COMPLETADO', message: 'PEDIDO CERRADO Y ARCHIVADO.', autoClose: 1500 });
        }
      });
    } else {
      setNovedadPrompt({ isOpen: true, orderId: o.id });
    }
  };

  const submitNovedad = async () => {
    if (!novedadText.trim()) {
      setModal({ isOpen: true, type: 'warning', title: 'CAMPO VACÍO', message: 'DEBE DESCRIBIR LA NOVEDAD PARA PROCEDER.' });
      return;
    }
    
    const orderId = novedadPrompt?.orderId;
    if (orderId) {
      await dbService.update('orders', orderId, { 
        status: 'INGRESO_PARCIAL',
        nuisances: novedadText.toUpperCase()
      });
      setNovedadPrompt(null);
      setNovedadText('');
      setModal({ isOpen: true, type: 'success', title: 'REGISTRADO', message: 'NOVEDAD ASIGNADA AL PEDIDO.', autoClose: 1500 });
    }
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

      {/* Modal Personalizado para Novedades */}
      {novedadPrompt?.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-scale-in border-t-[12px] border-amber-500">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">REGISTRAR NOVEDAD</h3>
              <button onClick={() => setNovedadPrompt(null)} className="text-slate-300 hover:text-red-500 p-1 transition-all"><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DESCRIBA PÉRDIDAS, ROTURAS O DAÑOS:</p>
              <textarea 
                autoFocus
                value={novedadText}
                onChange={e => setNovedadText(e.target.value)}
                className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold min-h-[120px] outline-none focus:border-amber-500 shadow-inner uppercase"
                placeholder="EJ: 2 COPAS ROTAS, MANTEL MANCHADO..."
              />
            </div>
            <button onClick={submitNovedad} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition-all">
              <Check size={18}/> CONFIRMAR NOVEDAD
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">RETORNOS Y DEVOLUCIONES</h2>
        <div className="relative w-full md:w-64">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR PEDIDO O CLIENTE..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none shadow-inner" />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(o => (
          <div key={o.id} className="bg-white rounded-[2.5rem] border shadow-sm p-6 space-y-5 hover:shadow-xl transition-all border-l-[12px] border-emerald-500 overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase ${o.status === 'EN_DESARROLLO' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{o.status.replace('_', ' ')}</span>
                <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[150px] mt-1">{o.clientName}</h4>
                <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest">{o.id}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><RotateCcw size={18}/></div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner space-y-2">
               <div className="flex justify-between">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">FIN DEL EVENTO</p>
                 <p className="text-[9px] font-black text-slate-700 leading-none">{new Date(o.eventDateEnd).toLocaleDateString('es-EC')}</p>
               </div>
               <div className="flex justify-between border-t pt-2 border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase leading-none">CANTIDAD ÍTEMS</p>
                  <p className="text-[9px] font-black text-slate-700 leading-none">{(o.items || []).length}</p>
               </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleReturnAction(o, 'PARTIAL')} className="flex-1 py-3.5 bg-white text-red-600 border border-red-100 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-red-50 shadow-sm transition-all" title="REGISTRAR DAÑOS O FALTANTES EN EL PEDIDO"><AlertTriangle size={14}/> NOVEDAD</button>
              <button onClick={() => handleReturnAction(o, 'TOTAL')} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95" title="CONFIRMAR QUE TODO EL MOBILIARIO SE RECIBIÓ CORRECTAMENTE"><CheckCircle2 size={16}/> RETIRO OK</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] space-y-4">
             <PackageOpen className="mx-auto text-slate-200" size={60} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">NO HAY PEDIDOS PENDIENTES DE RETORNO</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsModule;
