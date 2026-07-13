import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/*
 * SEGURANÇA: Quando integrarmos com o backend Python, todas as requisições
 * de fetch/axios para login/logout DEVERÃO incluir { credentials: 'include' }
 * para permitir que o navegador receba e armazene o HttpOnly Cookie
 * automaticamente. Exemplo:
 *
 *   fetch('/api/login', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     credentials: 'include',  // <-- OBRIGATÓRIO para HttpOnly Cookies
 *     body: JSON.stringify({ email, password }),
 *   });
 *
 * Isso garante que o cookie seja enviado/recebido de forma blindada,
 * sem acesso via JavaScript (XSS-safe).
 */

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    // TODO: substituir por chamada real ao backend
    // const response = await fetch('/api/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   credentials: 'include',
    //   body: JSON.stringify({ email, password }),
    // });

    // Mock: simula login bem-sucedido
    setIsAuthenticated(true);
    setUser({ email, name: 'Usuário' });
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    // TODO: substituir por chamada real ao backend
    // await fetch('/api/logout', {
    //   method: 'POST',
    //   credentials: 'include',
    // });

    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
