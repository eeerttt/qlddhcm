
import React, { useState, useEffect } from 'react';
import { authService, API_URL } from '../services/mockBackend';
import { User, Branch } from '../types';
import { Lock, Mail, Loader2, KeyRound, ArrowLeft, UserPlus, Building, User as UserIcon, CheckCircle, ShieldCheck, Info, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
  systemName?: string;
  logoUrl?: string;
  footerText?: string;
  allowRegistration?: boolean;
  initialToken?: string | null;
  verificationToken?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onCancel, systemName, logoUrl, footerText, allowRegistration = true, initialToken, verificationToken }) => {
  // View states: LOGIN | FORGOT | VERIFY_REG_OTP | VERIFY_RESET_OTP | REGISTER
  const [view, setView] = useState<'LOGIN' | 'FORGOT' | 'VERIFY_REG_OTP' | 'VERIFY_RESET_OTP' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dialog State
  const [dialog, setDialog] = useState<{
      isOpen: boolean;
      type: 'success' | 'error' | 'info';
      title: string;
      message: string;
      onClose?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const showDialog = (type: 'success' | 'error' | 'info', title: string, message: string, onClose?: () => void) => {
      setDialog({ isOpen: true, type, title, message, onClose });
  };

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBranch, setRegBranch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (view === 'REGISTER') {
        const loadBranches = async () => {
            const data = await authService.getBranches();
            setBranches(data);
            if (data.length > 0) setRegBranch(data[0].id);
        };
        loadBranches();
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không đúng');
      showDialog('error', 'Đăng nhập thất bại', err.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
          if (!regBranch) throw new Error('Vui lòng chọn chi nhánh');
          await authService.register(regName, regEmail, regBranch);
          setOtpCode(''); // Reset OTP input
          setView('VERIFY_REG_OTP'); // Chuyển sang màn hình nhập OTP
      } catch (err: any) {
          setError(err.message || 'Đăng ký thất bại');
          showDialog('error', 'Lỗi đăng ký', err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyRegistration = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Gọi API verify với email và code
          // Lưu ý: Cần update service frontend để gửi thêm email
          // Ở đây giả lập gọi hàm verifyEmail với object body tùy chỉnh hoặc cập nhật authService
          const res = await fetch(`${API_URL}/api/auth/verify-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: regEmail, code: otpCode })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Xác thực thất bại");

          showDialog('success', 'Kích hoạt thành công', 'Tài khoản của bạn đã sẵn sàng. Vui lòng đăng nhập.', () => {
              setView('LOGIN');
              setEmail(regEmail);
          });
      } catch (e: any) {
          showDialog('error', 'Lỗi xác thực', e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setOtpCode('');
      setView('VERIFY_RESET_OTP');
    } catch (err: any) {
        setError(err.message || 'Gửi mã khôi phục thất bại');
        showDialog('error', 'Lỗi gửi mã', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
    }
    if (newPassword.length < 6) {
        setError("Mật khẩu phải từ 6 ký tự.");
        return;
    }

    setLoading(true);
    try {
      // Cần gọi API reset với email, code, newPassword
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, code: otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");

      showDialog('success', 'Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.', () => {
          setView('LOGIN');
      });
    } catch(err: any) {
        setError(err.message || 'Xác thực thất bại');
        showDialog('error', 'Lỗi đổi mật khẩu', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700 relative animate-in zoom-in-95 duration-200">
        <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
            Đóng
        </button>

        <div className="text-center mb-6">
          {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="mx-auto h-20 mb-4 object-contain" />
          ) : null}
          <h2 className="text-3xl font-bold text-blue-400 mb-2">{systemName || 'GeoMaster'}</h2>
          <p className="text-gray-400">Hệ thống Quản lý Đất đai Chuyên nghiệp</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2 uppercase font-black tracking-widest text-[10px]">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2.5 pl-10 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                  placeholder="Nhập Email..."
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2 uppercase font-black tracking-widest text-[10px]">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2.5 pl-10 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập'}
            </button>

            <div className="flex justify-between items-center text-xs mt-4">
                <button type="button" onClick={() => setView('FORGOT')} className="text-gray-400 hover:text-white hover:underline uppercase font-bold">
                    Quên mật khẩu?
                </button>
                {allowRegistration && (
                    <button type="button" onClick={() => setView('REGISTER')} className="text-blue-400 hover:text-blue-300 hover:underline uppercase font-bold">
                        Đăng ký tài khoản
                    </button>
                )}
            </div>
          </form>
        )}

        {/* --- VIEW: VERIFY REGISTRATION OTP --- */}
        {view === 'VERIFY_REG_OTP' && (
            <form onSubmit={handleVerifyRegistration} className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                        <Mail size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase">Xác thực tài khoản</h3>
                    <p className="text-xs text-gray-400 mt-2 px-4">
                        Chúng tôi đã gửi mã xác thực 6 số đến <b>{regEmail}</b>. Vui lòng nhập mã để kích hoạt.
                    </p>
                </div>

                <div>
                    <label className="block text-gray-400 text-[10px] uppercase font-black mb-1 text-center tracking-widest">Nhập mã xác thực</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-3 text-blue-500" size={20} />
                        <input 
                            type="text" 
                            value={otpCode} 
                            onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl p-3 pl-10 text-white focus:border-blue-500 outline-none text-center font-mono text-xl tracking-[0.5em] font-bold" 
                            required 
                            placeholder="000000"
                            autoFocus
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase text-xs shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'KÍCH HOẠT TÀI KHOẢN'}
                </button>
                
                <button type="button" onClick={() => setView('REGISTER')} className="w-full text-xs text-gray-500 hover:text-gray-300 uppercase font-bold mt-2">Quay lại đăng ký</button>
            </form>
        )}

        {/* --- VIEW: VERIFY RESET OTP & NEW PASSWORD --- */}
        {view === 'VERIFY_RESET_OTP' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in duration-300">
                <div className="text-center mb-4">
                    <ShieldCheck size={48} className="mx-auto text-orange-500 mb-2"/>
                    <h3 className="text-xl font-black text-white uppercase">Đặt lại mật khẩu</h3>
                    <p className="text-xs text-gray-400 mt-1">Nhập mã OTP từ email và mật khẩu mới.</p>
                </div>
                
                <div>
                    <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Mã xác thực (OTP)</label>
                    <input 
                        type="text" 
                        value={otpCode} 
                        onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2.5 text-white focus:border-orange-500 outline-none text-center font-mono text-lg tracking-widest font-bold" 
                        required 
                        placeholder="000000"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Mật khẩu mới</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2.5 text-white focus:border-blue-500 outline-none" required minLength={6} placeholder="••••••" />
                </div>
                <div>
                    <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Xác nhận mật khẩu</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2.5 text-white focus:border-blue-500 outline-none" required minLength={6} placeholder="••••••" />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase text-xs shadow-lg">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                </button>
                <button type="button" onClick={() => setView('FORGOT')} className="w-full text-xs text-gray-500 hover:text-gray-300 uppercase font-bold">Gửi lại mã</button>
            </form>
        )}

        {/* --- VIEW: FORGOT PASSWORD (EMAIL INPUT) --- */}
        {view === 'FORGOT' && (
            <form onSubmit={handleSendResetCode} className="space-y-6">
                <div className="text-center mb-4">
                    <KeyRound size={48} className="mx-auto text-orange-400 mb-2" />
                    <h3 className="text-xl font-black text-white uppercase">Quên mật khẩu?</h3>
                </div>
                <p className="text-gray-300 text-sm text-center">Nhập email đã đăng ký. Chúng tôi sẽ gửi <b>Mã xác thực</b> để bạn đặt lại mật khẩu.</p>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-3 pl-10 text-white focus:border-blue-500 outline-none shadow-inner"
                      placeholder="Nhập địa chỉ email của bạn..."
                      required
                    />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Gửi mã xác thực'}
                </button>
                <button type="button" onClick={() => setView('LOGIN')} className="w-full text-gray-400 text-xs font-bold uppercase hover:text-white flex items-center justify-center gap-2"><ArrowLeft size={14}/> Quay lại đăng nhập</button>
            </form>
        )}

        {/* --- VIEW: REGISTER --- */}
        {view === 'REGISTER' && (
             <form onSubmit={handleRegister} className="space-y-4">
                <h3 className="text-xl font-black text-white text-center uppercase mb-4">Đăng ký tài khoản</h3>
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Họ và Tên</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 pl-10 text-white focus:border-blue-500 outline-none" required placeholder="Nguyễn Văn A" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 pl-10 text-white focus:border-blue-500 outline-none" required placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase font-black mb-1">Chi nhánh</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <select value={regBranch} onChange={(e) => setRegBranch(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 pl-10 text-white focus:border-blue-500 outline-none appearance-none" required>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl mt-4 transition-all flex justify-center items-center gap-2 uppercase text-xs shadow-lg">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={18} /> Đăng ký ngay</>}
                </button>
                <div className="text-center mt-2">
                    <button type="button" onClick={() => setView('LOGIN')} className="text-xs text-gray-400 hover:text-white uppercase font-bold">Quay lại đăng nhập</button>
                </div>
             </form>
        )}

        {/* FOOTER TEXT */}
        {footerText && (
            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{footerText}</p>
            </div>
        )}
      </div>

      {/* --- SYSTEM DIALOG (MODAL) --- */}
      {dialog.isOpen && (
          <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 rounded-[2rem] w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden">
                  <div className="p-8 text-center flex flex-col items-center">
                      {dialog.type === 'success' && <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={28}/></div>}
                      {dialog.type === 'error' && <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={28}/></div>}
                      {dialog.type === 'info' && <div className="w-14 h-14 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-4"><Info size={28}/></div>}
                      
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{dialog.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-6">{dialog.message}</p>
                      
                      <button onClick={() => { setDialog({ ...dialog, isOpen: false }); dialog.onClose?.(); }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-95">OK</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;
