import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  ShieldCheck,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  KeyRound,
  RotateCcw,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { Page, Address } from '../types';
import { AddressModal } from '../components/AddressModal';

interface ProfilePageProps {
  initialTab?: 'profile' | 'addresses';
  onNavigate: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab = 'profile', onNavigate }) => {
  const { user, openAuthModal, refreshUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>(initialTab);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Email with OTP State
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'input' | 'otp'>('input');
  const [emailOtpValues, setEmailOtpValues] = useState(['', '', '', '', '', '']);
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const [emailOtpCanResend, setEmailOtpCanResend] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpSubmitting, setEmailOtpSubmitting] = useState(false);
  const emailOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Nhà riêng',
    recipientName: '',
    phone: '',
    address: '',
    city: 'Hà Nội',
    isDefault: false,
  });

  // Change email timer effect
  useEffect(() => {
    let interval: any;
    if (isChangeEmailModalOpen && emailOtpStep === 'otp' && emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => {
          if (prev <= 1) {
            setEmailOtpCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isChangeEmailModalOpen, emailOtpStep, emailOtpTimer]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      fetchAddresses();
    }
  }, [user]);

  const handleOpenChangeEmail = () => {
    setNewEmail('');
    setEmailOtpStep('input');
    setEmailOtpValues(['', '', '', '', '', '']);
    setEmailOtpError(null);
    setEmailOtpSubmitting(false);
    setIsChangeEmailModalOpen(true);
  };

  const handleSendChangeEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    if (!newEmail.trim()) {
      setEmailOtpError('Vui lòng nhập địa chỉ email mới.');
      return;
    }
    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setEmailOtpError('Địa chỉ email mới phải khác email hiện tại.');
      return;
    }

    setEmailOtpSubmitting(true);
    try {
      await api.sendChangeEmailOtp({ newEmail: newEmail.trim() });
      setEmailOtpStep('otp');
      setEmailOtpTimer(60);
      setEmailOtpCanResend(false);
      setEmailOtpValues(['', '', '', '', '', '']);
      setTimeout(() => {
        emailOtpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setEmailOtpError(err.message || 'Lỗi khi gửi mã xác thực OTP.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const handleResendChangeEmailOtp = async () => {
    if (!emailOtpCanResend || emailOtpSubmitting) return;
    setEmailOtpError(null);
    setEmailOtpSubmitting(true);
    try {
      await api.sendChangeEmailOtp({ newEmail: newEmail.trim() });
      setEmailOtpTimer(60);
      setEmailOtpCanResend(false);
      setEmailOtpValues(['', '', '', '', '', '']);
      emailOtpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setEmailOtpError(err.message || 'Lỗi khi gửi lại mã OTP.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const handleEmailOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...emailOtpValues];
    newOtp[index] = cleanValue;
    setEmailOtpValues(newOtp);

    if (cleanValue && index < 5) {
      emailOtpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtpValues[index] && index > 0) {
      emailOtpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setEmailOtpValues(newOtp);
    const nextFocus = Math.min(pasted.length, 5);
    emailOtpInputsRef.current[nextFocus]?.focus();
  };

  const handleVerifyChangeEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    const otpCode = emailOtpValues.join('');
    if (otpCode.length !== 6) {
      setEmailOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setEmailOtpSubmitting(true);
    try {
      await api.verifyChangeEmailOtp({ newEmail: newEmail.trim(), otp: otpCode });
      await refreshUser();
      setIsChangeEmailModalOpen(false);
      setProfileMsg({ type: 'success', text: 'Đổi địa chỉ email thành công và đã được cập nhật!' });
    } catch (err: any) {
      setEmailOtpError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await api.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      await api.updateProfile({
        fullName,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: 'Nhà riêng',
      recipientName: user?.fullName || '',
      phone: user?.phone || '',
      address: '',
      city: 'Hà Nội',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressForm);
        toast.success('Đã cập nhật địa chỉ thành công!');
      } else {
        await api.createAddress(addressForm);
        toast.success('Đã thêm địa chỉ mới thành công!');
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu địa chỉ.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await api.deleteAddress(id);
      toast.success('Đã xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa địa chỉ.');
    }
  };

  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      await api.updateAddress(addr.id, { isDefault: true });
      toast.success('Đã đặt làm địa chỉ mặc định!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đặt làm địa chỉ mặc định.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 shadow-2xs">
          <UserIcon size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Tài Khoản Khách Hàng</h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Vui lòng đăng nhập để xem thông tin hồ sơ cá nhân và quản lý sổ địa chỉ nhận hàng.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="btn-accent px-6 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const userInitial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* 1. Top Tab Navigation Bar (Only Profile & Address Book) */}
      <div className="flex justify-center gap-3 relative">
        {[
          { id: 'profile', label: 'Hồ Sơ & Bảo Mật', icon: UserIcon },
          { id: 'addresses', label: `Sổ Địa Chỉ Nhận Hàng (${addresses.length})`, icon: MapPin },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                isActive
                  ? 'border-ink-900 text-white shadow-xs'
                  : 'border-cream-200 text-ink-700 hover:border-cream-300 hover:bg-cream-50 bg-white shadow-2xs'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="profile-tab-capsule"
                  className="absolute inset-0 bg-ink-900 rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TAB 1: HỒ SƠ & BẢO MẬT */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-cream-200 p-8 sm:p-10 shadow-xs space-y-8 animate-fade-in">
          {/* Avatar & Title Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-accent-50 text-accent-700 border border-accent-200 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
              {userInitial}
            </div>
            <h3 className="font-display font-bold text-2xl text-ink-900">Hồ Sơ Cá Nhân</h3>
            <p className="text-xs text-ink-500">Cập nhật thông tin và quản lý tài khoản của bạn</p>
          </div>

          {/* Feedback messages */}
          {profileMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-accent-50 border border-accent-200 text-accent-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl mx-auto">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-700">Địa chỉ Email</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-accent-700 bg-accent-50 border border-accent-200 px-2 py-0.5 rounded-full">
                    Đã xác thực
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenChangeEmail}
                    className="text-[11px] font-bold text-accent-600 hover:text-accent-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Mail size={12} />
                    <span>Thay đổi Email</span>
                  </button>
                </div>
              </div>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-3 bg-cream-100/60 border border-cream-200 rounded-2xl text-sm text-ink-600 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5">Họ và tên</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn Phục"
                className="w-full px-4 py-3 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white transition-all text-ink-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5">Số điện thoại liên hệ</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0909123456"
                className="w-full px-4 py-3 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white transition-all text-ink-800 font-medium"
              />
            </div>

            <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-2.5 text-xs text-ink-600">
              <ShieldCheck size={18} className="text-accent-500 shrink-0" />
              <span>Tài khoản được bảo mật xác thực với Sanctum / JWT Bearer Token & Email OTP.</span>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Lưu Thay Đổi'
              )}
            </button>
          </form>
        </div>
      )}

      {/* 3. TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG */}
      {activeTab === 'addresses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-2xl text-ink-900">Sổ Địa Chỉ Nhận Hàng</h3>
              <p className="text-xs text-ink-500 mt-0.5">
                Lưu nhiều địa chỉ để tự động điền nhanh khi mua hàng & giao hỏa tốc
              </p>
            </div>

            <button
              onClick={handleOpenAddAddress}
              className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Thêm Địa Chỉ Mới
            </button>
          </div>

          {loadingAddresses ? (
            <div className="p-12 text-center text-ink-400">Đang tải danh sách địa chỉ...</div>
          ) : addresses.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-cream-200 text-center space-y-3">
              <MapPin size={36} className="text-cream-300 mx-auto" />
              <p className="font-bold text-ink-800">Chưa có địa chỉ nhận hàng nào</p>
              <p className="text-xs text-ink-400">Hãy thêm địa chỉ giao hàng để đặt mua camera dễ dàng hơn</p>
              <button
                onClick={handleOpenAddAddress}
                className="btn-accent px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                + Thêm địa chỉ đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white p-6 rounded-3xl border transition-all shadow-2xs ${
                    addr.isDefault
                      ? 'border-accent-500 ring-2 ring-accent-500/10'
                      : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <h4 className="font-bold text-base text-ink-900">{addr.label}</h4>
                        {addr.isDefault && (
                          <span className="text-[11px] font-bold text-accent-700 bg-accent-50 border border-accent-200 px-2.5 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-ink-800">
                        {addr.recipientName} • <span className="font-normal text-ink-500">{addr.phone}</span>
                      </p>

                      <p className="text-xs text-ink-600 mt-1">
                        {addr.address}, {addr.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditAddress(addr)}
                        className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 rounded-xl bg-cream-100 hover:bg-rose-50 text-ink-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {!addr.isDefault && (
                    <div className="mt-4 pt-3 border-t border-cream-100">
                      <button
                        onClick={() => handleSetDefaultAddress(addr)}
                        className="text-xs font-bold text-accent-600 hover:text-accent-700 cursor-pointer"
                      >
                        Thiết lập làm mặc định
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL THÊM / SỬA ĐỊA CHỈ TÍCH HỢP BẢN ĐỒ SỐ */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={async (data) => {
          if (editingAddress) {
            await api.updateAddress(editingAddress.id, data);
          } else {
            await api.createAddress(data);
          }
          fetchAddresses();
        }}
        initialAddress={editingAddress}
      />

      {/* 5. MODAL ĐỔI ĐỊA CHỈ EMAIL QUA XÁC THỰC OTP */}
      {isChangeEmailModalOpen && (
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsChangeEmailModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-200 animate-scale-up space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsChangeEmailModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {emailOtpStep === 'input' ? (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-accent-50 text-accent-600 border border-accent-200 flex items-center justify-center mx-auto shadow-2xs">
                    <Mail size={24} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-ink-900">Thay đổi địa chỉ Email</h3>
                  <p className="text-xs text-ink-500">
                    Hệ thống sẽ gửi mã xác thực OTP 6 số đến email mới để bảo đảm an toàn cho tài khoản của bạn.
                  </p>
                </div>

                {emailOtpError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{emailOtpError}</span>
                  </div>
                )}

                <form onSubmit={handleSendChangeEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1.5">
                      Địa chỉ Email mới
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email_moi@gmail.com"
                      className="w-full px-4 py-3 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white transition-all text-ink-800 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={emailOtpSubmitting}
                    className="w-full btn-accent py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {emailOtpSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang gửi mã OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi mã xác thực OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-accent-50 text-accent-600 border border-accent-200 flex items-center justify-center mx-auto shadow-2xs">
                    <KeyRound size={24} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-ink-900">Xác thực mã OTP</h3>
                  <p className="text-xs text-ink-500 leading-relaxed">
                    Vui lòng nhập mã gồm 6 chữ số vừa được gửi tới:
                    <br />
                    <strong className="text-accent-600 font-semibold">{newEmail}</strong>
                  </p>
                </div>

                {emailOtpError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{emailOtpError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyChangeEmailOtp} className="space-y-4">
                  <div className="flex justify-center gap-2" onPaste={handleEmailOtpPaste}>
                    {emailOtpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          emailOtpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleEmailOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleEmailOtpKeyDown(idx, e)}
                        className="w-10 h-12 sm:w-11 sm:h-13 text-center font-mono font-bold text-xl bg-cream-50/70 border-2 border-cream-200 rounded-xl focus:outline-none focus:border-accent-500 focus:bg-white text-ink-900 transition-all shadow-2xs"
                      />
                    ))}
                  </div>

                  <div className="text-center text-xs">
                    {emailOtpCanResend ? (
                      <button
                        type="button"
                        onClick={handleResendChangeEmailOtp}
                        disabled={emailOtpSubmitting}
                        className="inline-flex items-center gap-1 font-bold text-accent-600 hover:text-accent-700 hover:underline cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Gửi lại mã OTP</span>
                      </button>
                    ) : (
                      <span className="text-ink-400">
                        Gửi lại mã sau: <strong className="text-ink-700 font-mono">{emailOtpTimer}s</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={emailOtpSubmitting || emailOtpValues.join('').length !== 6}
                    className="w-full btn-accent py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {emailOtpSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang xác thực...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Xác nhận & Cập nhật Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailOtpStep('input')}
                    className="w-full py-1 text-xs font-bold text-ink-400 hover:text-ink-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Nhập lại địa chỉ email khác</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
