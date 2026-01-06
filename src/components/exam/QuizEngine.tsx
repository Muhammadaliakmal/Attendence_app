import React, { useEffect, useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { useNavigate, useParams } from 'react-router-dom';
import { Timer, ArrowRight, ArrowLeft, CheckCircle2, Clock, Flag, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { message } from 'antd';

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
    const [showSidebar, setShowSidebar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const exam = exams.find(e => e.id === Number(id));

    // Load exam data
    useEffect(() => {
        if ((!exam || !exam.questions) && id) {
            loadExamData(Number(id));
        }
    }, [exam, id, loadExamData]);

    // Protection: Ensure active session
    useEffect(() => {
        const examId = Number(id);
        const storeActiveId = useExamStore.getState().activeExamId;
        const storeStudentExamId = useExamStore.getState().studentExamId;

        if (!storeActiveId || storeActiveId !== examId || !storeStudentExamId) {
            message.error('Please start the exam from the exam list');
            navigate('/exams');
        }
    }, [id, navigate]);

    // Timer
    useEffect(() => {
        if (examStatus !== 'in_progress') return;
        const interval = setInterval(tickTimer, 1000);
        return () => clearInterval(interval);
    }, [examStatus, tickTimer]);

    // Auto-redirect on submit
    useEffect(() => {
        if (examStatus === 'submitted') {
            navigate(`/exams/results/${id}`);
        }
    }, [examStatus, id, navigate]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!exam?.questions) return;
            const question = exam.questions[currentQIndex];
            
            // Number keys for options
            if (['1', '2', '3', '4'].includes(e.key)) {
                const optIndex = parseInt(e.key) - 1;
                if (question.options[optIndex]) {
                    submitAnswer(question.id, question.options[optIndex].id);
                }
            }
            
            // Arrow keys for navigation
            if (e.key === 'ArrowLeft' && currentQIndex > 0) {
                setCurrentQIndex(i => i - 1);
            }
            if (e.key === 'ArrowRight' && currentQIndex < exam.questions.length - 1) {
                setCurrentQIndex(i => i + 1);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentQIndex, exam, submitAnswer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        const unanswered = exam?.questions?.filter(q => !answers[q.id]).length || 0;
        
        if (unanswered > 0) {
            const confirmed = window.confirm(
                `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
            );
            if (!confirmed) return;
        }

        setIsSubmitting(true);
        try {
            await submitExam();
        } catch (e) {
            console.error("Submission failed", e);
            message.error('Failed to submit exam. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading exam...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-red-50 to-orange-50">
                <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flag className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900">Error Loading Exam</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate('/exams')} 
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Return to Exams
                    </button>
                </div>
            </div>
        );
    }

    if (!exam || !exam.questions) {
        return (
            <div className="p-8 text-center">
                Exam data not found. 
                <button onClick={() => navigate('/exams')} className="text-blue-600 underline ml-2">
                    Return to Exams
                </button>
            </div>
        );
    }

    const question = exam.questions[currentQIndex];
    if (!question) return <div>Question not found</div>;

    const progress = ((currentQIndex + 1) / exam.questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="font-bold text-gray-900 truncate max-w-md">{exam.exam_name}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 size={16} />
                            <span className="font-medium">{answeredCount}/{exam.questions.length}</span>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg transition-all ${
                            timer < 60 
                                ? "bg-red-100 text-red-700 animate-pulse shadow-lg shadow-red-200" 
                                : timer < 300
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                        }`}>
                            <Timer size={20} />
                            {formatTime(timer)}
                        </div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-100">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl w-full mx-auto">
                {/* Sidebar - Question Navigator */}
                <AnimatePresence>
                    {(showSidebar || window.innerWidth >= 1024) && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="w-64 bg-white/50 backdrop-blur-sm border-r border-gray-200/50 p-6 overflow-y-auto"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Questions</h3>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2">
                                {exam.questions.map((q, idx) => {
                                    const isAnswered = !!answers[q.id];
                                    const isCurrent = idx === currentQIndex;
                                    
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQIndex(idx)}
                                            className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                                                isCurrent
                                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                                                    : isAnswered
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                <p className="text-xs text-gray-600 mb-2">Progress</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {Math.round(progress)}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {answeredCount} of {exam.questions.length} answered
                                </p>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-12 flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="mb-8">
                                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                                    Question {currentQIndex + 1} of {exam.questions.length}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                                    {question.question_text}
                                </h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    Worth {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                </p>
                            </div>

                            <div className="space-y-3 flex-1">
                                {question.options.map((opt, idx) => {
                                    const isSelected = answers[question.id] === opt.id;
                                    const keyLabel = ['A', 'B', 'C', 'D'][idx];
                                    
                                    return (
                                        <motion.button
                                            key={opt.id}
                                            onClick={() => submitAnswer(question.id, opt.id)}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`w-full text-left p-5 rounded-xl border-2 transition-all group flex items-start gap-4 ${
                                                isSelected 
                                                    ? "border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-100" 
                                                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                                isSelected 
                                                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-600 text-white shadow-lg" 
                                                    : "bg-gray-50 border-gray-200 text-gray-500 group-hover:border-blue-300 group-hover:text-blue-600"
                                            }`}>
                                                {keyLabel}
                                            </div>
                                            <span className={`text-lg flex-1 ${
                                                isSelected ? "font-semibold text-blue-900" : "text-gray-700"
                                            }`}>
                                                {opt.option_text}
                                            </span>
                                            
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <CheckCircle2 className="text-blue-600" size={24} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Navigation Footer */}
                            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
                                <button
                                    disabled={currentQIndex === 0}
                                    onClick={() => setCurrentQIndex(i => i - 1)}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 transition-all rounded-lg hover:bg-gray-100"
                                >
                                    <ArrowLeft size={20} /> Previous
                                </button>
                                
                                {currentQIndex === exam.questions.length - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-xl transition-all bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Flag size={20} />
                                                Submit Exam
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQIndex(i => i + 1)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Next <ArrowRight size={20} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="mt-6 text-center text-xs text-gray-400">
                                <kbd className="font-mono bg-gray-100 px-2 py-1 rounded">1-4</kbd> to select • 
                                <kbd className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">←→</kbd> to navigate
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};
