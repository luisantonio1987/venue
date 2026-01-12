
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Product } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { 
  Plus, Search, Box, Edit3, Trash2, X, CheckCircle2, 
  MinusCircle, PlusCircle, CheckSquare, Square, Download
} from 'lucide-react';

const InventoryModule = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [formData, setFormData] = useState({
    name: '', brand: '', stock: '', rentalPrice: '', replacementPrice: '', imageUrl: '', isService: false, isExcludedFromDiscount: false
  });

  useEffect(() => {
    return dbService.subscribe((data: any) => setProducts(data.products || []));
  }, []);

  const handleSave = async () => {
    if(!formData.name) return alert("EL NOMBRE ES OBLIGATORIO.");
    
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'CONFIRMAR ACCIÓN',
      message: editingProduct ? `¿DESEA GUARDAR LOS CAMBIOS PARA ${formData.name.toUpperCase()}?` : `¿REGISTRAR ${formData.name.toUpperCase()} EN EL CATÁLOGO?`,
      onConfirm: async () => {
        const data = { 
          ...formData, 
          name: formData.name.toUpperCase(), 
          brand: formData.brand.toUpperCase(),
          stock: parseInt(formData.stock as string) || 0,
          rentalPrice: parseFloat((formData.rentalPrice as string).replace(',', '.')) || 0,
          replacementPrice: parseFloat((formData.replacementPrice as string).replace(',', '.')) || 0
        };

        if(editingProduct) {
          await dbService.update('products', editingProduct.id, data);
        } else {
          const sequentialCode = await dbService.generateSequentialId('IN');
          await dbService.add('products', { 
            ...data, 
            code: sequentialCode, 
            history: [{ date: Date.now(), action: 'CREACIÓN', user: 'ADMIN' }] 
          });
        }
        closeForm();
        setModal({ isOpen: true, type: 'success', title: 'EXITOSO', message: 'EL REGISTRO SE HA PROCESADO.', autoClose: 1500 });
      }
    });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', brand: '', stock: '', rentalPrice: '', replacementPrice: '', imageUrl: '', isService: false, isExcludedFromDiscount: false });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    setModal({
      isOpen: true,
      type: 'danger',
      title: 'ELIMINACIÓN MASIVA',
      message: `ESTÁ POR ELIMINAR ${selectedIds.length} PRODUCTOS. ¿PROCEDE CON LA ACCIÓN?`,
      onConfirm: async () => {
        await dbService.deleteMultiple('products', selectedIds);
        setSelectedIds([]);
        setModal({ isOpen: true, type: 'success', title: 'COMPLETADO', message: 'REGISTROS ELIMINADOS.', autoClose: 1500 });
      }
    });
  };

  const filtered = products.filter(p => 
    (p.name || '').toUpperCase().includes(search.toUpperCase()) || 
    (p.code || '').toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-24 no-scrollbar relative">
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none">INVENTARIO</h2>
          {selectedIds.length > 0 && <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black animate-pulse">{selectedIds.length} SELECCIONADOS</span>}
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR..." className="w-full p-3 bg-slate-50 border rounded-xl text-[10px] font-black uppercase pr-10" />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>}
          <button onClick={() => setIsFormOpen(true)} className="px-6 py-3 shimmer-bg text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg"><Plus size={16}/> NUEVO PRODUCTO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filtered.map(p => (
          <div key={p.id} className={`bg-white p-4 rounded-[2rem] border shadow-sm space-y-3 hover:shadow-md transition-all relative group overflow-hidden ${selectedIds.includes(p.id) ? 'ring-4 ring-blue-500 border-transparent' : ''}`}>
            <button onClick={() => toggleSelect(p.id)} className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 backdrop-blur rounded-lg text-blue-600 border border-slate-100">
              {selectedIds.includes(p.id) ? <CheckSquare size={18}/> : <Square size={18} className="text-slate-300"/>}
            </button>
            <div className="aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden flex items-center justify-center text-slate-200">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Box size={32}/>}
            </div>
            <div className="space-y-0.5">
              <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest">{p.code}</p>
              <h3 className="font-black text-slate-800 uppercase text-[9px] truncate leading-tight">{p.name}</h3>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <span className="text-[10px] font-black text-slate-800">${(p.rentalPrice || 0).toFixed(2)}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black ${p.stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{p.stock} DISP.</span>
            </div>
            <div className="flex justify-end gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingProduct(p); setFormData({...p, stock: p.stock.toString(), rentalPrice: p.rentalPrice.toString(), replacementPrice: p.replacementPrice.toString()} as any); setIsFormOpen(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"><Edit3 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl p-10 space-y-6 animate-scale-in my-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{editingProduct ? 'MODIFICAR PRODUCTO' : 'REGISTRAR NUEVO'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">NOMBRE</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs outline-none" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">MARCA</label><input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase text-xs outline-none" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">STOCK</label><input type="text" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value.replace(/\D/g,'')})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs" /></div>
              </div>
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">PRECIO RENTA ($)</label><input type="text" value={formData.rentalPrice} onChange={e => setFormData({...formData, rentalPrice: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs text-blue-600" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">VALOR REPOSICIÓN ($)</label><input type="text" value={formData.replacementPrice} onChange={e => setFormData({...formData, replacementPrice: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs text-red-600" /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">URL IMAGEN</label><input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl text-[9px] font-bold" /></div>
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-5 shimmer-bg text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">
              <CheckCircle2 size={18} /> GUARDAR EN SISTEMA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
