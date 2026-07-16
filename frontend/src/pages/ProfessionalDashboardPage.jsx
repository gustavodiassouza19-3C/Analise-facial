import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { LogOut, ScanFace, ClipboardList, Users, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfessionalDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingAnalyses, setPendingAnalyses] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: pending, error: pendingError } = await supabase
        .from('analyses')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('Failed to fetch pending analyses:', pendingError.message);
      }

      const { count: completedCount, error: completedError } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (completedError) {
        console.error('Failed to fetch completed count:', completedError.message);
      }

      const { count: totalCount, error: totalError } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Failed to fetch total count:', totalError.message);
      }

      setPendingAnalyses(pending || []);
      setStats({
        pending: pending?.length || 0,
        completed: completedCount || 0,
        total: totalCount || 0,
      });
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/professional/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
              <ScanFace className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight">FaceMax Professional</h1>
              <p className="text-[10px] sm:text-[11px] text-text-muted">{user?.role === 'admin' ? 'Administrador' : 'Especialista'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-text-secondary hidden sm:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs hover:text-white hover:border-brand-accent/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-card-bg border border-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
              <h2 className="text-xs sm:text-sm font-semibold text-white">Analises Pendentes</h2>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{loading ? '--' : stats.pending}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-1">Aguardando avaliacao</p>
          </div>

          <div className="bg-card-bg border border-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <ScanFace className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
              <h2 className="text-xs sm:text-sm font-semibold text-white">Analises Concluidas</h2>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{loading ? '--' : stats.completed}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-1">Avaliacoes realizadas</p>
          </div>

          <div className="bg-card-bg border border-border rounded-2xl p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
              <h2 className="text-xs sm:text-sm font-semibold text-white">Total de Analises</h2>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{loading ? '--' : stats.total}</p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-1">No sistema</p>
          </div>
        </div>

        {/* Pending Analyses List */}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white mb-4">Fila de Avaliacao</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
            </div>
          ) : pendingAnalyses.length === 0 ? (
            <div className="bg-card-bg border border-border rounded-2xl p-8 sm:p-12 text-center">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted mx-auto mb-3" />
              <p className="text-sm sm:text-base text-text-secondary font-medium">Nenhuma analise pendente</p>
              <p className="text-xs text-text-muted mt-1">Todas as analises foram avaliadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => navigate(`/professional/dashboard/evaluate/${analysis.id}`)}
                  className="w-full bg-card-bg border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-brand-accent/30 transition-colors text-left group"
                >
                  {/* Photo preview */}
                  <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                    {analysis.photo_front_url ? (
                      <img
                        src={analysis.photo_front_url}
                        alt="Foto frontal"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ScanFace className="w-5 h-5 sm:w-6 sm:h-6 text-text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {analysis.profiles?.full_name || 'Cliente'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(analysis.created_at)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        Pendente
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-accent transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
