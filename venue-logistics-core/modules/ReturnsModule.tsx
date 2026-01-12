import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Order, NoveltyItem, Product } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { RotateCcw, AlertTriangle, CheckCircle2, Search, PackageOpen, X, Check, ClipboardList } from 'lucide-react';

const ReturnsModule = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [novedadReport, setNovedadReport] = useState<{ 
    isOpen: boolean; 
    order: Order | null;
    itemsAffectation: Record<string, number>;
    observations: string;
  }>({ isOpen: false, order: null, itemsAffectation: {}, observations: '' });

  useEffect(() => {
    setProducts(dbService.getAll('products'));
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
        message: `¿CONFIRMA QUE TODO EL MOBILIARIO DEL PEDIDO ${o.id} HA REGRESADO EN PERFECTAS CONDICIONES?`,
        onConfirm: async () => {
          await dbService.update('orders', o.id, { status: 'RETIRO_EXITOSO', archivedAt: Date.now() });
          setModal({ isOpen: true, type: 'success', title: 'COMPLETADO', message: 'PEDIDO CERRADO Y ARCHIVADO.', autoClose: 1500 });
        }
      });
    } else {
      // Regla 79: Desplegar lista de items para novedades
      setNovedadReport({ 
        isOpen: true, 
        order: o, 
        itemsAffectation: {}, 
        observations: o.nuisances || '' 
      });
    }
  };

  const submitNovedad = async () => {
    if (!novedadReport.order) return;

    const noveltyItems: NoveltyItem[] = novedadReport.order.items
      .filter(item => (novedadReport.itemsAffectation[item.productId] || 0) > 0)
      .map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: item.name,
          quantityAffected: novedadReport.itemsAffectation[item.productId],
          replacementPrice: prod?.replacementPrice || 0,
          resolved: false
        };
      });

    if (noveltyItems.length === 0 && !novedadReport.observations.trim()) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS INCOMPLETOS', message: 'DEBE REGISTRAR AL MENOS UN ÍTEM AFECTADO O UNA OBSERVACIÓN.' });
      return;
    }

    await dbService.update('orders', novedadReport.order.id, { 
      status: 'INGRESO_PARCIAL',
      nuisances: novedadReport.observations.toUpperCase(),
      noveltyItems: noveltyItems
    });

    setNovedadReport({ isOpen: false, order: null, itemsAffectation: {}, observations: '' });
    setModal({ isOpen: true, type: 'success', title: 'NOVEDAD REGISTRADA', message: 'EL PEDIDO HA PASADO AL MÓDULO DE PENDIENTES.', autoClose: 1500 });
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

      {novedadReport.isOpen && novedadReport.order && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-8 space-y-6 animate-scale-in border-t-[12px] border-amber-500 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-4 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">REPORTE TÉCNICO DE NOVEDADES</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-2">PEDIDO: {novedadReport.order.id}</p>
              </div>
              <button onClick={() => setNovedadReport({ ...novedadReport, isOpen: false })} className="text-slate-300 hover:text-red-500 p-1 transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 py-2">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14}/> SELECCIONE ÍTEMS AFECTADOS:</p>
                <div className="border rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3">DESCRIPCIÓN</th>
                        <th className="px-4 py-3 text-center">ENTREGADOS</th>
                        <th className="px-4 py-3 text-center">NOVEDAD (CANT.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold uppercase text-[10px]">
                      {novedadReport.order.items.map(item => (
                        <tr key={item.productId} className="bg-white/50">
                          <td className="px-4 py-3 text-slate-700">{item.name}</td>
                          <td className="px-4 py-3 text-center text-slate-400">{item.quantity}</td>
                          <td className="px-4 py-3 flex justify-center">
                            <input 
                              type="number" 
                              min="0" 
                              max={item.quantity}
                              value={novedadReport.itemsAffectation[item.productId] === 0 ? '' : (novedadReport.itemsAffectation[item.productId] || '')}
                              onChange={e => {
                                const val = Math.min(item.quantity, parseInt(e.target.value) || 0);
                                setNovedadReport({
                                  ...novedadReport,
                                  itemsAffectation: { ...novedadReport.itemsAffectation, [item.productId]: val }
                                });
                              }}
                              placeholder="0"
                              className="w-16 p-2 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-xs text-red-600 shadow-sm outline-none focus:border-red-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OBSERVACIONES DETALLADAS:</p>
                <textarea 
                  value={novedadReport.observations}
                  onChange={e => setNovedadReport({ ...novedadReport, observations: e.target.value })}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold min-h-[100px] outline-none focus:border-amber-400 shadow-inner uppercase"
                  placeholder="INDIQUE DAÑOS, ROTURAS O PÉRDIDAS ESPECÍFICAS..."
                />
              </div>
            </div>

            <button onClick={submitNovedad} className="w-full py-5 bg-amber-500 text-white rounded-[1.8rem] font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shrink-0 active:scale-95">
              <Check size={20} strokeWidth={3}/> CONFIRMAR REPORTE DE NOVEDADES
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4 sticky top-0 z-40">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">GESTIÓN DE RETORNOS</h2>
        <div className="relative w-full md:w-64">
          <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR PEDIDO..." className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-black uppercase pr-12 outline-none shadow-inner focus:border-blue-500" />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(o => (
          <div key={o.id} className="bg-white rounded-[2.5rem] border shadow-sm p-6 space-y-5 hover:shadow-xl transition-all border-l-[12px] border-emerald-500 overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${o.status === 'EN_DESARROLLO' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{o.status.replace('_', ' ')}</span>
                <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[150px] mt-1 leading-none">{o.clientName}</h4>
                <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest leading-none">{o.id}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><RotateCcw size={18}/></div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner space-y-2">
               <div className="flex justify-between items-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">RETORNO PROGRAMADO</p>
                 <p className="text-[9px] font-black text-slate-700 leading-none">{new Date(o.eventDateEnd).toLocaleDateString('es-EC')}</p>
               </div>
            </div>
            {/* Regla 86: Botones siempre visibles */}
            <div className="flex gap-2 pt-2 action-button-container">
              <button onClick={() => handleReturnAction(o, 'PARTIAL')} className="flex-1 py-3.5 bg-white text-red-600 border border-red-100 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-red-50 shadow-sm transition-all"><AlertTriangle size={14}/> NOVEDAD</button>
              <button onClick={() => handleReturnAction(o, 'TOTAL')} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95"><CheckCircle2 size={16}/> RETIRO OK</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] space-y-4">
             <PackageOpen className="mx-auto text-slate-200" size={60} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SIN PEDIDOS POR RECOLECTAR</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsModule;