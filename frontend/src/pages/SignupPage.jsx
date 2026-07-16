import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Neutro'];
const STYLE_OPTIONS = [
  'Harmonia Facial',
  'Simetria e Proporcao',
  'Estilo Pessoal',
  'Pre-Procedure',
  'Autoconhecimento',
];

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
        setError('As senhas nao coincidem');
        setLoading(false);
        return;
      }

      const result = await signUp(email, password, fullName);

      if (result.success) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            full_name: fullName,
            gender: gender || '',
            age: age ? Number(age) : null,
            style_objective: styleObjective || '',
          });

          const selectedPlan = localStorage.getItem('selected_plan');
          if (selectedPlan) {
            navigate('/checkout-simulation');
          } else {
            navigate('/dashboard');
          }
        } else {
          // Email confirmation required — don't navigate, show message
          setSuccessMessage(result.message || 'Conta criada! Verifique seu email para ativar.');
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <Card className="overflow-hidden bg-card-bg border-border">
          <CardContent className="p-5 sm:p-8">
            <form className="flex flex-col gap-4" onSubmit={handleSignup}>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Criar conta</h1>
                <p className="text-sm text-text-secondary mt-1">Preencha os dados para comecar</p>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                  {successMessage}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="full-name" className="text-text-secondary text-sm">Nome Completo</Label>
                <Input
                  id="full-name"
                  name="full-name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-text-secondary text-sm">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-text-secondary text-sm">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  required
                  minLength={8}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-text-secondary text-sm">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary text-sm">Idade</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Ex: 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary text-sm">Genero</Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-neutral-800 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:border-brand-accent/30 transition-colors appearance-none"
                >
                  <option value="" className="bg-[#0a0a0a] text-neutral-400">Selecione</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0a0a0a] text-white">{opt}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label className="text-text-secondary text-sm">Objetivo de Estilo</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStyleObjective(styleObjective === opt ? '' : opt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        styleObjective === opt
                          ? 'bg-brand-accent text-background'
                          : 'bg-white/5 text-text-secondary border border-neutral-800 hover:border-brand-accent/40'
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
                className="w-full h-11 bg-brand-accent text-background font-semibold hover:opacity-90 rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </span>
                ) : 'Criar conta'}
              </Button>
              <div className="text-center text-sm text-text-secondary">
                Ja tem uma conta?{' '}
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
