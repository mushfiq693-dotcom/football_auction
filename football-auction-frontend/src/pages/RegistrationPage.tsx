import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, AlertCircle } from 'lucide-react';

const playerRegistrationSchema = z.object({
  seasonId: z.string().min(1, 'Season ID is required'),
  position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']),
  secondaryPosition: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).optional(),
  jerseyNumber: z.coerce.number().min(1).max(99).optional(),
});

type FormData = z.infer<typeof playerRegistrationSchema>;

export const RegistrationPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(playerRegistrationSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await api.post('/players/register', data);
      setSuccess(true);
      setTimeout(() => navigate('/roster'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit registration');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <div className="glass-card p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Player Registration</h2>
            <p className="text-xs text-slate-400">Submit your preferred position for season approval</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✅ Registration submitted successfully! Redirecting to player roster...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Season ID</label>
            <input
              {...register('seasonId')}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
            {errors.seasonId && <p className="text-xs text-red-400 mt-1">{errors.seasonId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Primary Position</label>
            <select
              {...register('position')}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
            >
              <option value="FORWARD">FORWARD (ST / LW / RW)</option>
              <option value="MIDFIELDER">MIDFIELDER (CAM / CM / CDM)</option>
              <option value="DEFENDER">DEFENDER (CB / LB / RB)</option>
              <option value="GOALKEEPER">GOALKEEPER (GK)</option>
            </select>
            {errors.position && <p className="text-xs text-red-400 mt-1">{errors.position.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Secondary Position (Optional)</label>
            <select
              {...register('secondaryPosition')}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
            >
              <option value="">None</option>
              <option value="FORWARD">FORWARD</option>
              <option value="MIDFIELDER">MIDFIELDER</option>
              <option value="DEFENDER">DEFENDER</option>
              <option value="GOALKEEPER">GOALKEEPER</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Desired Jersey Number (Optional)</label>
            <input
              type="number"
              {...register('jerseyNumber')}
              placeholder="e.g. 10"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Profile for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};
