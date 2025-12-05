'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([{ text: '', type: 'text', choices: [] }]);
    const router = useRouter();

    const addQuestion = () => {
        setQuestions([...questions, { text: '', type: 'text', choices: [] }]);
    };

    const applyMacro = (index, macro) => {
        const newQuestions = [...questions];
        if (macro === 'sino') {
            newQuestions[index].type = 'single';
            newQuestions[index].choices = ['Si', 'No'];
        } else if (macro === 'verofalso') {
            newQuestions[index].type = 'single';
            newQuestions[index].choices = ['Vero', 'Falso'];
        } else if (macro === 'agreement') {
            newQuestions[index].type = 'single';
            newQuestions[index].choices = ['Poco d\'accordo', 'Indifferente', 'Molto d\'accordo'];
        }
        setQuestions(newQuestions);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        if (field === 'type' && value === 'text') {
            newQuestions[index].choices = []; // Clear choices if text
        }
        setQuestions(newQuestions);
    };

    const updateChoice = (qIndex, cIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices[cIndex] = value;
        setQuestions(newQuestions);
    };

    const addChoice = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices.push('');
        setQuestions(newQuestions);
    };

    const removeChoice = (qIndex, cIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices.splice(cIndex, 1);
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        const payload = {
            title,
            description,
            created_by: 1, // Mock superuser
            questions: questions.map((q, i) => ({
                text: q.text,
                question_type: q.type,
                choices: q.choices,
                order: i
            }))
        };

        const res = await fetch('http://127.0.0.1:8000/api/surveys/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Questionnaire Created!');
            // Generate an invitation for testing?
            // For MVP, user can use django admin to create invites.
            setTitle('');
            setDescription('');
            setQuestions([{ text: '', type: 'text', choices: [] }]);
        } else {
            alert('Error creating survey');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1>Create Questionnaire</h1>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <input
                    placeholder="Survey Title"
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                />
                <textarea
                    placeholder="Description"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {questions.map((q, index) => (
                <div key={index} className="glass-card" style={{ marginBottom: '1rem', position: 'relative' }}>
                    <p style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.5 }}>#{index + 1}</p>
                    <input
                        placeholder="Question Text"
                        value={q.text}
                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                    />

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <select value={q.type} onChange={(e) => updateQuestion(index, 'type', e.target.value)} style={{ width: 'auto' }}>
                            <option value="text">Free Text</option>
                            <option value="single">Single Choice</option>
                            <option value="multi">Multiple Choice {q.type === 'multi' ? '(Checkbox)' : ''}</option>
                        </select>

                        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Macros:</span>
                        <button style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => applyMacro(index, 'sino')}>Si/No</button>
                        <button style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => applyMacro(index, 'verofalso')}>V/F</button>
                        <button style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => applyMacro(index, 'agreement')}>Agree</button>
                    </div>

                    {(q.type === 'single' || q.type === 'multi') && (
                        <div style={{ paddingLeft: '1rem', borderLeft: '2px solid hsl(var(--border))' }}>
                            {q.choices.map((c, cIndex) => (
                                <div key={cIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        value={c}
                                        onChange={(e) => updateChoice(index, cIndex, e.target.value)}
                                        placeholder={`Option ${cIndex + 1}`}
                                    />
                                    <button
                                        onClick={() => removeChoice(index, cIndex)}
                                        style={{ background: 'hsl(var(--destructive))', padding: '0 12px' }}
                                    >X</button>
                                </div>
                            ))}
                            <button onClick={() => addChoice(index)} className="secondary">+ Add Option</button>
                        </div>
                    )}
                </div>
            ))}

            <button onClick={addQuestion} className="secondary" style={{ width: '100%', marginBottom: '1rem' }}>+ Add Question</button>
            <button onClick={handleSave} style={{ width: '100%' }}>Save Questionnaire</button>
        </div>
    );
}
