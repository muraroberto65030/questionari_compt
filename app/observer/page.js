'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

function TextStats({ responses }) {
    // Aggregate text responses
    const counts = {};
    responses.forEach(r => {
        const text = r.answer || "(Vuoto)";
        counts[text] = (counts[text] || 0) + 1;
    });

    const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([text, count]) => ({ text, count }));

    // Pagination
    const PAGE_SIZE = 7;
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

    const displayed = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {displayed.map((item, i) => (
                    <li key={i} style={{
                        padding: '8px',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontWeight: 500 }}>{item.text}</span>
                        <span className="badge" style={{
                            background: 'hsl(var(--secondary))',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.9rem'
                        }}>{item.count}</span>
                    </li>
                ))}
            </ul>
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{ padding: '4px 12px' }}
                    >Previous</button>
                    <span>Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        style={{ padding: '4px 12px' }}
                    >Next</button>
                </div>
            )}
        </div>
    );
}

function ChoiceStats({ responses }) {
    // Aggregate choices
    const counts = {};
    responses.forEach(r => {
        const answers = Array.isArray(r.answer) ? r.answer : [r.answer];
        answers.forEach(ans => {
            const val = ans || "(Vuoto)";
            counts[val] = (counts[val] || 0) + 1;
        });
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function ObserverPage() {
    const [surveys, setSurveys] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        fetch(`${apiUrl}/api/surveys/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setSurveys(data);
                setLoading(false);
            });
    }, []);

    const viewResults = async (id) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/api/surveys/${id}/results/`);
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

    // Group results by question
    const groupedResults = results.reduce((acc, curr) => {
        if (!acc[curr.question]) {
            acc[curr.question] = { question: curr.question, responses: [] };
        }
        acc[curr.question].responses.push(curr);
        return acc;
    }, {});

    const sortedQuestions = Object.values(groupedResults); // Order depends on fetch, likely creation order

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
                                <button onClick={() => viewResults(s.id)} style={{ padding: '4px 12px', fontSize: '0.9rem' }}>Vedi Statistiche</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Statistiche {selectedSurvey ? `#${selectedSurvey}` : ''}</h2>
                        {selectedSurvey && results.length > 0 && <button onClick={downloadCSV} className="secondary">Esporta CSV</button>}
                    </div>

                    {selectedSurvey && results.length > 0 && (() => {
                        // Calculate summary metrics
                        const uniqueRespondents = new Set(results.map(r => r.email)).size;
                        const timestamps = results.map(r => new Date(r.submitted_at).getTime());
                        const firstResponse = new Date(Math.min(...timestamps));
                        const lastResponse = new Date(Math.max(...timestamps));

                        return (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px'
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Questionari Compilati</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uniqueRespondents}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Prima Risposta</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{firstResponse.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Ultima Risposta</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{lastResponse.toLocaleString()}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {selectedSurvey ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {sortedQuestions.map((group, idx) => {
                                // Determine type by looking at first response
                                const firstAns = group.responses[0]?.answer;
                                const isText = typeof firstAns === 'string' && group.responses.some(r => r.answer && r.answer.length > 20);
                                // Better heuristic: check if answers were arrays (multi/single choice usually return list or short string)
                                // Actually backend returns string for text, list for choices.
                                // Let's check array.
                                const isChoice = Array.isArray(firstAns) || (group.responses[0] && Array.isArray(group.responses[0].answer));

                                return (
                                    <div key={idx} style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {group.question}</h3>

                                        {isChoice ? (
                                            <ChoiceStats responses={group.responses} />
                                        ) : (
                                            <TextStats responses={group.responses} />
                                        )}
                                    </div>
                                );
                            })}

                            {sortedQuestions.length === 0 && <p>Nessun dato disponibile.</p>}
                        </div>
                    ) : (
                        <p>Seleziona un questionario per vedere le statistiche.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
