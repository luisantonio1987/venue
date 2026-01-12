import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { UserAccount, UserRole, UserPermissions } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { UserPlus, X, Download, RefreshCcw, KeyRound, CheckSquare, Square, Edit3, Trash2 } from 'lucide-react';

const SystemModule = ({ user }: { user: UserAccount }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  
  const modulesList = [
    { id: 'dashboard', label: 'Tablero' },
    { id: 'sales', label: 'Ventas/Proformas' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'dispatch', label: 'Despachos' },
    { id: 'returns', label: 'Retornos' },
    { id: 'pendings', label: 'Novedades' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'clients', label: 'Clientes' },
    { id: 'cash', label: 'Caja' },
    { id: 'system', label: 'Sistema' }
  ];

  const initialPermissions: UserPermissions = modulesList.reduce((acc, mod) => ({
    ...acc, 
    [mod.id]: { view: true, create: true, edit: true, delete: false, void: false, print: true }
  }), {});

  const [formData, setFormData] = useState({
    name: '', username: '', password: '', role: UserRole.STAFF,
    permissions: initialPermissions
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  useEffect(() => {
    // Regla 65: Respaldo persuasivo los lunes
    const isMonday = new Date().getDay() === 1;
    if (user.role === UserRole.ADMIN_TOTAL && isMonday) {
      setModal({
        isOpen: true, type: 'persuade', title: 'RESPALDO REQUERIDO',
        message: 'INICIANDO SEMANA: SE RECOMIENDA GENERAR UN RESPALDO INTEGRAL DE DATOS.',
        onConfirm: () => dbService.exportData()
      });
    }
    return dbService.subscribe((data: any) => {
      // Regla 84: Evitar duplicación
      const uniqueUsers = (data.users || []).filter((u: UserAccount, index: number, self: UserAccount[]) =>
        index === self.findIndex((t) => t.username === u.username)
      );
      setUsers(uniqueUsers);
    });
  }, []);

  const handleFactoryReset = async () => {
    if (resetPassword !== user.password) {
      setModal({ isOpen: true, type: 'danger', title: 'VALIDACIÓN FALLIDA', message: 'LA CONTRASEÑA NO ES CORRECTA.' });
      return;
    }
    await dbService.factoryReset();
  };

  const togglePermission = (modId: string, action: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [modId]: {
          ...prev.permissions[modId],
          [action]: !prev.permissions[modId][action as keyof typeof prev.permissions[string]]
        }
      }
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3.5rem] border shadow-sm gap-4">
        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">CONTROL DE SEGURIDAD</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => dbService.exportData()} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm"><Download size={18}/> RESPALDO</button>
          {user.role === UserRole.ADMIN_TOTAL && <button onClick={() => setResetConfirmOpen(true)} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-sm transition-all hover:bg-red-100"><RefreshCcw size={18}/> LIMPIEZA TOTAL</button>}
          <button onClick={() => setIsFormOpen(true)} className="px-8 py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><UserPlus size={18}/> NUEVO USUARIO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between group relative overflow-hidden">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg">{u.username.charAt(0)}</div>
                <div>
                   <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{u.name}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.role.replace('_', ' ')}</p>
                </div>
             </div>
             {/* Regla 86: Botones siempre visibles */}
             <div className="flex gap-1 action-button-container">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                <button onClick={() => {
                  setModal({ isOpen: true, type: 'danger', title: 'BORRAR USUARIO', message: `¿ESTÁ SEGURO DE REMOVER EL ACCESO DE ${u.name}?`, onConfirm: () => dbService.delete('users', u.id) });
                }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
             </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl p-12 space-y-10 animate-scale-in border-t-[16px] border-t-blue-600 my-auto">
            <div className="flex justify-between border-b pb-6">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">CREACIÓN DE ACCESO DETALLADO</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">MATRIZ DE PERMISOS POR MÓDULO (REGLA 76)</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-300 hover:text-red-500 transition-all"><X size={32} /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-4 space-y-6">
                  <div><label className="text-[10px] font-black text-slate-400 mb-2 block ml-1">NOMBRE COMPLETO</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-xs uppercase shadow-inner outline-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 mb-2 block ml-1">USUARIO LOGIN</label><input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-xs uppercase shadow-inner outline-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 mb-2 block ml-1">CONTRASEÑA</label><input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-xs uppercase shadow-inner outline-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 mb-2 block ml-1">ROL MAESTRO</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-black uppercase text-xs shadow-inner outline-none"><option value={UserRole.STAFF}>STAFF OPERATIVO</option><option value={UserRole.ADMIN_PARCIAL}>ADMINISTRADOR PARCIAL</option><option value={UserRole.ADMIN_TOTAL}>SUPER ADMINISTRADOR</option></select></div>
               </div>
               
               <div className="lg:col-span-8 overflow-x-auto no-scrollbar border rounded-[2rem] bg-slate-50 shadow-inner p-2">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b"><tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">MÓDULO</th><th className="px-2 text-center">VER</th><th className="px-2 text-center">CREAR</th><th className="px-2 text-center">EDITAR</th><th className="px-2 text-center">ANULAR</th><th className="px-2 text-center">BORRAR</th></tr></thead>
                    <tbody className="divide-y text-[10px] font-bold uppercase">
                      {modulesList.map(mod => (
                        <tr key={mod.id} className="hover:bg-white transition-colors">
                          <td className="px-6 py-4 text-slate-700">{mod.label}</td>
                          {['view', 'create', 'edit', 'void', 'delete'].map(action => (
                            <td key={action} className="px-2 text-center">
                              <button onClick={() => togglePermission(mod.id, action)} className="p-2 inline-block transition-transform active:scale-90">
                                {formData.permissions[mod.id]?.[action as keyof typeof formData.permissions[string]] ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-slate-200"/>}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
            
            <button 
              onClick={async () => { 
                await dbService.add('users', {...formData, status: 'ACTIVO', mustChangePassword: true, createdAt: Date.now()}); 
                setIsFormOpen(false); 
                setModal({isOpen: true, type: 'success', title: 'USUARIO REGISTRADO', message: 'ACCESO ACTIVADO. DEBERÁ CAMBIAR CLAVE AL INGRESO.'});
              }} 
              className="w-full py-6 shimmer-bg text-white rounded-[2.5rem] font-black uppercase text-[11px] shadow-2xl active:scale-95 transition-all"
            >
              REGISTRAR PERFIL DE ACCESO
            </button>
          </div>
        </div>
      )}

      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-md p-12 text-center space-y-10 border-t-[16px] border-red-600 animate-scale-in">
            <div className="mx-auto w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><RefreshCcw size={48}/></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">RESETEO DE FÁBRICA</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">BORRADO INTEGRAL DE DATOS. ESTA ACCIÓN NO SE PUEDE DESHACER.</p>
            </div>
            <div className="relative"><KeyRound size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"/><input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="PIN ADMIN" className="w-full p-6 pl-16 bg-slate-50 border-2 rounded-3xl font-black text-center text-2xl outline-none focus:border-red-500 shadow-inner" /></div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setResetConfirmOpen(false)} className="py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[10px] hover:bg-slate-200">CANCELAR</button>
              <button onClick={handleFactoryReset} className="py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-[10px] shadow-lg active:scale-95">BORRAR TODO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemModule;