import { useNavigate } from 'react-router-dom';
import { SignupForm } from '@/components/signup-form';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // TODO: substituir por chamada real de registro
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <SignupForm onSubmit={handleSignup} />
      </div>
    </div>
  );
}
