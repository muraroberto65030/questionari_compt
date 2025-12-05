'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ObserverPage() {
    const [surveys, setSurveys] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Ideally verify role
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');

        fetch('http://127.0.0.1:8000/api/surveys/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setSurveys(data);
                setLoading(false);
            });
    }, []);

    const viewResults = async (id) => {
        // Fetch results
        const res = await fetch(`http://127.0.0.1:8000/api/surveys/${id}/results/`);
        const data = await res.json();
        setResults(data);
        setSelectedSurvey(id);
    };

    const downloadCSV = () => {
        if (!results.length) return;

        // Simple CSV conversion
        const headers = ['ID', 'Email', 'Question', 'Answer', 'Submitted At'];
        const rows = results.map(r => [
            r.id,
            r.email,
            `"${r.question}"`,
            `"${Array.isArray(r.answer) ? r.answer.join(', ') : r.answer}"`,
            r.submitted_at
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `results_survey_${selectedSurvey}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="container">Caricamento in corso...</div>;

    return (
        <div className="container">
            <h1>Dashboard Osservatore</h1>

            <div className="grid">
                <div className="glass-card">
                    <h2>Questionari</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {surveys.map(s => (
                            <li key={s.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{s.title}</span>
                                <button onClick={() => viewResults(s.id)} style={{ padding: '4px 12px', fontSize: '0.9rem' }}>Vedi Risultati</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2>Risultati {selectedSurvey ? `#${selectedSurvey}` : ''}</h2>
                        {selectedSurvey && <button onClick={downloadCSV} className="secondary">Esporta CSV</button>}
                    </div>

                    {selectedSurvey ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))' }}>
                                    <th style={{ padding: '8px' }}>Email</th>
                                    <th style={{ padding: '8px' }}>Domanda</th>
                                    <th style={{ padding: '8px' }}>Risposta</th>
                                    <th style={{ padding: '8px' }}>Data/Ora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                        <td style={{ padding: '8px' }}>{r.email}</td>
                                        <td style={{ padding: '8px' }}>{r.question}</td>
                                        <td style={{ padding: '8px' }}>{Array.isArray(r.answer) ? r.answer.join(', ') : r.answer}</td>
                                        <td style={{ padding: '8px' }}>{new Date(r.submitted_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Seleziona un questionario per vedere i risultati.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
