import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Tag, Card } from 'antd';
import { ArrowLeft, Download, Trophy, Users, Clock, TrendingUp, Award, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '../configdb/supabase';
import { useExamStore } from '../store/examStore';
import dayjs from 'dayjs';

interface ResultRow {
    key: string;
    student_name: string;
    roll_num: string;
    score: number;
    submitted_at: string;
    status: string;
    total_marks: number;
}

const ExamReportsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { exams, fetchExams } = useExamStore();
    const [results, setResults] = useState<ResultRow[]>([]);
    const [loading, setLoading] = useState(true);

    const examId = Number(id);
    const exam = exams.find(e => e.id === examId);

    useEffect(() => {
        if (!exam) fetchExams();
    }, [exam, fetchExams]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!examId) return;
            setLoading(true);

            const { data, error } = await supabase
                .from('student_exam')
                .select(`
                    *,
                    student:studentsTable (
                        name,
                        roll_num
                    ),
                    exam:exams (
                        total_marks
                    )
                `)
                .eq('exam_id', examId)
                .order('total_score', { ascending: false });

            if (error) {
                console.error("Error fetching report:", error);
            } else if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rows = data.map((item: any) => ({
                    key: item.id,
                    student_name: item.student?.name || 'Unknown',
                    roll_num: item.student?.roll_num || 'N/A',
                    score: item.total_score,
                    status: item.status,
                    submitted_at: item.submitted_at || item.created_at,
                    total_marks: item.exam?.total_marks || 0
                }));
                setResults(rows);
            }
            setLoading(false);
        };

        fetchResults();
    }, [examId]);

    const columns = [
        {
            title: 'Rank',
            key: 'rank',
            width: 80,
            render: (_: unknown, __: unknown, index: number) => (
                <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="text-amber-500" size={18} />}
                    {index === 1 && <Award className="text-gray-400" size={18} />}
                    {index === 2 && <Award className="text-orange-400" size={18} />}
                    <span className="font-bold text-gray-900">#{index + 1}</span>
                </div>
            )
        },
        {
            title: 'Student Name',
            dataIndex: 'student_name',
            key: 'student_name',
            render: (text: string) => <span className="font-semibold text-gray-900">{text}</span>
        },
        {
            title: 'Roll Number',
            dataIndex: 'roll_num',
            key: 'roll_num',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            render: (score: number, record: ResultRow) => {
                const percentage = Math.round((score / (record.total_marks || 1)) * 100);
                let color = 'red';
                let bgColor = 'bg-red-50';
                if (percentage >= 80) { color = 'green'; bgColor = 'bg-green-50'; }
                else if (percentage >= 60) { color = 'blue'; bgColor = 'bg-blue-50'; }
                else if (percentage >= 40) { color = 'orange'; bgColor = 'bg-orange-50'; }

                return (
                    <div className="flex flex-col">
                        <span className={`font-bold text-${color}-600`}>{score} / {record.total_marks}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor} text-${color}-700 font-semibold inline-block w-fit`}>
                            {percentage}%
                        </span>
                    </div>
                );
            },
            sorter: (a: ResultRow, b: ResultRow) => a.score - b.score,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'submitted' ? 'success' : 'processing'} className="font-semibold">
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Submitted At',
            dataIndex: 'submitted_at',
            key: 'submitted_at',
            render: (date: string) => (
                <span className="text-gray-600 text-sm">
                    {date ? dayjs(date).format('MMM D, YYYY h:mm A') : '-'}
                </span>
            )
        }
    ];

    const exportCSV = () => {
        const headers = ['Rank', 'Student Name', 'Roll Number', 'Score', 'Status', 'Submitted At'];
        const csvContent = [
            headers.join(','),
            ...results.map((r, idx) => [
                idx + 1,
                r.student_name, 
                r.roll_num, 
                `${r.score}/${r.total_marks}`, 
                r.status, 
                r.submitted_at
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${exam?.exam_name || 'exam'}_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const avgScore = results.length > 0 
        ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
        : 0;
    
    const highestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const passRate = results.length > 0
        ? Math.round((results.filter(r => (r.score / r.total_marks) >= 0.5).length / results.length) * 100)
        : 0;

    if (!exam && !loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-12 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
                    <p className="text-gray-600">Exam not found</p>
                    <button onClick={() => navigate('/exams')} className="mt-4 text-blue-600 underline">
                        Return to Exams
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button 
                        onClick={() => navigate('/exams')} 
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors font-medium"
                    >
                        <ArrowLeft size={20} /> Back to Exams
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {exam?.exam_name} Report
                            </h1>
                            <p className="text-gray-600">
                                Analytics and student performance overview
                            </p>
                        </div>
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Attendees</p>
                                    <p className="text-3xl font-bold text-gray-900">{results.length}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                                    <Trophy size={28} />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Average Score</p>
                                    <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-orange-50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-lg">
                                    <Target size={28} />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Highest Score</p>
                                    <p className="text-3xl font-bold text-gray-900">{highestScore}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg">
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Pass Rate</p>
                                    <p className="text-3xl font-bold text-gray-900">{passRate}%</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Results Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-0 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="text-blue-600" size={24} />
                            Student Performance
                        </h3>
                        <Table 
                            columns={columns} 
                            dataSource={results} 
                            loading={loading}
                            pagination={{ pageSize: 10, showSizeChanger: true }}
                            className="premium-table"
                        />
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ExamReportsPage;
