
import React, { useState } from 'react';
import { dbService } from '../firebaseService';
import { UserAccount } from '../types';
import { Logo } from '../App';
import { Eye, EyeOff, KeyRound, ArrowRight, User } from 'lucide-react';
import Modal, { ModalType } from '../components/Modal';

const LoginScreen = ({ onLogin }: { onLogin: (u: UserAccount) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    
    setTimeout(() => {
      const users = dbService.getAll('users');
      const u = users.find((x: UserAccount) => 
        x.username.toUpperCase() === username.toUpperCase() && 
        x.password?.toUpperCase() === password.toUpperCase()
      );
      
      if (u) {
        if(u.status === 'INACTIVO') {
           setModal({ isOpen: true, type: 'danger', title: 'ACCESO DENEGADO', message: 'SU CUENTA SE ENCUENTRA DESACTIVADA. CONTACTE AL ADMINISTRADOR.' });
           setLoading(false);
           return;
        }
        onLogin(u);
      } else {
        setModal({ isOpen: true, type: 'warning', title: 'DATOS INCORRECTOS', message: 'EL USUARIO O LA CONTRASEÑA NO COINCIDEN CON NUESTROS REGISTROS.' });
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <Modal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />
      
      <div className="bg-white rounded-[3.5rem] p-10 w-full max-w-lg shadow-2xl space-y-10 animate-scale-in relative z-10 border-t-[12px] border-blue-600">
        <div className="flex flex-col items-center">
          <Logo size="lg" />
          <h2 className="font-black uppercase text-slate-800 tracking-tighter text-2xl mt-8">ACCESO AL SISTEMA</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">USUARIO</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" value={username} onChange={e => setUsername(e.target.value.toUpperCase())} className="w-full p-6 pl-14 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black outline-none focus:border-blue-500 transition-all text-sm uppercase" placeholder="INGRESE SU ID" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CONTRASEÑA</label>
            <div className="relative">
              <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value.toUpperCase())} className="w-full p-6 pl-14 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black outline-none focus:border-blue-500 transition-all pr-14 text-sm tracking-[0.4em]" placeholder="••••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600">
                {show ? <EyeOff size={22}/> : <Eye size={22}/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 shimmer-bg text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'VERIFICANDO...' : 'ENTRAR'}
            <ArrowRight size={18} />
          </button>
          
          <button type="button" onClick={() => setModal({ isOpen: true, type: 'info', title: 'RECUPERAR ACCESO', message: 'PARA RESTABLECER SU CLAVE, POR FAVOR CONTACTE AL ADMINISTRADOR MAESTRO DEL SISTEMA.' })} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600">¿Olvidó su contraseña?</button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
