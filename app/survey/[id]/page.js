'use client';
// Force rebuild
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function SurveyPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const urlToken = searchParams.get('token');

    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Deep link: Save token if present in URL
        if (urlToken) {
            localStorage.setItem('token', urlToken);
        }

        if (!id) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        fetch(`${apiUrl}/api/surveys/${id}/`)
            .then(res => res.json())
            .then(data => {
                setSurvey(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id, urlToken]);

    const handleInputChange = (questionId, value, type) => {
        setAnswers(prev => {
            if (type === 'multi') {
                // value is the choice string
                const current = prev[questionId]?.answer_choice || [];
                if (current.includes(value)) {
                    return { ...prev, [questionId]: { ...prev[questionId], answer_choice: current.filter(c => c !== value) } };
                } else {
                    return { ...prev, [questionId]: { ...prev[questionId], answer_choice: [...current, value] } };
                }
            } else if (type === 'single') {
                return { ...prev, [questionId]: { ...prev[questionId], answer_choice: [value] } };
            } else {
                return { ...prev, [questionId]: { ...prev[questionId], answer_text: value } };
            }
        });
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Token mancante. Usa il link di invito.");
            return;
        }

        // Validation
        const unresponded = survey.questions.filter(q => {
            if (!q.is_required) return false;
            const ans = answers[q.id];
            if (!ans) return true;

            if (q.question_type === 'text') {
                return !ans.answer_text || ans.answer_text.trim() === '';
            } else {
                return !ans.answer_choice || ans.answer_choice.length === 0;
            }
        });

        if (unresponded.length > 0) {
            alert(`Per favore rispondi alle seguenti domande obbligatorie: ${unresponded.map(q => q.order + 1).join(', ')}`); // Used order+1 or index+1 visual
            return;
        }

        const payload = Object.keys(answers).map(qId => ({
            question_id: qId,
            answer_text: answers[qId].answer_text || '',
            answer_choice: answers[qId].answer_choice || []
        }));

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/api/surveys/${id}/submit/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, answers: payload })
        });

        if (!res.ok) {
            const data = await res.json();
            alert('Errore invio: ' + (data.error || 'Errore sconosciuto'));
            return;
        }

        alert('Grazie! Risposta inviata.');
        router.push('/dashboard');
    };

    if (loading || !survey) return <div className="container">Caricamento in corso...</div>;

    return (
        <div className={`theme-${survey.theme || 'professional'}`} style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0' }}>
                <div className="glass-card">
                    <h1>{survey.title}</h1>
                    <p style={{ marginBottom: '2rem' }}>{survey.description}</p>

                    {survey.questions.map((q, index) => (
                        <div key={q.id} style={{ marginBottom: '2rem' }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                {index + 1}. {q.text} {q.is_required && <span style={{ color: 'red' }}>*</span>}
                            </p>

                            {q.question_type === 'text' && (
                                <textarea
                                    rows={3}
                                    onChange={(e) => handleInputChange(q.id, e.target.value, 'text')}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
                                />
                            )}

                            {q.question_type === 'single' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {q.choices.map((c, i) => (
                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                value={c}
                                                style={{ width: 'auto', margin: 0 }}
                                                onChange={(e) => handleInputChange(q.id, e.target.value, 'single')}
                                            />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.question_type === 'multi' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {q.choices.map((c, i) => (
                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                value={c}
                                                style={{ width: 'auto', margin: 0 }}
                                                onChange={(e) => handleInputChange(q.id, c, 'multi')}
                                            />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <button onClick={handleSubmit} style={{ marginTop: '2rem', width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Invia Risposte</button>
                </div>
            </div>
        </div>
    );
}
