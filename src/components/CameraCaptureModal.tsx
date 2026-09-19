import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RefreshCw, X, AlertCircle, Check, FlipHorizontal, Upload, Video, Image as ImageIcon, Sliders, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
 isOpen: boolean;
 onClose: () => void;
 onCapture: (base64Image: string, fileName: string) => void;
}

interface VideoDevice {
 deviceId: string;
 label: string;
}

type ResolutionPreset = 'auto' | 'sd' | 'hd' | 'fhd';

interface PresetOption {
 id: ResolutionPreset;
 title: string;
 badge: string;
 desc: string;
 width?: number;
 height?: number;
 maxOutputDim: number;
}

const RESOLUTION_PRESETS: PresetOption[] = [
 { id: 'auto', title: 'خودکار (پیشنهادی)', badge: 'AUTO', desc: 'تطبیق خودکار با وب‌کم شما', maxOutputDim: 1200 },
 { id: 'fhd', title: 'Full HD', badge: '1080p', desc: 'وضوح بالا برای اسناد و متون ریز', width: 1920, height: 1080, maxOutputDim: 1920 },
 { id: 'hd', title: 'HD استاندارد', badge: '720p', desc: 'تعادل عالی کیفیت و سرعت', width: 1280, height: 720, maxOutputDim: 1280 },
 { id: 'sd', title: 'سبک و سریع', badge: '480p', desc: 'کم‌حجم برای اینترنت ضعیف', width: 640, height: 480, maxOutputDim: 800 },
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
 isOpen,
 onClose,
 onCapture,
}) => {
 const videoRef = useRef<HTMLVideoElement | null>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const fileFallbackInputRef = useRef<HTMLInputElement | null>(null);

 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [capturedImage, setCapturedImage] = useState<string | null>(null);
 const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
 const [devices, setDevices] = useState<VideoDevice[]>([]);
 const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
 const [resolutionPreset, setResolutionPreset] = useState<ResolutionPreset>('auto');
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [actualResolution, setActualResolution] = useState<{ width: number; height: number } | null>(null);

 // Stop active stream tracks completely
 const stopStream = useCallback(() => {
 if (streamRef.current) {
 streamRef.current.getTracks().forEach((track) => {
 try {
 track.stop();
 } catch {
 // ignore
 }
 });
 streamRef.current = null;
 }
 if (videoRef.current) {
 videoRef.current.srcObject = null;
 }
 }, []);

 // Enumerate video devices
 const loadDevices = useCallback(async () => {
 try {
 if (navigator.mediaDevices?.enumerateDevices) {
 const allDevices = await navigator.mediaDevices.enumerateDevices();
 const videoInputs = allDevices
 .filter((d) => d.kind === 'videoinput')
 .map((d, index) => ({
 deviceId: d.deviceId,
 label: d.label || `دوربین ${index + 1}`,
 }));
 setDevices(videoInputs);
 return videoInputs;
 }
 } catch (err) {
 console.warn('Error enumerating devices:', err);
 }
 return [];
 }, []);

 // Start camera stream safely with ideal fallback
 const startCamera = useCallback(
 async (mode: 'user' | 'environment', deviceId?: string, preset: ResolutionPreset = 'auto') => {
 setIsLoading(true);
 setErrorMessage(null);
 setCapturedImage(null);
 setActualResolution(null);
 stopStream();

 if (!navigator.mediaDevices?.getUserMedia) {
 setErrorMessage('مرورگر شما یا محیط فعلی از دسترسی مستقیم به وب‌کم پشتیبانی نمی‌کند.');
 setIsLoading(false);
 return;
 }

 try {
 const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 const selectedOption = RESOLUTION_PRESETS.find((p) => p.id === preset);

 let videoConstraints: MediaTrackConstraints | boolean = true;

 if (preset === 'auto') {
 if (deviceId) {
 videoConstraints = {
 deviceId: { exact: deviceId },
 width: { ideal: 1280 },
 height: { ideal: 720 },
 aspectRatio: { ideal: 1.7777777778 },
 };
 } else if (isMobile) {
 videoConstraints = {
 facingMode: { ideal: mode },
 width: { ideal: 1280 },
 height: { ideal: 720 },
 };
 } else {
 // Desktop: guide Chrome to negotiate 720p HD (16:9) rather than fallback VGA 640x480 (4:3)
 videoConstraints = {
 width: { ideal: 1280, min: 640 },
 height: { ideal: 720, min: 480 },
 aspectRatio: { ideal: 1.7777777778 },
 };
 }
 } else {
 // Explicit preset with ideal (safe fallback) width/height
 videoConstraints = {
 ...(deviceId ? { deviceId: { exact: deviceId } } : isMobile ? { facingMode: { ideal: mode } } : {}),
 width: { ideal: selectedOption?.width },
 height: { ideal: selectedOption?.height },
 aspectRatio: selectedOption?.width && selectedOption?.height ? { ideal: selectedOption.width / selectedOption.height } : undefined,
 };
 }

 let stream: MediaStream;
 try {
 stream = await navigator.mediaDevices.getUserMedia({
 video: videoConstraints,
 audio: false,
 });
 } catch (firstErr) {
 console.warn('First constraint attempt failed, falling back to basic video:', firstErr);
 stream = await navigator.mediaDevices.getUserMedia({
 video: deviceId ? { deviceId: { exact: deviceId } } : true,
 audio: false,
 });
 }

 streamRef.current = stream;

 // Attach stream directly to video element
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 try {
 await videoRef.current.play();
 } catch (playErr) {
 console.warn('Play error on video element:', playErr);
 }
 }

 // Get actual active track resolution
 const activeTrack = stream.getVideoTracks()[0];
 const activeSettings = activeTrack?.getSettings?.();
 if (activeSettings?.width && activeSettings?.height) {
 setActualResolution({ width: activeSettings.width, height: activeSettings.height });
 }

 // Populate available cameras
 const availableDevices = await loadDevices();
 if (availableDevices.length > 0 && !deviceId) {
 if (activeSettings?.deviceId) {
 setSelectedDeviceId(activeSettings.deviceId);
 }
 }

 setIsLoading(false);
 } catch (err: any) {
 console.error('Camera access error:', err);
 setIsLoading(false);

 const errName = err?.name || '';
 if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
 setErrorMessage('دسترسی به دوربین توسط مرورگر رد شد. لطفاً در تنظیمات نوار آدرس دسترسی به دوربین را فعال کنید.');
 } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
 setErrorMessage('هیچ دوربینی روی سیستم شما یافت نشد.');
 } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
 setErrorMessage('دوربین توسط برنامه دیگری (مانند OBS، زوم یا ویندوز کمرا) در حال استفاده است.');
 } else {
 setErrorMessage('امکان دریافت تصویر از دوربین وجود ندارد. می‌توانید از دکمه انتخاب فایل استفاده کنید.');
 }
 }
 },
 [stopStream, loadDevices]
 );

 // Trigger camera on open / close
 useEffect(() => {
 if (isOpen) {
 startCamera(facingMode, selectedDeviceId || undefined, resolutionPreset);
 } else {
 stopStream();
 setCapturedImage(null);
 setErrorMessage(null);
 setIsSettingsOpen(false);
 }
 return () => {
 stopStream();
 };
 }, [isOpen]);

 // Handle snap photo & compress via canvas according to preset
 const handleSnap = () => {
 if (!videoRef.current) return;
 const video = videoRef.current;

 const vWidth = video.videoWidth || 640;
 const vHeight = video.videoHeight || 480;

 const currentPresetObj = RESOLUTION_PRESETS.find((p) => p.id === resolutionPreset) || RESOLUTION_PRESETS[0];
 const MAX_DIM = currentPresetObj.maxOutputDim;

 const canvas = document.createElement('canvas');
 let width = vWidth;
 let height = vHeight;

 if (width > height) {
 if (width > MAX_DIM) {
 height = Math.round((height * MAX_DIM) / width);
 width = MAX_DIM;
 }
 } else {
 if (height > MAX_DIM) {
 width = Math.round((width * MAX_DIM) / height);
 height = MAX_DIM;
 }
 }

 canvas.width = width;
 canvas.height = height;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 // Mirror image for user facing view
 if (facingMode === 'user' && !selectedDeviceId) {
 ctx.translate(width, 0);
 ctx.scale(-1, 1);
 }

 ctx.drawImage(video, 0, 0, width, height);
 const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
 setCapturedImage(compressedDataUrl);
 stopStream();
 };

 // Retake photo
 const handleRetake = () => {
 setCapturedImage(null);
 startCamera(facingMode, selectedDeviceId || undefined, resolutionPreset);
 };

 // Confirm photo and send to input
 const handleConfirm = () => {
 if (capturedImage) {
 const fileName = `camera_photo_${Date.now()}.jpg`;
 onCapture(capturedImage, fileName);
 onClose();
 }
 };

 // Switch camera device
 const handleDeviceChange = (deviceId: string) => {
 setSelectedDeviceId(deviceId);
 startCamera(facingMode, deviceId, resolutionPreset);
 };

 // Change resolution preset
 const handlePresetChange = (preset: ResolutionPreset) => {
 setResolutionPreset(preset);
 startCamera(facingMode, selectedDeviceId || undefined, preset);
 };

 // Toggle front/back camera
 const handleToggleFacingMode = () => {
 const nextMode = facingMode === 'user' ? 'environment' : 'user';
 setFacingMode(nextMode);
 setSelectedDeviceId('');
 startCamera(nextMode, undefined, resolutionPreset);
 };

 // Fallback file picker
 const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (event) => {
 const result = event.target?.result as string;
 if (result) {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement('canvas');
 const MAX_DIM = 1200;
 let width = img.width;
 let height = img.height;

 if (width > height) {
 if (width > MAX_DIM) {
 height = Math.round((height * MAX_DIM) / width);
 width = MAX_DIM;
 }
 } else {
 if (height > MAX_DIM) {
 width = Math.round((width * MAX_DIM) / height);
 height = MAX_DIM;
 }
 }

 canvas.width = width;
 canvas.height = height;
 const ctx = canvas.getContext('2d');
 if (ctx) {
 ctx.drawImage(img, 0, 0, width, height);
 const compressed = canvas.toDataURL('image/jpeg', 0.85);
 setCapturedImage(compressed);
 stopStream();
 }
 };
 img.src = result;
 }
 };
 reader.readAsDataURL(file);
 e.target.value = '';
 };

 if (!isOpen) return null;

 const currentPresetInfo = RESOLUTION_PRESETS.find((p) => p.id === resolutionPreset) || RESOLUTION_PRESETS[0];

 const modalContent = (
 <div
 className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
 dir="rtl"
 >
 <div
 className="relative w-full max-w-lg clay-card-thick border rounded-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88dvh] text-slate-100 mx-auto my-auto"
 >
 {/* Header */}
 <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/10 dark:border-white/10 bg-white/[0.02]">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
 <Camera className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-white flex items-center gap-2">
 ثبت تصویر با دوربین
 {actualResolution && !capturedImage && (
 <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-sky-300 font-mono" dir="ltr">
 {actualResolution.width}×{actualResolution.height}
 </span>
 )}
 </h3>
 <p className="text-[11px] text-slate-400">عکسبرداری زنده و تحلیل هوشمند</p>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 {!capturedImage && (
 <button
 type="button"
 onClick={() => setIsSettingsOpen(!isSettingsOpen)}
 className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
 isSettingsOpen
 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
 : 'bg-black/5 dark:bg-white/5 text-slate-300 hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10'
 }`}
 title="تنظیمات رزولوشن و کیفیت"
 aria-label="تنظیمات رزولوشن"
 >
 <Sliders className="w-3.5 h-3.5" />
 <span className="text-[11px] font-medium">{currentPresetInfo.badge}</span>
 </button>
 )}
 <button
 type="button"
 onClick={onClose}
 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
 aria-label="بستن"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Quality & Resolution Selector Tray */}
 {isSettingsOpen && !capturedImage && (
 <div className="shrink-0 p-3 bg-black/50 border-b border-black/10 dark:border-white/10 text-xs animate-fadeIn">
 <div className="flex items-center justify-between mb-2">
 <span className="text-slate-300 font-medium flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-sky-400" />
 انتخاب کیفیت و رزولوشن دوربین:
 </span>
 <span className="text-[10px] text-slate-400">با انطباق خودکار سخت‌افزار</span>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
 {RESOLUTION_PRESETS.map((preset) => {
 const isSelected = resolutionPreset === preset.id;
 return (
 <button
 key={preset.id}
 type="button"
 onClick={() => handlePresetChange(preset.id)}
 className={`px-2.5 py-2 rounded-xl text-right transition-all flex flex-col gap-0.5 cursor-pointer border ${
 isSelected
 ? 'bg-sky-500/20 border-sky-500/50 text-white shadow-sm'
 : 'clay-surface border-black/5 dark:border-white/5 text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:border-white/15'
 }`}
 >
 <span className={`font-bold text-[11px] ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
 {preset.title}
 </span>
 <span className="text-[9.5px] text-slate-400 leading-tight truncate">{preset.desc}</span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Device selector bar (if multiple cameras exist) */}
 {devices.length > 1 && !capturedImage && (
 <div className="shrink-0 px-4 py-2 border-b border-black/5 dark:border-white/5 bg-black/40 flex items-center gap-2 text-xs">
 <Video className="w-3.5 h-3.5 text-sky-400 shrink-0" />
 <span className="text-slate-400 shrink-0">منبع تصویر:</span>
 <select
 value={selectedDeviceId}
 onChange={(e) => handleDeviceChange(e.target.value)}
 className="w-full clay-surface text-slate-200 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-sky-500 cursor-pointer"
 >
 {devices.map((d) => (
 <option key={d.deviceId} value={d.deviceId}>
 {d.label}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Video / Snapshot Viewport */}
 <div className="flex-1 min-h-[220px] max-h-[48dvh] sm:max-h-[52dvh] relative w-full clay-surface-inset flex items-center justify-center overflow-hidden">
 {isLoading && !capturedImage && !errorMessage && (
 <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 z-10">
 <RefreshCw className="w-7 h-7 text-sky-400 animate-spin" />
 <span className="text-xs text-slate-300">در حال تنظیم تصویر و کیفیت...</span>
 </div>
 )}

 {errorMessage && !capturedImage ? (
 <div className="p-6 flex flex-col items-center justify-center text-center gap-3 max-w-sm">
 <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
 <AlertCircle className="w-6 h-6" />
 </div>
 <p className="text-xs sm:text-sm text-red-200 leading-relaxed">{errorMessage}</p>
 <div className="flex flex-wrap gap-2 justify-center mt-2">
 <button
 type="button"
 onClick={() => startCamera(facingMode, selectedDeviceId || undefined, resolutionPreset)}
 className="px-3.5 py-1.5 text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 تلاش مجدد
 </button>
 <button
 type="button"
 onClick={() => fileFallbackInputRef.current?.click()}
 className="px-3.5 py-1.5 text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
 >
 <Upload className="w-3.5 h-3.5" />
 انتخاب فایل از سیستم
 </button>
 </div>
 </div>
 ) : capturedImage ? (
 <img
 src={capturedImage}
 alt="عکس گرفته شده"
 className="w-full h-full object-contain max-h-[48dvh]"
 />
 ) : (
 <video
 ref={videoRef}
 autoPlay
 playsInline
 muted
 onLoadedMetadata={(e) => {
 setIsLoading(false);
 const target = e.currentTarget;
 if (target.videoWidth && target.videoHeight) {
 setActualResolution({ width: target.videoWidth, height: target.videoHeight });
 }
 }}
 onPlay={() => setIsLoading(false)}
 className={`w-full h-full object-contain max-h-[48dvh] bg-black ${
 facingMode === 'user' && !selectedDeviceId ? 'scale-x-[-1]' : ''
 }`}
 />
 )}

 {/* Switch camera toggle overlay (if multiple cameras exist) */}
 {!capturedImage && !errorMessage && devices.length > 1 && (
 <button
 type="button"
 onClick={handleToggleFacingMode}
 className="absolute top-3 left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer z-20"
 title="تغییر دوربین"
 aria-label="تغییر دوربین"
 >
 <FlipHorizontal className="w-4 h-4" />
 </button>
 )}
 </div>

 {/* Hidden Fallback Input */}
 <input
 ref={fileFallbackInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleFallbackFile}
 />

 {/* Footer Actions */}
 <div className="shrink-0 p-3 sm:p-4 border-t border-black/10 dark:border-white/10 clay-card-thick flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onClose}
 className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
 >
 انصراف
 </button>
 {!capturedImage && (
 <button
 type="button"
 onClick={() => fileFallbackInputRef.current?.click()}
 className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
 title="بارگذاری مستقیم عکس"
 >
 <ImageIcon className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">انتخاب فایل</span>
 </button>
 )}
 </div>

 {capturedImage ? (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleRetake}
 className="px-3.5 py-2 rounded-xl text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-white/20 text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 عکس مجدد
 </button>
 <button
 type="button"
 onClick={handleConfirm}
 className="px-4 sm:px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
 >
 <Check className="w-4 h-4 stroke-[2.5]" />
 استفاده از عکس
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={handleSnap}
 disabled={isLoading || !!errorMessage}
 className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
 isLoading || !!errorMessage
 ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
 : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25 active:scale-95 cursor-pointer'
 }`}
 >
 <Camera className="w-4 h-4" />
 ثبت عکس
 </button>
 )}
 </div>
 </div>
 </div>
 );

 return createPortal(modalContent, document.body);
};
