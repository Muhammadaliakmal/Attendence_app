import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, FileText, CheckCircle2, Circle } from 'lucide-react';
import { message, Input, InputNumber, Button } from 'antd';
import supabase from '../configdb/supabase';

// Local types for form state (no IDs yet)
interface FormOption {
    option_text: string;
    is_correct: boolean;
}

interface FormQuestion {
    question_text: string;
    marks: number;
    options: FormOption[];
}

const AddExamPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Exam Level State
    const [examName, setExamName] = useState('');
    const [durationMins, setDurationMins] = useState<number>(30);
    const [totalMarks, setTotalMarks] = useState<number>(0); // Calculated or manual? usually calculated sum of questions

    // Questions State
    const [questions, setQuestions] = useState<FormQuestion[]>([
        {
            question_text: '',
            marks: 5,
            options: [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false }
            ]
        }
    ]);

    // Helpers
    const calculateTotalMarks = (qs: FormQuestion[]) => {
        return qs.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    };

    const handleQuestionChange = (index: number, field: keyof FormQuestion, value: string | number | null) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
        setTotalMarks(calculateTotalMarks(newQuestions));
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex].option_text = value;
        setQuestions(newQuestions);
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        // Reset all in this question
        newQuestions[qIndex].options.forEach(o => o.is_correct = false);
        // Set selected
        newQuestions[qIndex].options[oIndex].is_correct = true;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_text: '',
                marks: 5,
                options: [
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false }
                ]
            }
        ]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) {
            message.warning("At least one question is required.");
            return;
        }
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
        setTotalMarks(calculateTotalMarks(newQuestions));
    };

    const validateForm = () => {
        if (!examName.trim()) {
            message.error("Please enter an exam name.");
            return false;
        }
        if (questions.some(q => !q.question_text.trim())) {
            message.error("All questions must have text.");
            return false;
        }
        if (questions.some(q => q.options.some(o => !o.option_text.trim()))) {
            message.error("All options must have text.");
            return false;
        }
        if (questions.some(q => !q.options.some(o => o.is_correct))) {
            message.error("Each question must have one correct answer.");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // 1. Create Exam
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .insert({
                    "exam name": examName,
                    "exam duration": durationMins * 60, // Convert to seconds
                    "total marks": totalMarks,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (examError || !examData) throw examError || new Error("Failed to create exam");

            const examId = examData.id;

            // 2. Process Questions sequantially (or parallel if careful)
            for (const q of questions) {
                const { data: qData, error: qError } = await supabase
                    .from('questions table')
                    .insert({
                        exam_id: examId,
                        question_text: q.question_text,
                        marks: q.marks,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (qError || !qData) throw qError || new Error("Failed to create question");

                const qId = qData.id;

                // 3. Insert Options
                const optionsPayload = q.options.map(o => ({
                    question_id: qId,
                    option_text: o.option_text,
                    is_correct: o.is_correct
                }));

                const { error: oError } = await supabase
                    .from('Options')
                    .insert(optionsPayload);

                if (oError) throw oError;
            }

            message.success("Exam created successfully!");
            navigate('/exams');

        } catch (error: unknown) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "Unknown error";
            message.error("Error saving exam: " + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate('/exams')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
                    <div className="w-20"></div> {/* Spacer for center alignment visual balance */}
                </div>

                {/* Main Form */}
                <div className="space-y-8">
                    
                    {/* Exam Details Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Exam Details</h2>
                                <p className="text-sm text-gray-500">Basic information about the assessment.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                                <Input 
                                    size="large" 
                                    placeholder="e.g. Final Mathematics Assessment" 
                                    value={examName}
                                    onChange={e => setExamName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (mins)</label>
                                    <InputNumber 
                                        size="large" 
                                        min={1} 
                                        className="w-full" 
                                        value={durationMins}
                                        onChange={v => setDurationMins(Number(v))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                                    <Input 
                                        size="large" 
                                        value={totalMarks} 
                                        disabled 
                                        className="bg-gray-50 text-gray-500" 
                                        suffix="pts"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => removeQuestion(qIndex)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove Question"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                                        {qIndex + 1}
                                    </span>
                                    <Input 
                                        placeholder="Enter your question text here..." 
                                        variant="borderless"
                                        className="text-lg font-medium placeholder:text-gray-300 !px-0"
                                        value={q.question_text}
                                        onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                                    />
                                    <div className="min-w-[100px]">
                                        <InputNumber 
                                            addonBefore="Pts"
                                            value={q.marks}
                                            min={1}
                                            onChange={v => handleQuestionChange(qIndex, 'marks', v)}
                                        />
                                    </div>
                                </div>

                                <div className="pl-11 space-y-3">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setCorrectOption(qIndex, oIndex)}
                                                className={`flex-shrink-0 transition-colors ${opt.is_correct ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                                            >
                                                {opt.is_correct ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                            </button>
                                            <Input 
                                                placeholder={`Option ${oIndex + 1}`} 
                                                value={opt.option_text}
                                                className={`flex-1 ${opt.is_correct ? 'border-green-500 ring-1 ring-green-100' : ''}`}
                                                onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 pb-20">
                        <Button 
                            type="dashed" 
                            icon={<Plus size={18} />} 
                            size="large" 
                            onClick={addQuestion}
                            className="w-full md:w-auto"
                        >
                            Add Question
                        </Button>

                        <Button 
                            type="primary" 
                            icon={<Save size={18} />} 
                            size="large" 
                            onClick={handleSave}
                            loading={loading}
                            className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 h-10 px-8"
                        >
                            Publish Exam
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddExamPage;
