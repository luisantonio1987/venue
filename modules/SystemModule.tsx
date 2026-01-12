
import React, { useState, useEffect } from 'react';
import { dbService } from '../firebaseService';
import { UserAccount, UserRole, ActionPermissions, UserPermissions } from '../types';
import Modal, { ModalType } from '../components/Modal';
import { 
  Database, Shield, UserPlus, Trash2, Edit3, X, Download, Check, AlertTriangle, RefreshCcw, KeyRound, Lock, Eye, EyeOff
} from 'lucide-react';

const SystemModule = ({ user }: { user: UserAccount }) => {
  const toUpper = (val: string) => (val || '').toUpperCase();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  
  const defaultActionPerms: ActionPermissions = { view: true, create: true, edit: true, delete: true, void: true, print: true };
  const initialPermissions: UserPermissions = {
    dashboard: { ...defaultActionPerms },
    sales: { ...defaultActionPerms },
    orders: { ...defaultActionPerms },
    dispatch: { ...defaultActionPerms },
    returns: { ...defaultActionPerms },
    pendings: { ...defaultActionPerms },
    inventory: { ...defaultActionPerms },
    clients: { ...defaultActionPerms },
    cash: { ...defaultActionPerms },
    system: { ...defaultActionPerms, delete: false },
    company: { ...defaultActionPerms, delete: false },
  };

  const [formData, setFormData] = useState({
    name: '', username: '', password: '', role: UserRole.STAFF,
    permissions: initialPermissions
  });

  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string; onConfirm?: () => void }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  useEffect(() => {
    // Regla 65: Persuasión de respaldo los lunes
    const isMonday = new Date().getDay() === 1;
    if (user.role === UserRole.ADMIN_TOTAL && isMonday) {
      setModal({
        isOpen: true,
        type: 'persuade',
        title: 'ALERTA DE SEGURIDAD',
        message: 'HOY ES LUNES. SE RECOMIENDA GENERAR UN RESPALDO INTEGRAL DE LA BASE DE DATOS PARA EVITAR PÉRDIDAS ACCIDENTALES.',
        onConfirm: () => dbService.exportData()
      });
    }

    return dbService.subscribe((data: any) => {
      // Eliminar duplicados si existen por algún error de concurrencia
      const uniqueUsers = data.users.reduce((acc: UserAccount[], curr: UserAccount) => {
        if (!acc.find(u => u.username === curr.username)) acc.push(curr);
        return acc;
      }, []);
      setUsers(uniqueUsers);
    });
  }, []);

  const handleSaveUser = async () => {
    if (!formData.name || !formData.username || (!editingUser && !formData.password)) {
      setModal({ isOpen: true, type: 'warning', title: 'DATOS FALTANTES', message: 'COMPLETE TODOS LOS CAMPOS OBLIGATORIOS.' });
      return;
    }

    const userData = {
      ...formData,
      name: toUpper(formData.name),
      username: toUpper(formData.username),
      password: toUpper(formData.password)
    };

    if (editingUser) {
      await dbService.update('users', editingUser.id, userData);
    } else {
      await dbService.add('users', { ...userData, status: 'ACTIVO', mustChangePassword: true, createdAt: Date.now() });
    }
    setIsFormOpen(false);
    setModal({ isOpen: true, type: 'success', title: 'EXITOSO', message: 'OPERADOR REGISTRADO CORRECTAMENTE.' });
  };

  const handleFactoryReset = async () => {
    if (resetPassword.toUpperCase() !== user.password?.toUpperCase()) {
      alert("CONTRASEÑA INCORRECTA");
      return;
    }
    await dbService.factoryReset();
  };

  const togglePermission = (module: keyof UserPermissions, action: keyof ActionPermissions) => {
    const newPerms = { ...formData.permissions };
    newPerms[module][action] = !newPerms[module][action];
    setFormData({ ...formData, permissions: newPerms });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 no-scrollbar">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[3.5rem] border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-3xl"><Database size={32}/></div>
          <div>
            <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">CONFIGURACIÓN DEL SISTEMA</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SEGURIDAD Y CONTROL DE ACCESOS</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => dbService.exportData()} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-sm hover:bg-slate-200 transition-all">
            <Download size={18}/> RESPALDO MANUAL
          </button>
          {user.role === UserRole.ADMIN_TOTAL && (
            <button onClick={() => setResetConfirmOpen(true)} className="px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
              <RefreshCcw size={18}/> RESETEO DE FÁBRICA
            </button>
          )}
          <button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="px-8 py-4 shimmer-bg text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
            <UserPlus size={18}/> NUEVO USUARIO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden">
           <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
             <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-[0.2em]">DIRECTORIO DE OPERADORES</h3>
             <span className="bg-white px-5 py-2 rounded-full text-[10px] font-black border shadow-inner">{users.length} CUENTAS ACTIVAS</span>
           </div>
           <div className="divide-y">
             {users.map(u => (
               <div key={u.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 shimmer-bg rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-md">
                    {u.username.charAt(0)}
                   </div>
                   <div>
                     <h4 className="font-black text-slate-800 uppercase text-sm mb-1">{u.name}</h4>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-lg uppercase tracking-widest">@{u.username}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{u.role.replace('_', ' ')}</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => { setEditingUser(u); setFormData({ ...u, password: '' }); setIsFormOpen(true); }} className="p-3 text-blue-600 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button>
                   <button onClick={() => {
                     setModal({
                       isOpen: true, type: 'danger', title: 'BORRAR ACCESO',
                       message: `¿CONFIRMA LA ELIMINACIÓN DE @${u.username}? ESTA ACCIÓN ES IRREVERSIBLE.`,
                       onConfirm: async () => await dbService.delete('users', u.id)
                     });
                   }} className="p-3 text-red-600 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                 </div>
               </div>
             ))}
           </div>
      </div>

      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-md p-12 space-y-10 animate-scale-in border-t-[16px] border-red-600">
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><AlertTriangle size={48}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">RESETEO INTEGRAL</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed tracking-widest px-4">ESTA ACCIÓN BORRARÁ TODO EL CONTENIDO DEL SISTEMA. INGRESE SU CONTRASEÑA PARA PROCEDER.</p>
            </div>
            <div className="space-y-6">
              <div className="relative">
                 <KeyRound size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"/>
                 <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="••••••••" className="w-full p-6 pl-16 bg-slate-50 border-2 rounded-3xl font-black text-center text-2xl outline-none focus:border-red-500 shadow-inner tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setResetConfirmOpen(false)} className="py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-sm">CANCELAR</button>
                <button onClick={handleFactoryReset} className="py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">LIMPIAR TODO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl p-12 space-y-10 animate-scale-in my-auto border-t-[16px] border-t-blue-600">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.3em]">{editingUser ? 'MODIFICAR OPERADOR' : 'REGISTRAR OPERADOR'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500 p-2 transition-all"><X size={32} /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">DATOS BÁSICOS</h4>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">NOMBRES COMPLETOS</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner outline-none focus:border-blue-500" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">ID USUARIO</label><input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner outline-none focus:border-blue-500" /></div>
                  {!editingUser && (
                    <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">CLAVE TEMPORAL</label><input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner outline-none focus:border-blue-500" /></div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">ROL DE SISTEMA</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase shadow-inner outline-none">
                      <option value={UserRole.STAFF}>OPERATIVO / STAFF</option>
                      <option value={UserRole.ADMIN_PARCIAL}>ADMINISTRADOR PARCIAL</option>
                      <option value={UserRole.ADMIN_TOTAL}>ADMINISTRADOR TOTAL</option>
                    </select>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">MATRIZ DE PERMISOS (Regla 76)</h4>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar border rounded-[2.5rem]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b sticky top-0 z-10">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">MÓDULO / FORMULARIO</th>
                          <th className="px-2 py-4 text-center">VER</th>
                          <th className="px-2 py-4 text-center">CREAR</th>
                          <th className="px-2 py-4 text-center">EDITAR</th>
                          <th className="px-2 py-4 text-center">BORRAR</th>
                          <th className="px-2 py-4 text-center">ANULAR</th>
                          <th className="px-2 py-4 text-center">IMP.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(Object.keys(formData.permissions) as Array<keyof UserPermissions>).map(mod => (
                          <tr key={mod} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 text-[10px] font-black uppercase text-slate-700 tracking-wider">{mod}</td>
                            {(Object.keys(formData.permissions[mod]) as Array<keyof ActionPermissions>).map(action => (
                              <td key={action} className="px-2 py-4 text-center">
                                <button onClick={() => togglePermission(mod, action)} className={`w-6 h-6 rounded-lg border-2 inline-flex items-center justify-center transition-all ${formData.permissions[mod][action] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                  <Check size={14} strokeWidth={4}/>
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            <button onClick={handleSaveUser} className="w-full py-6 shimmer-bg text-white rounded-[2.5rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
              <Check size={28} strokeWidth={3} /> {editingUser ? 'ACTUALIZAR CONFIGURACIÓN' : 'CREAR ACCESO SEGURO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemModule;
