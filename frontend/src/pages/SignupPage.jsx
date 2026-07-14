import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export default function SignupPage() {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [styleObjective, setStyleObjective] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');
      const confirmPassword = formData.get('confirm-password');

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      const result = await register(email, password);

      if (result.success) {
        // Save profile data
        try {
          await fetch(`${API_BASE}/profile/`, {
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
            }),
          });
        } catch {
          // Profile save failed, but account was created
        }
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden bg-card-bg border-border">
          <CardContent className="p-6 md:p-8">
            <form className="flex flex-col gap-5" onSubmit={handleSignup}>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-text-primary">Criar conta</h1>
                <p className="text-balance text-text-secondary">Preencha os dados para começar</p>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="full-name" className="text-text-secondary">Nome Completo</Label>
                <Input
                  id="full-name"
                  name="full-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background border-border text-text-primary placeholder:text-text-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-text-secondary">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-background border-border text-text-primary placeholder:text-text-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-text-secondary">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="bg-background border-border text-text-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-text-secondary">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                  className="bg-background border-border text-text-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary">Idade</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Ex: 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-background border-border text-text-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary">Gênero</Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  <option value="">Selecione</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary">Objetivo de Estilo</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStyleObjective(styleObjective === opt ? '' : opt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        styleObjective === opt
                          ? 'bg-brand-accent text-background'
                          : 'bg-white/5 text-text-secondary border border-border hover:border-brand-accent/40'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-accent text-background font-semibold hover:opacity-90"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
              <div className="text-center text-sm text-text-secondary">
                Já tem uma conta?{' '}
                <Link to="/login" className="underline underline-offset-4 text-brand-accent hover:text-brand-accent/80">
                  Entrar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
