import React, { useEffect, useState } from 'react';
import { useExamStore } from '../store/examStore';
import { ExamListCard } from '../components/exam/ExamListCard';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from 'antd';

const ExamListPage: React.FC = () => {
    const { exams, fetchExams, loading, error } = useExamStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active'>('all');

    useEffect(() => {
        fetchExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.exam_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-32 bg-white/50 rounded-2xl"></div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 bg-white/50 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-12 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
                    <p className="text-red-600 font-semibold">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center shadow-md transition-all hover:shadow-lg border border-gray-200"
                                    title="Back to Dashboard"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                                        <path d="m12 19-7-7 7-7"/>
                                        <path d="M19 12H5"/>
                                    </svg>
                                </button>
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <BookOpen className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        Available Exams
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'} available
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => navigate('/exams/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus size={20} />
                            Create New Exam
                        </button>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <Input
                                    placeholder="Search exams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-12 rounded-xl border-gray-200"
                                    size="large"
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Filter className="text-gray-400" size={20} />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active')}
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <option value="all">All Exams</option>
                                    <option value="active">Active Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Exams Grid */}
                {filteredExams.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-12 text-center shadow-lg"
                    >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="text-gray-400" size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ? 'Try adjusting your search' : 'Create your first exam to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/exams/new')}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                Create Exam
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ExamListCard exam={exam} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamListPage;
