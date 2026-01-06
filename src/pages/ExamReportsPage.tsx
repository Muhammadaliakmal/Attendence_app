import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Tag, Card, Button } from 'antd';
import { ArrowLeft, Download, Trophy, Users, Clock } from 'lucide-react';
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

            // Fetch student_exam joined with studentsTable
            // Note: Supabase join syntax with alias
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
            title: 'Student Name',
            dataIndex: 'student_name',
            key: 'student_name',
            render: (text: string) => <span className="font-medium text-gray-900">{text}</span>
        },
        {
            title: 'Roll Number',
            dataIndex: 'roll_num',
            key: 'roll_num',
            render: (text: string) => <Tag>{text}</Tag>
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            render: (score: number, record: ResultRow) => {
                const percentage = Math.round((score / (record.total_marks || 1)) * 100);
                let color = 'red';
                if (percentage >= 80) color = 'green';
                else if (percentage >= 60) color = 'blue';
                else if (percentage >= 40) color = 'orange';

                return (
                    <div className="flex flex-col">
                        <span className={`font-bold text-${color}-600`}>{score} / {record.total_marks}</span>
                        <span className="text-xs text-gray-400">{percentage}%</span>
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
                <Tag color={status === 'completed' ? 'success' : 'processing'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Submitted At',
            dataIndex: 'submitted_at',
            key: 'submitted_at',
            render: (date: string) => (
                <span className="text-gray-500 text-sm">
                    {date ? dayjs(date).format('MMM D, YYYY h:mm A') : '-'}
                </span>
            )
        }
    ];

    if (!exam && !loading) return <div>Exam not found</div>;

    const exportCSV = () => {
         const headers = ['Student Name', 'Roll Number', 'Score', 'Status', 'Submitted At'];
         const csvContent = [
             headers.join(','),
             ...results.map(r => [
                 r.student_name, 
                 r.roll_num, 
                 r.score, 
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

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/exams')} 
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Exams
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{exam?.exam_name} Report</h1>
                        <p className="text-gray-500 mt-1">
                            Analyics and attendee results
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button icon={<Download size={16} />} onClick={exportCSV}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card bordered={false} className="shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Total Attendees</p>
                                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card bordered={false} className="shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Average Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {results.length > 0 
                                        ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card bordered={false} className="shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Exam Duration</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.floor((exam?.exam_duration || 0)/60)} min</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Results Table */}
                <Card bordered={false} className="shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Attendee List</h3>
                    <Table 
                        columns={columns} 
                        dataSource={results} 
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default ExamReportsPage;
