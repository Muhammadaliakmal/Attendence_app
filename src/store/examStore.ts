import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exam, ExamStatus } from '../lib/types';
import supabase from '../configdb/supabase';

interface ExamState {
    exams: Exam[];
    activeExamId: number | null;
    studentExamId: number | null; // Added to track database record
    examStatus: ExamStatus;
    answers: Record<number, number>; // questionId -> optionId
    timer: number;
    loading: boolean;
    error: string | null;

    // Actions
    fetchExams: () => Promise<void>;
    loadExamData: (examId: number) => Promise<void>;
    startExam: (examId: number) => Promise<void>;
    submitAnswer: (questionId: number, optionId: number) => void;
    submitExam: () => Promise<void>;
    deleteExam: (examId: number) => Promise<void>;
    resetExam: () => void;
    tickTimer: () => void;

    // Getters
    getScore: () => number;
}

export const useExamStore = create<ExamState>()(
    persist(
        (set, get) => ({
            exams: [],
            activeExamId: null,
            studentExamId: null,
            examStatus: 'not_started',
            answers: {},
            timer: 0,
            loading: false,
            error: null,

            fetchExams: async () => {
                set({ loading: true, error: null });
                const { data, error } = await supabase
                    .from('exams')
                    .select('id, created_at, exam_name:"exam name", exam_duration:"exam duration", total_marks:"total marks"');

                if (error) {
                    set({ error: error.message, loading: false });
                } else if (data) {
                    set({ exams: data, loading: false });
                }
            },

            loadExamData: async (examId) => {
                set({ loading: true, error: null });
                const { data: examData, error: examError } = await supabase
                    .from('exams')
                    .select(`
                        id, created_at, exam_name:"exam name", exam_duration:"exam duration", total_marks:"total marks",
                        questions:"questions table" (
                            *,
                            options:Options (*)
                        )
                    `)
                    .eq('id', examId)
                    .single();

                if (examError || !examData) {
                    set({ error: examError?.message || 'Exam not found', loading: false });
                    return;
                }

                set((state) => {
                    const exists = state.exams.some(e => e.id === examId);
                    const newExams = exists
                        ? state.exams.map(e => e.id === examId ? examData : e)
                        : [...state.exams, examData];

                    return { exams: newExams, loading: false };
                });
            },

            startExam: async (examId) => {
                set({ loading: true, error: null });

                // 1. Fetch full exam details
                const { data: examData, error: examError } = await supabase
                    .from('exams')
                    .select(`
                        id, created_at, exam_name:"exam name", exam_duration:"exam duration", total_marks:"total marks",
                        questions:"questions table" (
                            *,
                            options:Options (*)
                        )
                    `)
                    .eq('id', examId)
                    .single();

                if (examError || !examData) {
                    set({ error: examError?.message || 'Exam not found', loading: false });
                    return;
                }

                // 2. Get User Session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    set({ error: 'User not authenticated', loading: false });
                    return;
                }

                // 3. Get or Create Student Record (int8) from studentsTable
                // Since Auth ID is UUID, we need to map it to our integer-based student table
                let studentDbId: number | null = null;
                const userEmail = session.user.email;
                const userName = userEmail?.split('@')[0] || 'Unknown';

                try {
                    // Try to find by name (assuming name ~ email user for now)
                    const { data: existingStudent } = await supabase
                        .from('studentsTable')
                        .select('id')
                        .eq('name', userName) // Weak link, but necessary without auth_id in studentsTable
                        .limit(1)
                        .single();

                    if (existingStudent) {
                        studentDbId = existingStudent.id;
                    } else {
                        // Create new student
                        const { data: newStudent, error: createStudentError } = await supabase
                            .from('studentsTable')
                            .insert({
                                name: userName,
                                roll_num: 'TEMP-' + Math.floor(Math.random() * 10000),
                                status: 'Active'
                            })
                            .select()
                            .single();

                        if (createStudentError) throw createStudentError;
                        studentDbId = newStudent.id;
                    }

                    if (!studentDbId) throw new Error("Failed to resolve student ID");

                    // 4. Create Student Exam Record
                    const { data: studentExam, error: createError } = await supabase
                        .from('student_exam')
                        .insert({
                            student_id: studentDbId,
                            exam_id: examId,
                            status: 'in_progress',
                            started_at: new Date().toISOString(),
                            total_score: 0
                        })
                        .select()
                        .single();

                    if (createError) throw createError;

                    set((state) => {
                        const exists = state.exams.some(e => e.id === examId);
                        const newExams = exists
                            ? state.exams.map(e => e.id === examId ? examData : e)
                            : [...state.exams, examData];

                        return {
                            exams: newExams,
                            activeExamId: examId,
                            studentExamId: studentExam.id,
                            examStatus: 'in_progress',
                            timer: examData.exam_duration,
                            answers: {},
                            loading: false
                        };
                    });

                } catch (err: unknown) {
                    console.error('Failed to start exam:', err);
                    const msg = err instanceof Error ? err.message : String(err);
                    set({ error: 'Failed to start exam session: ' + msg, loading: false });
                }
            },



            submitAnswer: (questionId, optionId) => {
                set((state) => ({
                    answers: { ...state.answers, [questionId]: optionId }
                }));
            },

            tickTimer: () => {
                const { timer, submitExam, examStatus } = get();
                if (examStatus !== 'in_progress') return;

                if (timer <= 0) {
                    submitExam();
                } else {
                    set({ timer: timer - 1 });
                }
            },

            submitExam: async () => {
                const { activeExamId, studentExamId, answers, exams } = get();
                if (!activeExamId) return;

                set({ loading: true });

                const exam = exams.find(e => e.id === activeExamId);
                if (!exam || !exam.questions) {
                    set({ loading: false, examStatus: 'submitted' });
                    return;
                }

                // Calculate Score Locally
                let totalScore = 0;
                const studentAnswersPayload: {
                    student_exam_id: number;
                    question_id: number;
                    selected_option_id: number;
                    marks_obtained: number;
                }[] = [];

                exam.questions.forEach(q => {
                    const selectedOptId = answers[q.id];
                    const correctOpt = q.options.find(o => o.is_correct);
                    const isCorrect = correctOpt && correctOpt.id === selectedOptId;

                    if (isCorrect) {
                        totalScore += q.marks;
                    }

                    if (selectedOptId && studentExamId) {
                        studentAnswersPayload.push({
                            student_exam_id: studentExamId,
                            question_id: q.id,
                            selected_option_id: selectedOptId,
                            marks_obtained: isCorrect ? q.marks : 0
                        });
                    }
                });

                // Submit to Backend
                if (studentExamId) {
                    try {
                        // 1. Save Answers
                        if (studentAnswersPayload.length > 0) {
                            const { error: ansError } = await supabase
                                .from('student_answers')
                                .insert(studentAnswersPayload);

                            if (ansError) throw ansError;
                        }

                        // 2. Update Exam Status
                        const { error: updateError } = await supabase
                            .from('student_exam')
                            .update({
                                status: 'completed',
                                submitted_at: new Date().toISOString(),
                                total_score: totalScore
                            })
                            .eq('id', studentExamId);

                        if (updateError) throw updateError;

                    } catch (err: unknown) {
                        console.error('Failed to submit exam:', err);
                        // We still set submitted locally so user doesn't get stuck
                        const msg = err instanceof Error ? err.message : String(err);
                        set({ error: 'Failed to save results: ' + msg });
                    }
                }

                set({ examStatus: 'submitted', loading: false });
            },

            deleteExam: async (examId) => {
                set({ loading: true });
                const { error } = await supabase
                    .from('exams')
                    .delete()
                    .eq('id', examId);

                if (error) {
                    set({ error: error.message, loading: false });
                } else {
                    set((state) => ({
                        exams: state.exams.filter(e => e.id !== examId),
                        loading: false
                    }));
                }
            },

            resetExam: () => {
                set({
                    activeExamId: null,
                    studentExamId: null,
                    examStatus: 'not_started',
                    answers: {},
                    timer: 0,
                    error: null
                });
            },

            getScore: () => {
                const { activeExamId, exams, answers } = get();
                if (!activeExamId) return 0;

                const exam = exams.find(e => e.id === activeExamId);
                if (!exam || !exam.questions) return 0;

                let score = 0;
                let totalPossible = 0;

                exam.questions.forEach(q => {
                    totalPossible += q.marks;
                    const selected = answers[q.id];
                    const correct = q.options.find(o => o.is_correct)?.id;
                    if (selected === correct) score += q.marks;
                });

                return totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
            }
        }),
        {
            name: 'exam-storage',
            partialize: (state) => ({
                activeExamId: state.activeExamId,
                studentExamId: state.studentExamId,
                examStatus: state.examStatus,
                answers: state.answers,
                timer: state.timer
            }),
        }
    )
);
