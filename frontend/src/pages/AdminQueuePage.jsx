import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

export default function AdminQueuePage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('pending_evaluations') || '[]');
    setAnalyses(data);
  }, []);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleDelete(id) {
    const updated = analyses.filter((a) => a.id !== id);
    localStorage.setItem('pending_evaluations', JSON.stringify(updated));
    setAnalyses(updated);
  }

  return (
    <DashboardLayout>
      <div className="flex-1 p-4 md:p-8 md:pl-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-brand-accent" />
                <h1 className="text-lg font-bold tracking-tight text-text-primary">Fila de Pendências</h1>
              </div>
              <span className="text-xs text-text-muted">
                {analyses.length} análise{analyses.length !== 1 ? 's' : ''} pendente{analyses.length !== 1 ? 's' : ''}
              </span>
            </div>
          </FadeIn>

          {analyses.length === 0 && (
            <ScaleIn delay={0.1}>
              <div className="flex flex-col items-center gap-4 py-20">
                <ClipboardList className="w-12 h-12 text-text-muted" />
                <p className="text-sm text-text-secondary">Nenhuma análise pendente de revisão.</p>
              </div>
            </ScaleIn>
          )}

          {analyses.length > 0 && (
            <ScaleIn delay={0.15}>
              <div className="rounded-2xl border border-border bg-card-bg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-white/[0.02]">
                        <th className="text-left px-6 py-4 font-medium text-text-muted">ID</th>
                        <th className="text-left px-6 py-4 font-medium text-text-muted">Data de Envio</th>
                        <th className="text-left px-6 py-4 font-medium text-text-muted">Utilizador</th>
                        <th className="text-left px-6 py-4 font-medium text-text-muted">Foto</th>
                        <th className="text-right px-6 py-4 font-medium text-text-muted">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                            {a.id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-text-primary">
                            {formatDate(a.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-text-primary">
                            {a.userName}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {a.photos?.front && (
                                <img src={a.photos.front} alt="Frontal" className="w-8 h-10 rounded object-cover border border-border" />
                              )}
                              {a.photos?.left && (
                                <img src={a.photos.left} alt="Esq" className="w-8 h-10 rounded object-cover border border-border" />
                              )}
                              {a.photos?.right && (
                                <img src={a.photos.right} alt="Dir" className="w-8 h-10 rounded object-cover border border-border" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/admin/evaluate/${a.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent text-background font-medium text-xs hover:opacity-90 transition-opacity"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Avaliar
                              </button>
                              <button
                                onClick={() => handleDelete(a.id)}
                                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScaleIn>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
