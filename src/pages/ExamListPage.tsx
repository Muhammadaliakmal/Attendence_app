import React, { useEffect } from 'react';
import { useExamStore } from '../store/examStore';
import { ExamListCard } from '../components/exam/ExamListCard';

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const ExamListPage: React.FC = () => {
    const { exams, fetchExams, loading, error } = useExamStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading exams...</div>;
    if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Exams</h1>
                        <p className="text-gray-500">Select an exam to start your assessment.</p>
                    </div>
                    <button
                        onClick={() => navigate('/exams/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                    >
                        <Plus size={18} />
                        Create New Exam
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {exams.map(exam => (
                        <ExamListCard key={exam.id} exam={exam} />
                    ))}
                    {exams.length === 0 && <p>No exams available.</p>}
                </div>
            </div>
        </div>
    );
};

export default ExamListPage;
