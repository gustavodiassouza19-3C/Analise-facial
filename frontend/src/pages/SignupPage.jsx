import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        return;
      }

      const result = await register(email, password);

      if (result.success) {
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
