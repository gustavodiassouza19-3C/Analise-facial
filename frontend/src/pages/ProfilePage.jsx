import { useState, useEffect, useRef } from 'react';
import { Camera, Save, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import DashboardLayout from '@/components/DashboardLayout';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const API_BASE = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Neutro'];
const STYLE_OPTIONS = [
  'Harmonia Facial',
  'Simetria e Proporção',
  'Estilo Pessoal',
  'Pré-Procedure',
  'Autoconhecimento',
];

export default function ProfilePage() {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [styleObjective, setStyleObjective] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE}/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        const data = await res.json();
        setFullName(data.full_name || '');
        setGender(data.gender || '');
        setAge(data.age?.toString() || '');
        setStyleObjective(data.style_objective || '');
        setProfilePicture(data.profile_picture || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  function handlePhotoUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePicture(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName || null,
          gender: gender || null,
          age: age ? Number(age) : null,
          style_objective: styleObjective || null,
          profile_picture: profilePicture || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar perfil');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-secondary">Carregando perfil...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 p-4 md:p-8 md:pl-4">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h1 className="text-lg font-bold tracking-tight text-text-primary mb-8">Meu Perfil</h1>
          </FadeIn>

          <form onSubmit={handleSave}>
            {/* Foto de perfil */}
            <ScaleIn delay={0.1}>
              <FieldGroup>
                <Field orientation="vertical" className="items-center">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-border overflow-hidden bg-card-bg flex items-center justify-center">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-text-muted" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-accent text-background flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                    />
                  </div>
                  <FieldDescription>Clique no ícone para alterar a foto</FieldDescription>
                </Field>
              </FieldGroup>
            </ScaleIn>

            {/* Dados pessoais */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-border bg-card-bg p-6 mt-8">
                <h2 className="text-sm font-semibold text-text-secondary mb-5">Dados Pessoais</h2>
                <FieldGroup>
                  <Field orientation="vertical">
                    <FieldContent>
                      <FieldLabel>Nome Completo</FieldLabel>
                      <Input
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </FieldContent>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field orientation="vertical">
                      <FieldContent>
                        <FieldLabel>Idade</FieldLabel>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="Ex: 28"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                        />
                        <FieldDescription>Anos</FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field orientation="vertical">
                      <FieldContent>
                        <FieldLabel>Gênero / Estilo</FieldLabel>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <option value="">Selecione</option>
                          {GENDER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </FieldContent>
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            </FadeIn>

            {/* Objetivo de estilo */}
            <FadeIn delay={0.3}>
              <div className="rounded-2xl border border-border bg-card-bg p-6 mt-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-5">Objetivo Principal de Estilo</h2>
                <Field orientation="vertical">
                  <FieldContent>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setStyleObjective(styleObjective === opt ? '' : opt)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            styleObjective === opt
                              ? 'bg-brand-accent text-background'
                              : 'bg-white/5 text-text-secondary border border-border hover:border-brand-accent/40'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <FieldDescription>Selecione o seu objetivo principal</FieldDescription>
                  </FieldContent>
                </Field>
              </div>
            </FadeIn>

            {/* Feedback */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-6">
                {error}
              </div>
            )}
            {saved && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm mt-6">
                <CheckCircle2 className="w-4 h-4" />
                Perfil salvo com sucesso!
              </div>
            )}

            {/* Botão salvar */}
            <FadeIn delay={0.4}>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>
            </FadeIn>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
