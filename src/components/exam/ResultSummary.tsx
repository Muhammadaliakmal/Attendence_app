import React, { useEffect } from 'react';
import { useExamStore } from '../../store/examStore';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, Trophy, Target, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import supabase from '../../configdb/supabase';

export const ResultSummary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { exams, answers, resetExam, loadExamData } = useExamStore();
    const [dbScore, setDbScore] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [averageScore, setAverageScore] = React.useState<number | null>(null);

    const examId = Number(id);
    const exam = exams.find(e => e.id === examId);

    // Fetch official result from DB
    useEffect(() => {
        const fetchResult = async () => {
            if (!examId) return;
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const userName = session.user.email?.split('@')[0];
            const { data: student } = await supabase.from('studentsTable').select('id').eq('name', userName).single();
            
            if (student) {
                // Get student's score
                const { data: studentExam } = await supabase
                    .from('student_exam')
                    .select('total_score, status')
                    .eq('exam_id', examId)
                    .eq('student_id', student.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (studentExam) {
                    setDbScore(studentExam.total_score);
                }

                // Get average score for this exam
                const { data: allScores } = await supabase
                    .from('student_exam')
                    .select('total_score')
                    .eq('exam_id', examId)
                    .eq('status', 'submitted');
                
                if (allScores && allScores.length > 0) {
                    const avg = allScores.reduce((sum, s) => sum + s.total_score, 0) / allScores.length;
                    setAverageScore(Math.round(avg));
                }
            }
            setLoading(false);
        };

        if (examId) {
            loadExamData(examId);
            fetchResult();
        }
    }, [examId, loadExamData]);

    // Confetti effect for high scores
    useEffect(() => {
        if (dbScore !== null && exam) {
            const percentage = (dbScore / exam.total_marks) * 100;
            
            if (percentage >= 70) {
                const duration = 3000;
                const end = Date.now() + duration;

                const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

                (function frame() {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: colors
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: colors
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
        }
    }, [dbScore, exam]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!exam || !exam.questions) {
        return (
            <div className="p-12 text-center">
                Exam data not available. 
                <button onClick={() => navigate('/exams')} className="text-blue-600 underline ml-2">
                    Return to Exams
                </button>
            </div>
        );
    }

    const scoreToDisplay = dbScore !== null ? dbScore : 0;
    const totalPossible = exam.total_marks;
    const percentage = totalPossible > 0 ? Math.round((scoreToDisplay / totalPossible) * 100) : 0;
    
    const correctAnswers = exam.questions.filter(q => {
        const selected = answers[q.id];
        const correct = q.options.find(o => o.is_correct);
        return selected === correct?.id;
    }).length;

    const handleHome = () => {
        resetExam();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Main Result Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center mb-8 relative overflow-hidden"
                >
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-30 -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10"></div>

                    {/* Trophy Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                            percentage >= 70 ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                        }`}
                    >
                        <Trophy className="text-white" size={40} />
                    </motion.div>

                    {/* Score Circle */}
                    <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle 
                                cx="64" cy="64" r="56" 
                                stroke="#f3f4f6" 
                                strokeWidth="10" 
                                fill="none" 
                            />
                            <motion.circle 
                                cx="64" cy="64" r="56" 
                                stroke={percentage >= 70 ? "#10b981" : "#f59e0b"} 
                                strokeWidth="10" 
                                fill="none" 
                                strokeDasharray={351.86}
                                initial={{ strokeDashoffset: 351.86 }}
                                animate={{ strokeDashoffset: 351.86 * (1 - percentage / 100) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                        >
                            {percentage}%
                        </motion.span>
                    </div>
                    
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
                    >
                        {percentage >= 90 ? '🎉 Outstanding!' : 
                         percentage >= 70 ? '✨ Excellent Job!' : 
                         percentage >= 50 ? '👍 Good Effort!' : 
                         '💪 Keep Practicing!'}
                    </motion.h1>
                    
                    <p className="text-gray-600 mb-6 text-lg">
                        You completed <strong className="text-gray-900">{exam.exam_name}</strong>
                    </p>
                    
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full mb-8">
                        <Award className="text-blue-600" size={24} />
                        <div className="text-left">
                            <p className="text-xs text-gray-600">Official Score</p>
                            <p className="text-xl font-bold text-gray-900">
                                {scoreToDisplay} / {totalPossible}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                            <Target className="text-blue-600 mx-auto mb-2" size={24} />
                            <p className="text-2xl font-bold text-gray-900">{correctAnswers}</p>
                            <p className="text-xs text-gray-600">Correct</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                            <XCircle className="text-purple-600 mx-auto mb-2" size={24} />
                            <p className="text-2xl font-bold text-gray-900">{exam.questions.length - correctAnswers}</p>
                            <p className="text-xs text-gray-600">Incorrect</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                            <TrendingUp className="text-green-600 mx-auto mb-2" size={24} />
                            <p className="text-2xl font-bold text-gray-900">{averageScore ?? '-'}</p>
                            <p className="text-xs text-gray-600">Class Avg</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleHome}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Home size={18} /> Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/exams')}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                            View All Exams
                        </button>
                    </div>
                </motion.div>

                {/* Question Review */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CheckCircle className="text-blue-600" size={24} />
                        Answer Review
                    </h3>
                    
                    <div className="space-y-4">
                        {exam.questions.map((q, idx) => {
                            const selected = answers[q.id];
                            const correct = q.options.find(o => o.is_correct);
                            const isCorrect = selected === correct?.id;
                            const selectedOption = q.options.find(o => o.id === selected);
                            
                            return (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.05 }}
                                    className={`p-5 rounded-xl border-2 transition-all ${
                                        isCorrect 
                                            ? 'border-green-200 bg-green-50/50' 
                                            : 'border-red-200 bg-red-50/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                            isCorrect ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {isCorrect ? (
                                                <CheckCircle className="text-green-600" size={20} />
                                            ) : (
                                                <XCircle className="text-red-600" size={20} />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <p className="text-gray-900 font-semibold mb-3">
                                                <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                                {q.question_text}
                                            </p>
                                            
                                            {!isCorrect && selectedOption && (
                                                <div className="mb-2 p-3 bg-red-100 rounded-lg">
                                                    <p className="text-xs text-red-600 font-semibold mb-1">Your Answer:</p>
                                                    <p className="text-sm text-red-900">{selectedOption.option_text}</p>
                                                </div>
                                            )}
                                            
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <p className="text-xs text-green-600 font-semibold mb-1">Correct Answer:</p>
                                                <p className="text-sm text-green-900">{correct?.option_text}</p>
                                            </div>
                                            
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded">
                                                    {isCorrect ? `+${q.marks}` : '0'} marks
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
