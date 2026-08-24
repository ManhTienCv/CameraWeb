import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import {
  Search,
  Crosshair,
  Layers,
  MapPin,
  Check,
  X,
  Sparkles,
  Loader2,
  Navigation,
  Building,
  Home,
} from 'lucide-react';

export interface SelectedLocationData {
  fullAddress: string;
  detailAddress: string;
  administrativeArea: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: SelectedLocationData) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

// Prominent Vietnamese Landmarks Database for Instant Matching
const POPULAR_VN_LANDMARKS = [
  { name: 'Khu Đô Thị Phúc Diễn', address: 'Phúc Diễn, Bắc Từ Liêm', city: 'Hà Nội', district: 'Bắc Từ Liêm', lat: 21.0470, lng: 105.7619 },
  { name: 'Keangnam Landmark 72', address: 'Đường Phạm Hùng, Mễ Trì', city: 'Hà Nội', district: 'Nam Từ Liêm', lat: 21.0168, lng: 105.7838 },
  { name: 'Hồ Hoàn Kiếm', address: 'Phố Đinh Tiên Hoàng, Hàng Trống', city: 'Hà Nội', district: 'Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
  { name: 'Sân bay Quốc tế Nội Bài', address: 'Phú Cường, Sóc Sơn', city: 'Hà Nội', district: 'Sóc Sơn', lat: 21.2212, lng: 105.8072 },
  { name: 'Chợ Bến Thành', address: 'Đường Lê Lợi, Bến Thành, Quận 1', city: 'TP. Hồ Chí Minh', district: 'Quận 1', lat: 10.7725, lng: 106.6980 },
  { name: 'Landmark 81', address: '720A Điện Biên Phủ, Phường 22, Bình Thạnh', city: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', lat: 10.7950, lng: 106.7218 },
  { name: 'Cầu Rồng Đà Nẵng', address: 'Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu', city: 'Đà Nẵng', district: 'Hải Châu', lat: 16.0611, lng: 108.2238 },
];

export function MapLocationPicker({
  isOpen,
  onClose,
  onConfirm,
  initialLat = 21.0285,
  initialLng = 105.8542,
  initialAddress = '',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; area: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Address fields
  const [detailAddress, setDetailAddress] = useState('Phúc Diễn');
  const [administrativeArea, setAdministrativeArea] = useState('Bắc Từ Liêm, Hà Nội');
  const [detectedCity, setDetectedCity] = useState('Hà Nội');
  const [detectedDistrict, setDetectedDistrict] = useState('Bắc Từ Liêm');

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reverse Geocoding with Multi-tier Fallback
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      // 1. First check if close to any predefined landmarks (< 100m)
      const nearbyLandmark = POPULAR_VN_LANDMARKS.find((lm) => {
        const dLat = Math.abs(lm.lat - lat);
        const dLng = Math.abs(lm.lng - lng);
        return dLat < 0.002 && dLng < 0.002;
      });

      if (nearbyLandmark) {
        setDetailAddress(nearbyLandmark.address);
        setAdministrativeArea(`${nearbyLandmark.district}, ${nearbyLandmark.city}`);
        setDetectedCity(nearbyLandmark.city);
        setDetectedDistrict(nearbyLandmark.district);
        setIsGeocoding(false);
        return;
      }

      // 2. Query Nominatim OpenStreetMap Reverse API
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`,
        { headers: { 'User-Agent': 'CameraHub/1.0' } }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
        const houseNumber = addr.house_number || '';
        const quarter = addr.quarter || addr.suburb || addr.village || '';
        const district = addr.city_district || addr.district || addr.county || addr.town || '';
        const city = addr.city || addr.state || addr.province || 'Hà Nội';

        const detail = [houseNumber, road, quarter].filter(Boolean).join(', ') || 'Đang xác định số nhà';
        const admin = [district, city].filter(Boolean).join(', ') || 'Việt Nam';

        setDetailAddress(detail);
        setAdministrativeArea(admin);
        setDetectedCity(city.replace(/^(Thành phố|Tỉnh)\s+/i, ''));
        setDetectedDistrict(district.replace(/^(Quận|Huyện|Thị xã)\s+/i, ''));
      }
    } catch (e) {
      console.warn('Reverse geocode fallback:', e);
      setDetailAddress(`Vị trí toạ độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setAdministrativeArea('Hà Nội, Việt Nam');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Custom Glowing Orange Pin
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-9 h-9 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(232,93,27,0.55)] border-2 border-white transform -translate-y-3.5 hover:scale-110 transition-transform cursor-grab">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div class="absolute -bottom-1 w-3.5 h-1 bg-ink-900/30 rounded-full blur-[1px]"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 32],
    });

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 16,
      zoomControl: true,
    });

    // Google Maps Tile Layer
    const tileUrl =
      mapType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: '© Google Maps',
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;

    // Draggable Marker
    const marker = L.marker([coords.lat, coords.lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Initial reverse geocode
    reverseGeocode(coords.lat, coords.lng);

    // Invalidate size after modal render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen]);

  // Switch Tile Layer (Street vs Satellite)
  const toggleMapType = () => {
    if (!mapInstanceRef.current || !currentTileLayerRef.current) return;
    const nextType = mapType === 'street' ? 'satellite' : 'street';
    setMapType(nextType);

    mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    const newUrl =
      nextType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      attribution: '© Google Maps',
    }).addTo(mapInstanceRef.current);

    currentTileLayerRef.current = newLayer;
  };

  // Get User GPS Position
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS location error:', error);
        alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search Address or Landmark
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Check local landmarks first
      const localMatches = POPULAR_VN_LANDMARKS.filter((lm) =>
        lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lm.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((lm) => ({
        name: lm.name,
        area: `${lm.address}, ${lm.city}`,
        lat: lm.lat,
        lng: lm.lng,
      }));

      // Search Nominatim OpenStreetMap
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Vietnam'
        )}&limit=5&accept-language=vi`
      );
      const data = await res.json();

      const apiMatches = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        area: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSearchResults([...localMatches, ...apiMatches]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { lat: number; lng: number; name: string }) => {
    setCoords({ lat: result.lat, lng: result.lng });
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 17, { duration: 1.2 });
      markerRef.current.setLatLng([result.lat, result.lng]);
    }

    reverseGeocode(result.lat, result.lng);
  };

  const handleConfirmLocation = () => {
    const full = `${detailAddress}, ${administrativeArea}`.trim();
    onConfirm({
      fullAddress: full,
      detailAddress,
      administrativeArea,
      city: detectedCity,
      district: detectedDistrict,
      lat: coords.lat,
      lng: coords.lng,
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden my-auto flex flex-col cursor-default animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="px-6 py-3.5 border-b border-cream-100 flex items-center justify-between bg-cream-50/60 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-accent-50 text-accent-700 rounded-full text-[11px] font-bold mb-0.5 border border-accent-200/70">
              <MapPin size={12} className="text-accent-500" />
              <span>Định Vị Vận Chuyển Số</span>
            </div>
            <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
              Chọn Vị Trí Nhận Hàng Trên Bản Đồ
            </h2>
            <p className="text-[11px] text-ink-500">
              Kéo thả ghim đỏ hoặc click trên bản đồ để lấy toạ độ & số nhà tự động
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 text-ink-400 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Map Toolbar - Compact */}
        <div className="p-3 bg-white border-b border-cream-100 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm địa chỉ, tên đường, toà nhà..."
                className="w-full pl-9 pr-8 py-2 bg-cream-50/90 border border-cream-200 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white text-ink-800 placeholder:text-ink-400"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              {isSearching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-500 animate-spin" />
              )}
            </form>

            {/* My Location Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1 px-3 py-2 bg-accent-50 text-accent-700 border border-accent-200 rounded-xl text-xs font-bold hover:bg-accent-100 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              {isLocating ? (
                <Loader2 size={13} className="animate-spin text-accent-600" />
              ) : (
                <Crosshair size={13} className="text-accent-500" />
              )}
              <span>Vị trí của tôi</span>
            </button>

            {/* Map Type Switcher */}
            <button
              type="button"
              onClick={toggleMapType}
              className="flex items-center gap-1 px-3 py-2 bg-cream-100 text-ink-700 border border-cream-200 rounded-xl text-xs font-bold hover:bg-cream-200 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Layers size={13} className="text-ink-500" />
              <span>{mapType === 'street' ? 'Vệ tinh' : 'Bản đồ'}</span>
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-cream-200 rounded-xl shadow-xl p-1.5 max-h-40 overflow-y-auto space-y-1">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full flex items-start gap-2 p-1.5 rounded-lg text-left hover:bg-cream-100 transition-colors"
                >
                  <MapPin size={14} className="text-accent-500 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink-800 truncate">{res.name}</p>
                    <p className="text-[10px] text-ink-400 truncate">{res.area}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Leaflet Map Area with Floating Badge and Coordinates */}
        <div className="relative h-[220px] sm:h-[250px] w-full bg-cream-100 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Instruction Pill Top-Left */}
          <div className="absolute top-2.5 left-12 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm border border-cream-200 flex items-center gap-1.5 text-[11px] font-bold text-ink-800 pointer-events-none">
            <Navigation size={12} className="text-accent-500 animate-pulse" />
            <span>Kéo ghim hoặc click trên bản đồ để chọn vị trí</span>
          </div>

          {/* Floating Coordinates Badge Bottom-Right */}
          <div className="absolute bottom-2.5 right-2.5 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs border border-cream-200 flex items-center gap-1 text-[10px] font-mono text-ink-600 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
            <span>📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
          </div>
        </div>

        {/* Selected Location Info Panel - Compact & Symmetrical */}
        <div className="p-4 bg-white border-t border-cream-200 space-y-3 shrink-0">
          <div className="bg-accent-50/50 border border-accent-200/70 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-accent-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                  ✓
                </div>
                <span className="text-[11px] font-bold text-ink-900 tracking-wide uppercase">
                  THÔNG TIN VỊ TRÍ GIAO HÀNG ĐÃ CHỌN
                </span>
              </div>
              <span className="px-2 py-0.5 bg-accent-50 text-accent-700 border border-accent-300 rounded-full text-[10px] font-bold">
                {isGeocoding ? 'Đang định vị toạ độ...' : 'Vị trí chuẩn xác'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-ink-700 uppercase tracking-wide mb-1">
                  <Home size={12} className="text-accent-500" />
                  <span>ĐỊA CHỈ CHI TIẾT (SỐ NHÀ, TÊN ĐƯỜNG):</span>
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-cream-300 rounded-xl text-xs font-semibold text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  placeholder="Ví dụ: Số 12, Ngõ 139 Phú Diễn"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-ink-700 uppercase tracking-wide mb-1">
                  <Building size={12} className="text-accent-500" />
                  <span>KHU VỰC HÀNH CHÍNH:</span>
                </label>
                <input
                  type="text"
                  value={administrativeArea}
                  onChange={(e) => setAdministrativeArea(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-cream-300 rounded-xl text-xs font-semibold text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  placeholder="Ví dụ: Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội"
                />
              </div>
            </div>

            <p className="text-[10px] text-accent-800 font-medium italic flex items-center gap-1">
              👉 Bấm <strong>"Xác Nhận Dùng Địa Chỉ Này"</strong> để áp dụng thông tin vị trí vào biểu mẫu.
            </p>
          </div>

          {/* Action Buttons - Always Visible and Prominent */}
          <div className="flex items-center justify-end gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold text-ink-700 bg-cream-100 hover:bg-cream-200 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Check size={15} />
              <span>Xác Nhận Dùng Địa Chỉ Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
