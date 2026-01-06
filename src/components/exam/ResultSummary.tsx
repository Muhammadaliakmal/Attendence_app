import React, { useEffect } from 'react';
import { useExamStore } from '../../store/examStore';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined)[]) => twMerge(clsx(inputs));

export const ResultSummary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { exams, answers, getScore, resetExam, loadExamData } = useExamStore();
    
    // Parse ID and find exam
    const examId = Number(id);
    const exam = exams.find(e => e.id === examId);
    const score = getScore();

    useEffect(() => {
        if (!exam && examId) {
            loadExamData(examId);
        }
    }, [exam, examId, loadExamData]);

    if (!exam || !exam.questions) {
        return <div className="p-12 text-center">Exam data not available. <button onClick={() => navigate('/exams')} className="text-blue-600 underline">Return to Exams</button></div>;
    }

    const handleHome = () => {
        resetExam();
        navigate('/')
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                            <circle 
                                cx="48" cy="48" r="40" 
                                stroke={score >= 70 ? "#16a34a" : "#ca8a04"} 
                                strokeWidth="8" 
                                fill="none" 
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 * (1 - score / 100)}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute text-2xl font-bold text-gray-900">{score}%</span>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {score >= 70 ? 'Excellent Job!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-gray-500 mb-6">
                        You successfully completed <strong>{exam.exam_name}</strong>
                    </p>
                    
                    <div className="flex gap-4 justify-center">
                         <button
                            onClick={handleHome}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                        >
                            <Home size={18} /> Dashboard
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 ml-1">Question Review</h3>
                    {exam.questions.map((q, idx) => {
                        const selected = answers[q.id];
                        const correct = q.options.find(o => o.is_correct);
                        const isCorrect = selected === correct?.id;
                        
                        return (
                            <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-100">
                                <div className="flex items-start gap-4">
                                     <div className={cn(
                                         "mt-0.5",
                                         isCorrect ? "text-green-500" : "text-red-500"
                                     )}>
                                         {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                     </div>
                                     <div className="flex-1">
                                         <p className="text-gray-900 font-medium mb-3">
                                             <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                             {q.question_text}
                                         </p>
                                         <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                             <span className="font-bold text-gray-900">Answer: </span>
                                             {correct?.option_text}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
