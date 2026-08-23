import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UserCheck, AlertCircle, Upload, CheckCircle2, Shield } from 'lucide-react';

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

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedPhotoUrl(res.data.data.url);
      setUploadedPublicId(res.data.data.publicId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload player image to Cloudinary');
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
      setTimeout(() => navigate('/roster'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit player registration');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="glass-card p-8 rounded-3xl border border-purple-500/30 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Official Player Registration</h2>
            <p className="text-xs text-slate-400">Complete player profile with dynamic positions and Cloudinary photo</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Registration submitted successfully! Redirecting to player roster...</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden relative">
              {uploadedPhotoUrl ? (
                <img src={uploadedPhotoUrl} alt="Player Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-300">
                Player Profile Photo (Cloudinary)
              </label>
              <p className="text-[11px] text-slate-500">Upload high-res JPG, PNG, or WEBP (Max 5MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
              />
              {uploadingImage && <span className="text-xs text-purple-400 block">Uploading to Cloudinary...</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Student ID *</label>
              <input
                {...register('studentId')}
                placeholder="e.g. 2021-1-60-001"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm font-mono"
              />
              {errors.studentId && <p className="text-xs text-red-400 mt-1">{errors.studentId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Academic Session *</label>
              <select
                {...register('academicSession')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm"
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
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Jersey Name *</label>
              <input
                {...register('jerseyName')}
                placeholder="e.g. MESSI"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm uppercase tracking-wider font-bold"
              />
              {errors.jerseyName && <p className="text-xs text-red-400 mt-1">{errors.jerseyName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Jersey Number (Optional)</label>
              <input
                type="number"
                {...register('jerseyNumber')}
                placeholder="e.g. 10"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Primary Position * <span className="text-purple-400">(Exact 1)</span>
              </label>
              <select
                {...register('position')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="FORWARD">FORWARD (ST / CF / LW / RW)</option>
                <option value="MIDFIELDER">MIDFIELDER (CAM / CM / CDM)</option>
                <option value="DEFENDER">DEFENDER (CB / LB / RB / RWB)</option>
                <option value="GOALKEEPER">GOALKEEPER (GK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Secondary Position <span className="text-slate-500">(Optional)</span>
              </label>
              <select
                {...register('secondaryPosition')}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="">None</option>
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
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {isSubmitting ? 'Submitting Application...' : 'Submit Profile for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};
