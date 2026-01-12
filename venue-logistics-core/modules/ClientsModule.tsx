
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { Client, UserAccount } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { Search, Plus, Phone, Mail, MapPin, Edit3, Trash2, History, X, PhoneCall, CheckSquare, Square, Download } from 'lucide-react';

const ClientsModule = ({ user }: { user: UserAccount }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void; autoClose?: number }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [formData, setFormData] = useState({ name: '', identification: '', phone: '', email: '', address: '' });

  useEffect(() => {
    return dbService.subscribe((data: any) => setClients(data.clients || []));
  }, []);

  const handleSave = async () => {
    const idLen = formData.identification.length;
    if (idLen !== 10 && idLen !== 13) {
      setModal({ isOpen: true, type: 'warning', title: 'ID INVÁLIDO', message: 'LA IDENTIFICACIÓN DEBE TENER 10 O 13 DÍGITOS.' });
      return;
    }
    
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'VALIDAR INFORMACIÓN',
      message: editingClient ? `¿DESEA ACTUALIZAR EL EXPEDIENTE DE ${formData.name.toUpperCase()}?` : `¿DESEA REGISTRAR A ${formData.name.toUpperCase()} EN EL DIRECTORIO?`,
      onConfirm: async () => {
        const data = { 
          ...formData, 
          name: formData.name.toUpperCase(), 
          address: formData.address.toUpperCase(),
          email: formData.email.toLowerCase()
        };

        if (editingClient) {
          await dbService.update('clients', editingClient.id, data);
        } else {
          await dbService.add('clients', { ...data, createdAt: Date.now() });
        }
        closeForm();
        setModal({ isOpen: true, type: 'success', title: 'OPERACIÓN EXITOSA', message: 'EL DIRECTORIO DE CLIENTES HA SIDO ACTUALIZADO.', autoClose: 1500 });
      }
    });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
    setFormData({ name: '', identification: '', phone: '', email: '', address: '' });
  };

  const handleDelete = (c: Client) => {
    setModal({
      isOpen: true,
      type: 'danger',
      title: 'ELIMINACIÓN DE CLIENTE',
      message: `ADVERTENCIA: ¿ESTÁ SEGURO DE ELIMINAR A ${c.name}? ESTA ACCIÓN BORRARÁ TODO EL HISTORIAL DE TRANSACCIONES Y DATOS DE CONTACTO.`,
      onConfirm: async () => {
        await dbService.delete('clients', c.id);
        setModal({ isOpen: true, type: 'success', title: 'EXPEDIENTE BORRADO', message: 'EL CLIENTE HA SIDO REMOVIDO DEL SISTEMA.', autoClose: 1500 });
      }
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    setModal({
      isOpen: true,
      type: 'danger',
      title: 'ELIMINACIÓN MASIVA',
      message: `ESTÁ POR ELIMINAR ${selectedIds.length} CLIENTES. ¿CONFIRMA ESTA ACCIÓN IRREVERSIBLE?`,
      onConfirm: async () => {
        await dbService.deleteMultiple('clients', selectedIds);
        setSelectedIds([]);
        setModal({ isOpen: true, type: 'success', title: 'PROCESO COMPLETADO', message: 'LOS REGISTROS SELECCIONADOS HAN SIDO ELIMINADOS.', autoClose: 1500 });
      }
    });
  };

  const exportPDF = () => {
    window.print();
  };

  const filtered = clients.filter(c => 
    (c.name || '').toUpperCase().includes(search.toUpperCase()) || 
    (c.identification || '').includes(search)
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border shadow-sm gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">DIRECTORIO DE CLIENTES</h2>
          {selectedIds.length > 0 && (
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg">
              {selectedIds.length} SELECCIONADOS
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="BUSCAR POR NOMBRE O RUC..." className="w-full p-3 bg-slate-50 border rounded-xl text-[10px] font-black uppercase pr-10 outline-none focus:ring-2 ring-indigo-500/20" />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button onClick={exportPDF} title="DESCARGAR LISTADO COMPLETO DE CLIENTES EN PDF PARA ARCHIVO FÍSICO" className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Download size={16}/> DESCARGAR PDF
          </button>
          <button onClick={() => setIsFormOpen(true)} title="REGISTRAR UN NUEVO CLIENTE EN LA BASE DE DATOS" className="px-6 py-3 shimmer-bg text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
            <Plus size={16}/> NUEVO CLIENTE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-1 print:block">
        {filtered.map(c => (
          <div key={c.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4 relative group transition-all print:border-b print:rounded-none print:shadow-none ${selectedIds.includes(c.id) ? 'ring-4 ring-indigo-500 border-transparent' : 'hover:shadow-md'}`}>
            <button onClick={() => toggleSelect(c.id)} title="SELECCIONAR CLIENTE PARA ACCIONES POR LOTE" className="absolute top-4 right-4 z-10 p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600 transition-all active:scale-90 print:hidden">
              {selectedIds.includes(c.id) ? <CheckSquare size={20}/> : <Square size={20} className="text-slate-300"/>}
            </button>

            <div className="flex justify-between items-start print:hidden">
              <div className="w-12 h-12 shimmer-bg rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">{c.name ? c.name.charAt(0) : '?'}</div>
              <div className="flex gap-1 mr-10">
                <button onClick={() => { setEditingClient(c); setFormData(c); setIsFormOpen(true); }} title="EDITAR EXPEDIENTE Y DATOS DE CONTACTO" className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><Edit3 size={16}/></button>
                <button onClick={() => handleDelete(c)} title="ELIMINAR CLIENTE DEFINITIVAMENTE DEL SISTEMA" className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase text-xs truncate leading-none mb-1">{c.name}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{c.identification}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase" title="TELÉFONO DE CONTACTO"><Phone size={12}/> {c.phone}</div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 lowercase" title="CORREO ELECTRÓNICO"><Mail size={12}/> {c.email}</div>
              <div className="flex items-start gap-2 text-[9px] font-bold text-slate-500 uppercase leading-tight" title="DIRECCIÓN REGISTRADA"><MapPin size={12} className="shrink-0 mt-0.5"/> {c.address}</div>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-2 print:hidden">
               <button title="INICIAR UNA LLAMADA TELEFÓNICA CON EL CLIENTE" className="py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-blue-600 hover:text-white transition-all"><PhoneCall size={12}/> LLAMAR</button>
               <button title="REVISAR EL HISTORIAL DE COMPRAS Y PAGOS DEL CLIENTE" className="py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-slate-900 hover:text-white transition-all"><History size={12}/> HISTORIAL</button>
            </div>
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 animate-scale-in z-[100] border border-white/20 backdrop-blur-md print:hidden">
          <p className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} SELECCIONADOS</p>
          <div className="h-8 w-px bg-white/20"></div>
          <button onClick={handleBulkDelete} title="BORRAR PERMANENTEMENTE TODOS LOS CLIENTES SELECCIONADOS" className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
            <Trash2 size={16}/> ELIMINAR LOTE
          </button>
          <button onClick={() => setSelectedIds([])} title="DESACTIVAR SELECCIÓN" className="p-2 text-white/40 hover:text-white transition-colors"><X size={20}/></button>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar print:hidden">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-6 animate-scale-in my-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">EXPEDIENTE DE CLIENTE</h3>
              <button onClick={closeForm} title="CERRAR SIN GUARDAR CAMBIOS" className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">NOMBRES / RAZÓN SOCIAL</label>
                <input placeholder="EJ: JUAN PÉREZ / EMPRESA S.A." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">IDENTIFICACIÓN (CI / RUC)</label>
                <input placeholder="10 O 13 DÍGITOS NUMÉRICOS" value={formData.identification} onChange={e => setFormData({...formData, identification: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs shadow-inner outline-none focus:border-blue-500" maxLength={13} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">TELÉFONO</label>
                  <input placeholder="099..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs shadow-inner" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">EMAIL (MINÚSCULAS)</label>
                  <input placeholder="CORREO@DOMINIO.COM" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-xs shadow-inner" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">DIRECCIÓN</label>
                <textarea placeholder="DIRECCIÓN EXACTA PARA LOGÍSTICA" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-xs min-h-[100px] shadow-inner outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={handleSave} title="VALIDAR DATOS Y ACTUALIZAR EN LA BASE DE DATOS" className="w-full py-5 shimmer-bg text-white rounded-[1.8rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">VALIDAR Y GUARDAR CLIENTE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsModule;
