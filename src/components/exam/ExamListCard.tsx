import React from 'react';
import { Clock, ChevronRight, Trash2, FileBarChart } from 'lucide-react';
import type { Exam } from '../../lib/types';
import { useExamStore } from '../../store/examStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

interface ExamListCardProps {
  exam: Exam;
}

export const ExamListCard: React.FC<ExamListCardProps> = ({ exam }) => {
  const navigate = useNavigate();
  const { startExam, deleteExam } = useExamStore();

  const handleStart = async () => {
    await startExam(exam.id);
    navigate(`/exams/take/${exam.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this exam? This cannot be undone.')) {
        await deleteExam(exam.id);
        message.success('Exam deleted');
    }
  };

  const handleReports = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/exams/reports/${exam.id}`);
  }

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
       {/* Actions */}
       <div className="absolute top-4 right-4 flex gap-2">
            <button 
                onClick={handleReports}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Results"
            >
                <FileBarChart size={18} />
            </button>
            <button 
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Exam"
            >
                <Trash2 size={18} />
            </button>
       </div>

      <div className="flex justify-between items-start mb-4 pr-16">
        <div>
           <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Active Exam
           </div>
           <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{exam.exam_name}</h3>
           <p className="text-gray-500 text-sm mt-1">Total Marks: {exam.total_marks}</p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2 absolute top-16 right-6">
           {/* Placeholder for spacing if needed */}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
             <Clock size={16} />
             {Math.floor(exam.exam_duration / 60)} mins
        </div>
        <button 
          onClick={handleStart}
          className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors group"
        >
          Start Quiz
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
