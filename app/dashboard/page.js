'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        // Fetch surveys
        // For MVP, we fetch all and let backend helper filter or just show all for now
        fetch('http://127.0.0.1:8000/api/surveys/', {
            headers: {
                'Authorization': `Bearer ${token}` // If we implemented auth header
            }
        })
            .then(res => res.json())
            .then(data => {
                setSurveys(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [router]);

    if (loading) return <div className="container">Caricamento in corso...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>I Miei Questionari</h1>
                <button className="secondary" onClick={() => {
                    localStorage.clear();
                    router.push('/');
                }}>Esci</button>
            </header>

            <div className="grid">
                {surveys.map(survey => (
                    <div key={survey.id} className="glass-card">
                        <h2>{survey.title}</h2>
                        <p>{survey.description}</p>
                        <div style={{ marginTop: '1rem' }}>
                            <Link href={`/survey/${survey.id}`}>
                                <button>Inizia</button>
                            </Link>
                        </div>
                    </div>
                ))}

                {surveys.length === 0 && (
                    <p>Nessun questionario disponibile.</p>
                )}
            </div>
        </div>
    );
}
