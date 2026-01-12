import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../firebaseService';
import { Product } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { 
  Plus, Search, Box, Edit3, Trash2, X, CheckCircle2, 
  MinusCircle, CheckSquare, Square, History, RefreshCcw, Camera
} from 'lucide-react';

const InventoryModule = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, type: 'STOCK' | 'BAJA', product: Product | null, value: string }>({
    isOpen: false, type: 'STOCK', product: null, value: ''
  });

  const [formData, setFormData] = useState({
    name: '', brand: '', stock: '', rentalPrice: '', replacementPrice: '', imageUrl: ''
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => setProducts(data.products || []));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if(!formData.name) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS FALTANTES', message: 'EL NOMBRE ES OBLIGATORIO.' });
      return;
    }
    
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'VALIDAR REGISTRO',
      message: editingProduct ? `¿GUARDAR CAMBIOS EN ${formData.name.toUpperCase()}?` : `¿REGISTRAR ${formData.name.toUpperCase()}?`,
      onConfirm: async () => {
        const data = { 
          ...formData, 
          name: formData.name.toUpperCase(), 
          brand: formData.brand.toUpperCase(),
          stock: parseInt(formData.stock) || 0,
          rentalPrice: parseFloat(formData.rentalPrice.replace(',', '.')) || 0,
          replacementPrice: parseFloat(formData.replacementPrice.replace(',', '.')) || 0
        };

        if(editingProduct) {
          await dbService.update('products', editingProduct.id, {
            ...data,
            history: [...(editingProduct.history || []), { date: Date.now(), action: 'EDICIÓN', user: 'ADMIN' }]
          });
        } else {
          const sequentialCode = await dbService.generateSequentialId('IT'); 
          await dbService.add('products', { 
            ...data, 
            code: sequentialCode, 
            history: [{ date: Date.now(), action: 'CREACIÓN', user: 'ADMIN' }] 
          });
        }
        closeForm();
        setModal({ isOpen: true, type: 'success', title: 'OPERACIÓN EXITOSA', message: 'CATÁLOGO ACTUALIZADO.', autoClose: 1500 });
      }
    });
  };

  const processAdjustment = async () => {
    const { type, product, value } = adjustModal;
    if (!product) return;
    const adjust = parseInt(value || '0');
    if (adjust === 0) return;

    if (type === 'BAJA') {
      const qty = Math.abs(adjust);
      if(qty > product.stock) {
        setModal({ isOpen: true, type: 'danger', title: 'ERROR DE STOCK', message: 'LA CANTIDAD SUPERA EL INVENTARIO ACTUAL.' });
        return;
      }
      await dbService.update('products', product.id, { 
        stock: product.stock - qty,
        history: [...(product.history || []), { date: Date.now(), action: `BAJA`, user: 'ADMIN', quantity: -qty }]
      });
    } else {
      await dbService.update('products', product.id, { 
        stock: product.stock + adjust,
        history: [...(product.history || []), { date: Date.now(), action: `REAJUSTE: ${adjust}`, user: 'ADMIN', quantity: adjust }]
      });
    }

    setAdjustModal({ ...adjustModal, isOpen: false, value: '' });
    setModal({ isOpen: true, type: 'success', title: 'STOCK ACTUALIZADO', message: 'EL MOVIMIENTO HA SIDO REGISTRADO.', autoClose: 1500 });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', brand: '', stock: '', rentalPrice: '', replacementPrice: '', imageUrl: '' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = products.filter(p => 
    (p.name || '').toUpperCase().includes(search.toUpperCase()) || 
    (p.code || '').toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-24 no-scrollbar relative">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} autoClose={modal.autoClose} onClose={() => setModal(p => ({...p, isOpen: false}))} />

      {adjustModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 space-y-6 animate-scale-in border-t-[12px] border-blue-600">
              <div className="text-center space-y-2">
                 <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter leading-none">{adjustModal.type === 'STOCK' ? 'REAJUSTAR STOCK' : 'DAR DE BAJA'}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{adjustModal.product?.name}</p>
              </div>
              <input type="number" value={adjustModal.value} onChange={e => setAdjustModal({...adjustModal, value: e.target.value})} className="w-full p-6 bg-slate-50 border-4 rounded-3xl font-black text-center text-4xl outline-none focus:border-blue-500" placeholder="0" />
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setAdjustModal({...adjustModal, isOpen: false, value: ''})} className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">CANCELAR</button>
                 <button onClick={processAdjustment} className="py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">PROCEDER</button>
              </div>
           </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-10 space-y-6 animate-scale-in border-t-[12px] border-blue-600 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4 shrink-0">
                 <h3 className="font-black text-slate-800 uppercase text-xs">HISTORIAL: {showHistory.name}</h3>
                 <button onClick={() => setShowHistory(null)} className="text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 py-2">
                 {(showHistory.history || []).map((h, i) => (
                   <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <div><p className="text-[10px] font-black text-slate-800 uppercase">{h.action}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(h.date).toLocaleString()}</p></div>
                      <span className={`text-[10px] font-black ${h.quantity && h.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{h.quantity || ''}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">INVENTARIO CATÁLOGO</h2>
          {selectedIds.length > 0 && <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black animate-pulse">{selectedIds.length} SELECCIONADOS</span>}
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="FILTRAR..." className="w-full p-3 bg-slate-50 border rounded-xl text-[10px] font-black uppercase pr-10 outline-none" />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button onClick={() => setIsFormOpen(true)} className="px-6 py-3 shimmer-bg text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg"><Plus size={16}/> NUEVO PRODUCTO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(p => (
          <div key={p.id} className={`bg-white rounded-[2.5rem] border shadow-sm p-6 space-y-4 hover:shadow-lg transition-all relative overflow-hidden group ${selectedIds.includes(p.id) ? 'ring-4 ring-blue-500' : ''}`}>
            <button onClick={() => toggleSelect(p.id)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-xl border">
              {selectedIds.includes(p.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-200"/>}
            </button>
            <div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden flex items-center justify-center relative">
              {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Box size={40} className="text-slate-200" />}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform">
                 <button onClick={() => setAdjustModal({ isOpen: true, type: 'STOCK', product: p, value: '' })} className="flex-1 py-2 bg-white/90 backdrop-blur text-blue-600 rounded-xl font-black text-[8px] uppercase shadow-sm flex items-center justify-center gap-1"><RefreshCcw size={10}/> REAJUSTE</button>
                 <button onClick={() => setAdjustModal({ isOpen: true, type: 'BAJA', product: p, value: '' })} className="flex-1 py-2 bg-white/90 backdrop-blur text-red-600 rounded-xl font-black text-[8px] uppercase shadow-sm flex items-center justify-center gap-1"><MinusCircle size={10}/> BAJA</button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-start">
                 <div><p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{p.code}</p><h3 className="font-black text-slate-800 uppercase text-xs leading-tight line-clamp-1">{p.name}</h3></div>
                 <span className={`px-2.5 py-1 rounded-full text-[8px] font-black ${p.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{p.stock} UDS.</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">MARCA: {p.brand || 'GENÉRICA'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t pt-4">
               <div><p className="text-[7px] font-black text-slate-300 uppercase">ALQUILER</p><p className="text-sm font-black text-slate-700">${p.rentalPrice.toFixed(2)}</p></div>
               <div className="text-right"><p className="text-[7px] font-black text-slate-300 uppercase">REPOSICIÓN</p><p className="text-sm font-black text-red-500">${p.replacementPrice.toFixed(2)}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 action-button-container">
               <button onClick={() => { setEditingProduct(p); setFormData({...p, stock: p.stock.toString(), rentalPrice: p.rentalPrice.toString(), replacementPrice: p.replacementPrice.toString()} as any); setIsFormOpen(true); }} className="p-3 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
               <button onClick={() => setShowHistory(p)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><History size={14}/></button>
               <button onClick={() => {
                 setModal({ isOpen: true, type: 'danger', title: 'ELIMINAR ÍTEM', message: '¿CONFIRMA ELIMINAR EL ARTÍCULO DEL CATÁLOGO?', onConfirm: () => dbService.delete('products', p.id) });
               }} className="p-3 bg-slate-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl p-10 space-y-6 animate-scale-in my-auto border-t-[16px] border-blue-600">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest leading-none">{editingProduct ? 'ACTUALIZAR ÍTEM' : 'NUEVO REGISTRO'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">NOMBRE ARTÍCULO</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs outline-none focus:border-blue-500" placeholder="NOMBRE..." /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">MARCA / MODELO</label><input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs outline-none" placeholder="MARCA..." /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">STOCK INICIAL</label><input type="text" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value.replace(/\D/g,'')})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs" placeholder="0" /></div>
              </div>
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">PRECIO ALQUILER ($)</label><input type="text" value={formData.rentalPrice} onChange={e => setFormData({...formData, rentalPrice: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs text-blue-600" placeholder="0.00" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">VALOR REPOSICIÓN ($)</label><input type="text" value={formData.replacementPrice} onChange={e => setFormData({...formData, replacementPrice: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs text-red-600" placeholder="0.00" /></div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">IMAGEN (GALERÍA / CÁMARA)</label>
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500">
                      {formData.imageUrl ? <img src={formData.imageUrl} className="h-12 w-12 object-cover rounded-lg mb-1" /> : <Camera size={20} className="mb-1" />}
                      <span className="text-[8px] font-black uppercase">CARGAR IMAGEN</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                    {formData.imageUrl && <button onClick={() => setFormData(p => ({...p, imageUrl: ''}))} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-5 shimmer-bg text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <CheckCircle2 size={18} /> CONFIRMAR Y REGISTRAR EN CATÁLOGO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;