import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order, NoveltyItem, Product } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { RefreshCw, AlertCircle, Search, PackageCheck, X, Check, Calculator, Coins } from 'lucide-react';
import PaymentForm from '../components/PaymentForm';

const PendingsModule = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [resolutionFlow, setResolutionFlow] = useState<{
    isOpen: boolean;
    order: Order | null;
    type: 'PAID' | 'REPLACED';
    selectedItems: Record<string, number>;
  }>({ isOpen: false, order: null, type: 'PAID', selectedItems: {} });

  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);

  useEffect(() => {
    return dbService.subscribe((data: any) => {
      const list = (data.orders || []).filter((o: Order) => o.status === 'INGRESO_PARCIAL');
      setOrders(list.sort((a, b) => b.orderDate - a.orderDate));
    });
  }, []);

  const openResolution = (o: Order, type: 'PAID' | 'REPLACED') => {
    setResolutionFlow({
      isOpen: true,
      order: o,
      type: type,
      selectedItems: {}
    });
  };

  const calculateTotalToPay = () => {
    if (!resolutionFlow.order || !resolutionFlow.order.noveltyItems) return 0;
    return resolutionFlow.order.noveltyItems.reduce((acc, item) => {
      const qty = resolutionFlow.selectedItems[item.productId] || 0;
      return acc + (qty * item.replacementPrice);
    }, 0);
  };

  const executeResolution = async () => {
    const { order, type, selectedItems } = resolutionFlow;
    if (!order || !order.noveltyItems) return;

    const entries = Object.entries(selectedItems).filter(([_, qty]) => (qty as number) > 0);
    if (entries.length === 0) {
      setModal({ isOpen: true, type: 'warning', title: 'SIN SELECCIÓN', message: 'DEBE SELECCIONAR AL MENOS UN ÍTEM PARA RESOLVER.' });
      return;
    }

    if (type === 'PAID') {
      const totalAmount = calculateTotalToPay();
      const noveltyOrder: Order = {
        ...order,
        total: totalAmount,
        paidAmount: 0,
        payments: []
      };
      
      setActivePaymentOrder(noveltyOrder);
      setResolutionFlow({ ...resolutionFlow, isOpen: false });
    } else {
      // Regla 79: Reponer artículos reintegrándolos al stock
      for (const [prodId, qty] of entries) {
        const q = qty as number;
        const prod = dbService.getAll('products').find((p: Product) => p.id === prodId);
        if (prod) {
          await dbService.update('products', prodId, { 
            stock: prod.stock + q,
            history: [...(prod.history || []), { date: Date.now(), action: `REPOSICIÓN POR NOVEDAD (PEDIDO ${order.id})`, user: 'SISTEMA', quantity: q }]
          });
        }
      }

      await dbService.update('orders', order.id, { 
        status: 'RETIRO_EXITOSO',
        nuisancesResolved: true,
        archivedAt: Date.now()
      });
      
      setResolutionFlow({ ...resolutionFlow, isOpen: false });
      setModal({ isOpen: true, type: 'success', title: 'STOCK ACTUALIZADO', message: 'LOS ARTÍCULOS HAN SIDO REINTEGRADOS AL INVENTARIO.', autoClose: 1500 });
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

      {activePaymentOrder && (
        <PaymentForm 
          order={activePaymentOrder} 
          onSaved={async () => {
            const originalOrder = orders.find(o => o.id === activePaymentOrder.id);
            if(originalOrder) {
              await dbService.update('orders', originalOrder.id, { 
                status: 'RETIRO_EXITOSO',
                nuisancesResolved: true,
                archivedAt: Date.now()
              });
            }
            setActivePaymentOrder(null);
            setModal({ isOpen: true, type: 'success', title: 'COBRO REGISTRADO', message: 'LA NOVEDAD HA SIDO LIQUIDADA.', autoClose: 1500 });
          }} 
          onCancel={() => setActivePaymentOrder(null)} 
        />
      )}

      {resolutionFlow.isOpen && resolutionFlow.order && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 space-y-6 animate-scale-in border-t-[12px] border-emerald-500 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                  {resolutionFlow.type === 'PAID' ? 'LIQUIDACIÓN DE FALTANTES' : 'REINTEGRO DE ARTÍCULOS'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-2">PEDIDO: {resolutionFlow.order.id}</p>
              </div>
              <button onClick={() => setResolutionFlow({ ...resolutionFlow, isOpen: false })} className="text-slate-300 hover:text-red-500 p-1 transition-all"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SELECCIONE CANTIDAD A {resolutionFlow.type === 'PAID' ? 'COBRAR' : 'REINTEGRAR'}:</p>
              <div className="divide-y border rounded-2xl bg-slate-50 shadow-inner">
                {resolutionFlow.order.noveltyItems?.map(item => (
                  <div key={item.productId} className="p-4 flex items-center justify-between group hover:bg-white transition-all">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase text-slate-800">{item.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">PENDIENTE: {item.quantityAffected} UDS.</p>
                      {resolutionFlow.type === 'PAID' && <p className="text-[10px] font-black text-emerald-600 font-mono">P. REPOSICIÓN: ${item.replacementPrice.toFixed(2)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        min="0"
                        max={item.quantityAffected}
                        value={resolutionFlow.selectedItems[item.productId] === 0 ? '' : (resolutionFlow.selectedItems[item.productId] || '')}
                        onChange={e => {
                          const val = Math.min(item.quantityAffected, parseInt(e.target.value) || 0);
                          setResolutionFlow({
                            ...resolutionFlow,
                            selectedItems: { ...resolutionFlow.selectedItems, [item.productId]: val }
                          });
                        }}
                        className="w-16 p-2 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-xs outline-none focus:border-emerald-500 shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex flex-col gap-4 shrink-0">
               {resolutionFlow.type === 'PAID' && (
                 <div className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center border-2 border-emerald-100 shadow-inner">
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Calculator size={16}/> TOTAL A LIQUIDAR:</span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">${calculateTotalToPay().toFixed(2)}</span>
                 </div>
               )}
               <button 
                onClick={executeResolution}
                className={`w-full py-5 rounded-[1.8rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${resolutionFlow.type === 'PAID' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}
               >
                 <Check size={20} strokeWidth={3}/> 
                 {resolutionFlow.type === 'PAID' ? 'PROCEDER AL COBRO' : 'CONFIRMAR REPOSICIÓN FÍSICA'}
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4 sticky top-0 z-40">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">PENDIENTES POR NOVEDAD</h2>
        <div className="relative w-full md:w-64">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="FILTRAR..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none shadow-inner focus:border-blue-500" />
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
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><AlertCircle size={20}/></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">ÍTEMS EN NOVEDAD:</p>
                <div className="space-y-1">
                  {o.noveltyItems?.map((ni, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                      <span>{ni.quantityAffected}x {ni.name}</span>
                      <span className="text-red-500 font-black">${(ni.quantityAffected * ni.replacementPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  <p className="text-[9px] font-bold text-slate-400 italic mt-3 border-t pt-2 uppercase">"{o.nuisances || 'SIN OBSERVACIÓN'}"</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => openResolution(o, 'PAID')} className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"><Coins size={16}/> COBRAR</button>
                <button onClick={() => openResolution(o, 'REPLACED')} className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"><RefreshCw size={16}/> REPONER</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] space-y-4">
             <PackageCheck className="mx-auto text-slate-200" size={60} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SIN PENDIENTES DE RESOLUCIÓN</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingsModule;