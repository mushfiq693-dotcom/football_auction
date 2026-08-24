import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UserCheck, AlertCircle, Upload, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface RegistrationFormData {
  seasonId?: string;
  studentId: string;
  academicSession: string;
  jerseyName: string;
  position: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
  secondaryPosition?: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' | '';
  jerseyNumber?: number;
}

const playerRegistrationSchema = z.object({
  seasonId: z.string().optional(),
  studentId: z.string().min(3, 'Student ID is required (e.g. 2021-1-60-001)'),
  academicSession: z.string().min(4, 'Academic session is required (e.g. 2021-2022)'),
  jerseyName: z.string().min(2, 'Jersey name is required (e.g. MESSI)'),
  position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']),
  secondaryPosition: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).or(z.literal('')).optional(),
  jerseyNumber: z.preprocess((v) => (v === '' || v === undefined || v === null ? undefined : Number(v)), z.number().optional()),
});

export const RegistrationPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(playerRegistrationSchema) as any,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview via Base64 FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data?.url) {
        setUploadedPhotoUrl(res.data.data.url);
        setUploadedPublicId(res.data.data.publicId);
      }
    } catch (err: any) {
      console.warn('Cloudinary upload warning, using persistent base64 data url:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setError(null);
      const payload: any = {
        studentId: data.studentId.trim(),
        academicSession: data.academicSession.trim(),
        jerseyName: data.jerseyName.trim().toUpperCase(),
        position: data.position,
        photoUrl: uploadedPhotoUrl || undefined,
        photoPublicId: uploadedPublicId || undefined,
      };

      if (data.seasonId && data.seasonId.trim() !== '') {
        payload.seasonId = data.seasonId.trim();
      }

      if (data.secondaryPosition && (data.secondaryPosition as string) !== '') {
        payload.secondaryPosition = data.secondaryPosition;
      }

      if (data.jerseyNumber && !isNaN(Number(data.jerseyNumber)) && Number(data.jerseyNumber) > 0) {
        payload.jerseyNumber = Number(data.jerseyNumber);
      }

      await api.post('/players/register', payload);
      setSuccess(true);
      setTimeout(() => navigate('/roster'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit player registration');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="glass-card p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-cyan-500/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase font-mono tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Phase 2: Athlete Portal
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Official Player Registration</h2>
            <p className="text-xs text-slate-300">Submit your university athlete profile with primary/secondary positions & photo</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>🎉 Registration submitted successfully! Minting 3D card & redirecting to roster...</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center overflow-hidden relative shadow-lg">
              {uploadedPhotoUrl ? (
                <img src={uploadedPhotoUrl} alt="Player Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200">
                Player Profile Photo (Cloudinary / HD)
              </label>
              <p className="text-[11px] text-slate-400">Upload JPG, PNG, or WEBP (Instant 3D Card render)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
                className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-cyan-600 file:text-slate-950 hover:file:bg-cyan-500 cursor-pointer"
              />
              {uploadingImage && <span className="text-xs text-cyan-400 block font-mono">Syncing photo...</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">Student ID *</label>
              <input
                {...register('studentId')}
                placeholder="e.g. 2021-1-60-001"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm font-mono"
              />
              {errors.studentId && <p className="text-xs text-red-400 mt-1">{errors.studentId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">Academic Session *</label>
              <select
                {...register('academicSession')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
                <option value="2021-2022">2021-2022</option>
                <option value="2020-2021">2020-2021</option>
              </select>
              {errors.academicSession && <p className="text-xs text-red-400 mt-1">{errors.academicSession.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">Jersey Name *</label>
              <input
                {...register('jerseyName')}
                placeholder="e.g. MESSI"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm uppercase tracking-wider font-bold"
              />
              {errors.jerseyName && <p className="text-xs text-red-400 mt-1">{errors.jerseyName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">Jersey Number (Optional)</label>
              <input
                type="number"
                {...register('jerseyNumber')}
                placeholder="e.g. 10"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">
                Primary Position * <span className="text-cyan-400 font-mono">(Exact 1)</span>
              </label>
              <select
                {...register('position')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
              >
                <option value="FORWARD">FORWARD (ST / CF / LW / RW)</option>
                <option value="MIDFIELDER">MIDFIELDER (CAM / CM / CDM)</option>
                <option value="DEFENDER">DEFENDER (CB / LB / RB / RWB)</option>
                <option value="GOALKEEPER">GOALKEEPER (GK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-300 mb-2 tracking-wider">
                Secondary Position <span className="text-slate-400 font-mono font-normal">(Optional)</span>
              </label>
              <select
                {...register('secondaryPosition')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
              >
                <option value="">None (Primary Only)</option>
                <option value="FORWARD">FORWARD (ST / LW / RW)</option>
                <option value="MIDFIELDER">MIDFIELDER (CAM / CM / CDM)</option>
                <option value="DEFENDER">DEFENDER (CB / LB / RB)</option>
                <option value="GOALKEEPER">GOALKEEPER (GK)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || uploadingImage}
            className="btn-shine w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-slate-950" />
            <span>{isSubmitting ? 'Registering Player...' : 'Complete Player Registration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
