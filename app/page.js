'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/auth/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', data.role);
        if (data.role === 'observer') {
          router.push('/observer');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Accesso fallito');
      }
    } catch (err) {
      setError('Errore di connessione: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1>Benvenuto</h1>
        <p style={{ marginBottom: '2rem', color: 'hsl(var(--muted-foreground))' }}>Per accedere al questionario, inserisci il tuo token di invito.</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Inserisci il tuo token (UUID)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          {error && <p style={{ color: 'hsl(var(--destructive))', marginTop: '0.5rem' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Verifica in corso...' : 'Entra'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Development Helper:</p>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/admin`} target="_blank" style={{ color: 'hsl(var(--primary))', textDecoration: 'none' }}>Go to Django Admin</a>
        </div>
      </div>
    </main>
  );
}
