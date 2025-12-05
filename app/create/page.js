'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSurveyPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [theme, setTheme] = useState('professional');
    const [questions, setQuestions] = useState([]);

    // Helper to add a new question
    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: '',
                question_type: 'text',
                is_required: true,
                choices: [],
                tempChoice: '' // For managing input of new choice
            }
        ]);
    };

    // Helper to remove a question
    const removeQuestion = (index) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    // Helper to update a question field
    const updateQuestion = (index, field, value) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    // Helper to add a choice to a question
    const addChoice = (index) => {
        const newQ = [...questions];
        const val = newQ[index].tempChoice;
        if (val && val.trim() !== '') {
            newQ[index].choices.push(val.trim());
            newQ[index].tempChoice = '';
            setQuestions(newQ);
        }
    };

    // Helper to remove a choice
    const removeChoice = (qIndex, cIndex) => {
        const newQ = [...questions];
        newQ[qIndex].choices.splice(cIndex, 1);
        setQuestions(newQ);
    };

    // Helper to apply a template
    const applyTemplate = (index, type) => {
        const newQ = [...questions];
        let choices = [];
        switch (type) {
            case 'yesno':
                choices = ['Sì', 'No'];
                break;
            case 'truefalse':
                choices = ['Vero', 'Falso'];
                break;
            case 'likert5':
                choices = ['1 (Molto in disaccordo)', '2', '3', '4', '5 (Molto d\'accordo)'];
                break;
        }
        newQ[index].choices = choices;
        setQuestions(newQ);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare payload (remove UI-only fields)
        const payloadQuestions = questions.map(q => ({
            text: q.text,
            question_type: q.question_type,
            is_required: q.is_required,
            choices: q.choices,
            order: 0 // Optional, handled by backend usually or could be index
        }));

        const payload = {
            title,
            description,
            theme,
            questions: payloadQuestions
        };

        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        const res = await fetch(`${apiUrl}/api/surveys/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Questionario creato con successo!');
            router.push('/dashboard');
        } else {
            const err = await res.json();
            alert('Errore creazione: ' + JSON.stringify(err));
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>Crea Nuovo Questionario</h1>

            <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* General Info */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Titolo</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        placeholder="Es. Sondaggio soddisfazione clienti"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Descrizione</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Breve descrizione del sondaggio..."
                        rows={3}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tema</label>
                    <select
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                        <option value="professional" style={{ color: 'black' }}>Professional (Blu)</option>
                        <option value="light" style={{ color: 'black' }}>Light (Chiaro)</option>
                        <option value="dark" style={{ color: 'black' }}>Dark (Scuro)</option>
                    </select>
                </div>

                <hr style={{ borderColor: 'hsl(var(--border))', opacity: 0.3 }} />

                {/* Questions */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Domande ({questions.length})</h2>
                        <button type="button" onClick={addQuestion} className="secondary">+ Aggiungi Domanda</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {questions.map((q, idx) => (
                            <div key={idx} style={{
                                padding: '1.5rem',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.05)', /* lighter bg for nested */
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0 }}>Domanda {idx + 1}</h4>
                                    <button type="button" onClick={() => removeQuestion(idx)} style={{ background: '#ef4444', border: 'none', padding: '4px 8px', fontSize: '0.8rem', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Rimuovi</button>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={e => updateQuestion(idx, 'text', e.target.value)}
                                        placeholder="Testo della domanda..."
                                        required
                                        style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                    />

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <select
                                            value={q.question_type}
                                            onChange={e => updateQuestion(idx, 'question_type', e.target.value)}
                                            style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        >
                                            <option value="text">Testo Libero</option>
                                            <option value="single">Scelta Singola</option>
                                            <option value="multi">Scelta Multipla</option>
                                        </select>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={q.is_required}
                                                onChange={e => updateQuestion(idx, 'is_required', e.target.checked)}
                                            />
                                            Obbligatoria
                                        </label>
                                    </div>

                                    {/* Choices Section (only for single/multi) */}
                                    {(q.question_type === 'single' || q.question_type === 'multi') && (
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>

                                            {/* Templates */}
                                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Template Rapidi:</span>
                                                <button type="button" onClick={() => applyTemplate(idx, 'yesno')} className="secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Sì / No</button>
                                                <button type="button" onClick={() => applyTemplate(idx, 'truefalse')} className="secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Vero / Falso</button>
                                                <button type="button" onClick={() => applyTemplate(idx, 'likert5')} className="secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Scala 1-5</button>
                                            </div>

                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Opzioni di risposta:</label>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.5rem' }}>
                                                {q.choices.map((c, cIdx) => (
                                                    <li key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                                        <span>{c}</span>
                                                        <button type="button" onClick={() => removeChoice(idx, cIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={q.tempChoice}
                                                    onChange={e => updateQuestion(idx, 'tempChoice', e.target.value)}
                                                    placeholder="Nuova opzione..."
                                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addChoice(idx);
                                                        }
                                                    }}
                                                />
                                                <button type="button" onClick={() => addChoice(idx)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Aggiungi</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Crea Questionario
                </button>

            </form>
        </div>
    );
}
