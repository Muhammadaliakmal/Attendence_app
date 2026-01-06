export type ExamStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

export interface Option {
    id: number; // DB uses int8
    question_id: number;
    option_text: string;
    is_correct?: boolean;
}

export interface Question {
    id: number;
    exam_id: number;
    question_text: string;
    marks: number;
    options: Option[];
}

export interface Exam {
    id: number;
    exam_name: string; // Mapped from title
    exam_duration: number; // Mapped from duration_seconds
    total_marks: number;
    questions?: Question[]; // Optional as it might be fetched continuously or separately
}

export interface StudentExam {
    id: number;
    student_id: number;
    exam_id: number;
    status: ExamStatus;
    total_score: number;
    started_at?: string;
    submitted_at?: string;
}

export interface StudentAnswer {
    id: number;
    student_exam_id: number;
    question_id: number;
    selected_option_id: number;
    marks_obtained: number;
}
