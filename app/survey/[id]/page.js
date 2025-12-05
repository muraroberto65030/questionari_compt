'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SurveyPage({ params }) {
    // Use `use` to unwrap params
    const { id } = use(params);

    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/surveys/${id}/`)
            .then(res => res.json())
            .then(data => {
                setSurvey(data);
                setLoading(false);
            });
    }, [id]);

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
        if (!token) return;

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
            alert(`Per favore rispondi alle seguenti domande obbligatorie: ${unresponded.map(q => q.order).join(', ')}`);
            return;
        }

        const payload = Object.keys(answers).map(qId => ({
            question_id: qId,
            answer_text: answers[qId].answer_text || '',
            answer_choice: answers[qId].answer_choice || []
        }));

        const res = await fetch(`http://127.0.0.1:8000/api/surveys/${id}/submit/`, {
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
        <div className={`container theme-${survey.theme || 'professional'}`} style={{ maxWidth: '800px' }}>
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

                <button onClick={handleSubmit} style={{ marginTop: '2rem', width: '100%' }}>Invia Risposte</button>
            </div>
        </div>
    );
}
