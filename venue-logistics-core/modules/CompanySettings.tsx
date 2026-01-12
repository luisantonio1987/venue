import React, { useState, useRef } from 'react';
import { dbService } from '../firebaseService';
import { CompanyData } from '../types';
import { Save, Camera, Image as ImageIcon, FileText, UploadCloud, Link as LinkIcon, Trash2, Globe } from 'lucide-react';
import Modal, { ModalType } from '../components/Modal';

const CompanySettings = ({ company }: { company: CompanyData | null }) => {
  const [formData, setFormData] = useState<Partial<CompanyData>>(company || {
    fantasyName: '', ruc: '', legalRep: '', regime: 'GENERAL',
    taxAddress: '', phoneFixed: '', phoneMobile: '', email: '', logoUrl: '', conditionsFileUrl: ''
  });
  
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const logoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [useUrlForLogo, setUseUrlForLogo] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, logoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    if(!formData.fantasyName || !formData.ruc) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS FALTANTES', message: 'EL NOMBRE Y EL RUC SON OBLIGATORIOS.' });
      return;
    }
    
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'ACTUALIZACIÓN CORPORATIVA',
      message: '¿CONFIRMA QUE LOS DATOS INGRESADOS SON CORRECTOS? ESTO AFECTARÁ TODOS LOS IMPRIMIBLES.',
      onConfirm: async () => {
        if(company) await dbService.update('company', company.id, formData);
        else await dbService.add('company', formData);
        setModal({ isOpen: true, type: 'success', title: 'CONFIGURACIÓN GUARDADA', message: 'EL PERFIL DE LA EMPRESA HA SIDO ACTUALIZADO.' });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 no-scrollbar">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">PARÁMETROS DE EMPRESA</h2>
        <button onClick={save} className="px-10 py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Save size={18}/> GUARDAR CAMBIOS</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[4rem] border shadow-sm flex flex-col items-center space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOGOTIPO EMPRESARIAL</h3>
            
            <div className="relative group">
              <div className="w-56 h-56 rounded-[3.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner">
                {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain p-6" /> : <ImageIcon size={64} className="text-slate-100" />}
              </div>
              <div className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-[3.5rem] transition-all gap-4">
                <button onClick={() => { setUseUrlForLogo(false); logoRef.current?.click(); }} className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-all" title="Cargar desde galería"><Camera size={24}/></button>
                <button onClick={() => setUseUrlForLogo(true)} className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-all" title="Ingresar URL de imagen"><LinkIcon size={24}/></button>
                {formData.logoUrl && <button onClick={() => setFormData({...formData, logoUrl: ''})} className="p-3 bg-red-500/50 rounded-full hover:bg-red-500 transition-all" title="Eliminar logotipo"><Trash2 size={24}/></button>}
              </div>
            </div>

            {useUrlForLogo && (
              <div className="w-full animate-scale-in">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-2">URL DEL LOGOTIPO</label>
                <input 
                  type="text" 
                  value={formData.logoUrl} 
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                  placeholder="https://ejemplo.com/logo.png" 
                  className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-[10px] font-bold outline-none focus:border-blue-500 shadow-inner" 
                />
              </div>
            )}
            
            <input type="file" ref={logoRef} className="hidden" onChange={handleLogoChange} accept="image/*" />
          </div>

          <div className="bg-blue-600 p-8 rounded-[3rem] text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-3"><FileText size={24}/> <h3 className="text-[11px] font-black uppercase tracking-widest">CONDICIONES (PDF)</h3></div>
             <p className="text-[9px] font-bold uppercase opacity-80 leading-relaxed">ARCHIVO DE FORMAS DE PAGO Y CONDICIONES DEL SERVICIO PARA IMPRIMIBLES.</p>
             <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border-2 border-white/20 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"><UploadCloud size={16}/> {formData.conditionsFileUrl ? 'ARCHIVO VINCULADO ✓' : 'CARGAR DOCUMENTO'}</button>
             <input type="file" ref={fileRef} className="hidden" accept=".doc,.docx,.pdf" onChange={(e) => { if(e.target.files?.[0]) setFormData({...formData, conditionsFileUrl: 'SIMULATED_URL'}) }} />
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">NOMBRE COMERCIAL (FANTASÍA)</label><input type="text" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black uppercase text-xs shadow-inner" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">RUC (13 DÍGITOS + 001)</label><input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value.replace(/\D/g,'')})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs shadow-inner" maxLength={13} /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">RÉGIMEN TRIBUTARIO</label><select value={formData.regime} onChange={e => setFormData({...formData, regime: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black uppercase text-xs shadow-inner"><option value="GENERAL">RÉGIMEN GENERAL</option><option value="RIMPE_EMPRENDEDOR">RIMPE EMPRENDEDORES</option><option value="RIMPE_POPULAR">RIMPE NEGOCIOS POPULARES</option></select></div>
          </div>
          <div className="space-y-8">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">REPRESENTANTE LEGAL</label><input type="text" value={formData.legalRep} onChange={e => setFormData({...formData, legalRep: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">DIRECCIÓN TRIBUTARIA</label><textarea value={formData.taxAddress} onChange={e => setFormData({...formData, taxAddress: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-[10px] min-h-[100px] shadow-inner" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;