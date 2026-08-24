import React from 'react';
import { Star } from 'lucide-react';

export const AdminReviewsTab: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold text-ink-900">Quản lý Đánh giá sản phẩm</h3>
        <p className="text-sm text-ink-500 mt-1">Phản hồi và đánh giá 5 sao từ người mua hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex text-amber-400">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <span className="text-xs font-bold text-ink-400">Nguyễn Văn An</span>
          </div>
          <h4 className="font-bold text-ink-900 text-sm">Sony Alpha A7 Mark IV (Body)</h4>
          <p className="text-xs text-ink-600 mt-2 leading-relaxed">
            "Máy lấy nét cực kỳ nhạy, bắt nét ánh mắt cực tốt khi chụp chân dung. Hàng chính hãng giao rất nhanh và đóng gói kỹ càng!"
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex text-amber-400">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <span className="text-xs font-bold text-ink-400">Lê Minh Trí</span>
          </div>
          <h4 className="font-bold text-ink-900 text-sm">Flycam DJI Mini 4 Pro</h4>
          <p className="text-xs text-ink-600 mt-2 leading-relaxed">
            "Flycam siêu nhẹ, bay rất kháng gió và chống va chạm thông minh 360 độ an tâm tuyệt đối."
          </p>
        </div>
      </div>
    </div>
  );
};
