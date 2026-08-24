/**
 * VietQR Configuration & Service for CameraHub Store
 * Official Account: Vietcombank - STK: 88888888 - NGUYEN MANH TIEN
 */

export interface VietQRConfig {
  bankId: string;
  bankName: string;
  bankFullName: string;
  accountNo: string;
  accountName: string;
}

export const VIETQR_CONFIG: VietQRConfig = {
  bankId: 'vietcombank', // Vietcombank BIN: 970436
  bankName: 'Vietcombank',
  bankFullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (VCB)',
  accountNo: '88888888',
  accountName: 'NGUYEN MANH TIEN',
};

export const vietqrService = {
  getConfig() {
    return VIETQR_CONFIG;
  },

  /**
   * Generates dynamic VietQR image URL with order details
   */
  generateQRUrl(params: {
    amount: number;
    orderCode: string;
    template?: 'compact2' | 'compact' | 'qr_only';
  }): string {
    const { amount, orderCode, template = 'compact2' } = params;
    const safeAmount = Math.max(0, Math.round(amount));
    const safeCode = encodeURIComponent(orderCode.trim());
    const safeAccountName = encodeURIComponent(VIETQR_CONFIG.accountName);

    return `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${template}.png?amount=${safeAmount}&addInfo=${safeCode}&accountName=${safeAccountName}`;
  },

  /**
   * Copy helper with modern Clipboard API and fallback
   */
  async copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  },
};
