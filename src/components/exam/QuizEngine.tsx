import React, { useEffect, useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { useNavigate, useParams } from 'react-router-dom';
import { Timer, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined)[]) => twMerge(clsx(inputs));

export const QuizEngine: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { 
        exams, 
        timer, 
        tickTimer, 
        submitAnswer, 
        answers, 
        examStatus, 
        submitExam,
        loadExamData,
        loading,
        error
    } = useExamStore();
    
    const [currentQIndex, setCurrentQIndex] = useState(0);

    const exam = exams.find(e => e.id === Number(id));

    // Load Data if missing (refresh case or race condition)
    useEffect(() => {
        if ((!exam || !exam.questions) && id) {
            loadExamData(Number(id));
        }
    }, [exam, id, loadExamData]);

    // Timer Effect
    useEffect(() => {
        if (examStatus !== 'in_progress') return;
        const interval = setInterval(tickTimer, 1000);
        return () => clearInterval(interval);
    }, [examStatus, tickTimer]);

    // ... (formatTime)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ... (Auto-redirect)
    useEffect(() => {
        if (examStatus === 'submitted') {
            navigate(`/exams/results/${id}`);
        }
    }, [examStatus, id, navigate]);

    // ... (Keyboard)
    // ...

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">Error Loading Exam</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/exams')} className="mt-4 text-blue-600 underline">Return to Exams</button>
            </div>
        );
    }

    if (!exam || !exam.questions) {
        return <div className="p-8 text-center">Exam data not found. <button onClick={() => navigate('/exams')} className="text-blue-600 underline">Exams List</button></div>;
    }

    const question = exam.questions[currentQIndex];
    if (!question) return <div>Question not found</div>;

    const progress = ((currentQIndex + 1) / exam.questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-gray-900 truncate max-w-md">{exam.exam_name}</h1>
                    
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-lg",
                        timer < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-blue-50 text-blue-700"
                    )}>
                        <Timer size={20} />
                        {formatTime(timer)}
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-100">
                    <motion.div 
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col">
                 <div className="mb-8">
                     <span className="text-gray-400 font-medium text-sm tracking-wide uppercase">Question {currentQIndex + 1} of {exam.questions.length}</span>
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 leading-tight">
                         {question.question_text}
                     </h2>
                 </div>

                 <div className="space-y-4 flex-1">
                     {question.options.map((opt, idx) => {
                         const isSelected = answers[question.id] === opt.id;
                         const keyLabel = ['A', 'B', 'C', 'D'][idx];
                         
                         return (
                             <button
                                key={opt.id}
                                onClick={() => submitAnswer(question.id, opt.id)}
                                className={cn(
                                    "w-full text-left p-5 rounded-xl border-2 transition-all group flex items-start gap-4 hover:shadow-sm active:scale-[0.99]",
                                    isSelected 
                                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600" 
                                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                                )}
                             >
                                 <div className={cn(
                                     "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors",
                                     isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-100 border-gray-200 text-gray-500 group-hover:border-blue-300 group-hover:text-blue-600"
                                 )}>
                                     {keyLabel}
                                 </div>
                                 <span className={cn(
                                     "text-lg",
                                     isSelected ? "font-medium text-blue-900" : "text-gray-700"
                                 )}>
                                     {opt.option_text}
                                 </span>
                                 
                                 {isSelected && <CheckCircle2 className="ml-auto text-blue-600" />}
                             </button>
                         );
                     })}
                 </div>

                 {/* Footer Nav */}
                 <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
                     <button
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(i => i - 1)}
                        className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500"
                     >
                         <ArrowLeft size={20} /> Previous
                     </button>
                     
                     {currentQIndex === exam.questions.length - 1 ? (
                        <button
                            onClick={async () => {
                                try {
                                    await submitExam();
                                } catch (e) {
                                    console.error("Submission failed", e);
                                }
                            }}
                            disabled={loading}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-lg transition-all",
                                loading 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20 active:scale-95"
                            )}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Exam"
                            )}
                        </button>
                     ) : (
                         <button
                            onClick={() => setCurrentQIndex(i => i + 1)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            Next <ArrowRight size={20} />
                        </button>
                     )}
                 </div>
                 
                 <div className="mt-8 text-center text-xs text-gray-400">
                     Press <kbd className="font-mono bg-gray-100 px-1 rounded">A</kbd> <kbd className="font-mono bg-gray-100 px-1 rounded">B</kbd> <kbd className="font-mono bg-gray-100 px-1 rounded">C</kbd> <kbd className="font-mono bg-gray-100 px-1 rounded">D</kbd> to select, arrows to navigate
                 </div>
            </main>
        </div>
    );
};
