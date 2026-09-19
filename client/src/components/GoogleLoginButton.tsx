import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  mode = 'login',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Không nhận được mã xác thực từ Google.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success(
        mode === 'register'
          ? 'Đăng ký & Đăng nhập tài khoản Google thành công!'
          : 'Đăng nhập bằng tài khoản Google thành công!'
      );
      onSuccess?.();
    } catch (err: any) {
      console.error('Lỗi khi đăng nhập Google:', err);
      toast.error(err.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    console.warn('Google Sign-In cancelled or failed');
    toast.error('Xác thực với Google đã bị hủy hoặc không thành công.');
    onError?.(new Error('Google Sign-In cancelled'));
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center">
      {loading ? (
        <div className="w-full py-3 px-4 rounded-2xl bg-cream-50 border border-cream-200 flex items-center justify-center gap-2 text-xs font-semibold text-ink-600 shadow-2xs">
          <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang đồng bộ tài khoản Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center google-btn-container overflow-hidden rounded-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            theme="outline"
            size="large"
            shape="pill"
            text={mode === 'register' ? 'signup_with' : 'signin_with'}
            width="360"
          />
        </div>
      )}
    </div>
  );
};
