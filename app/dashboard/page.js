'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('role');
        setRole(userRole);

        if (!token) {
            router.push('/');
            return;
        }

        // Fetch surveys
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        fetch(`${apiUrl}/api/surveys/?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSurveys(data);
                } else {
                    console.error("Invalid surveys data:", data);
                    setSurveys([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    }, [router]);

    const fetchHistory = () => {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        fetch(`${apiUrl}/api/surveys/history/?token=${token}`)
            .then(async res => {
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || errData.error || `Errore ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setHistory(data);
                    setShowHistory(true);
                } else {
                    console.error("Invalid history data:", data);
                    alert("Errore formato dati: Atteso array, ricevuto " + typeof data);
                }
            })
            .catch(err => alert("Impossibile caricare lo storico: " + err.message));
    };

    if (loading) return <div className="container">Caricamento in corso...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>{showHistory ? 'Le Mie Risposte' : 'I Miei Questionari'}</h1>
                    {role === 'creator' && !showHistory && (
                        <Link href="/create">
                            <button style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>+ Crea Nuovo</button>
                        </Link>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!showHistory ? (
                        <button className="secondary" onClick={fetchHistory}>Le mie risposte</button>
                    ) : (
                        <button className="secondary" onClick={() => setShowHistory(false)}>Torna ai questionari</button>
                    )}

                    <button className="secondary" onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        router.push('/');
                    }}>Esci</button>
                </div>
            </header>

            {showHistory ? (
                <div className="grid">
                    {history.length === 0 && <p>Non hai ancora compilato nessun questionario.</p>}
                    {history.map(h => (
                        <div key={h.survey_id} className="glass-card">
                            <h2>{h.survey_title}</h2>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Compilato il: {new Date(h.last_submitted).toLocaleString()}</p>
                            <hr style={{ margin: '1rem 0', opacity: 0.2 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {h.responses.map((r, i) => (
                                    <div key={i}>
                                        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{r.question}</strong>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {Array.isArray(r.answer) ? r.answer.join(', ') : r.answer}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid">
                    {surveys.map(survey => (
                        <div key={survey.id} className="glass-card">
                            <h2>{survey.title}</h2>
                            <p>{survey.description}</p>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <Link href={`/survey/${survey.id}`}>
                                    <button>Inizia</button>
                                </Link>
                                {role === 'creator' && (
                                    <>
                                        <Link href={`/create?id=${survey.id}`}>
                                            <button className="secondary" style={{ padding: '0.5rem 1rem' }}>Modifica</button>
                                        </Link>
                                        <button
                                            className="secondary"
                                            style={{ padding: '0.5rem 1rem' }}
                                            onClick={() => document.getElementById(`file-upload-${survey.id}`).click()}
                                        >
                                            Invita (CSV)
                                        </button>
                                        <input
                                            type="file"
                                            id={`file-upload-${survey.id}`}
                                            style={{ display: 'none' }}
                                            accept=".csv"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const token = localStorage.getItem('token');
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('token', token);

                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

                                                fetch(`${apiUrl}/api/surveys/${survey.id}/invite/?token=${token}`, {
                                                    method: 'POST',
                                                    body: formData
                                                })
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        if (data.status === 'success') {
                                                            alert(`Inviti inviati con successo a ${data.invited} indirizzi!`);
                                                        } else {
                                                            alert('Errore: ' + (data.error || 'Sconosciuto'));
                                                        }
                                                    })
                                                    .catch(err => alert('Errore di rete: ' + err.message));

                                                e.target.value = null;
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {surveys.length === 0 && (
                        <p>Nessun questionario disponibile.</p>
                    )}
                </div>
            )}
        </div>
    );
}
