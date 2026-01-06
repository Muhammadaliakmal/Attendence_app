import React from 'react';
import { Clock, ChevronRight, Trash2, FileBarChart, Trophy, Calendar } from 'lucide-react';
import type { Exam } from '../../lib/types';
import { useExamStore } from '../../store/examStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { motion } from 'framer-motion';

interface ExamListCardProps {
  exam: Exam;
}

export const ExamListCard: React.FC<ExamListCardProps> = ({ exam }) => {
  const navigate = useNavigate();
  const { startExam, deleteExam } = useExamStore();
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    const success = await startExam(exam.id);
    if (success) {
        navigate(`/exams/take/${exam.id}`);
    } else {
        message.error("Failed to start exam. Please try again.");
        setIsStarting(false);
    }
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
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-semibold mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Active Exam
            </div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {exam.exam_name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Trophy size={16} className="text-amber-500" />
                <span className="font-semibold">{exam.total_marks} marks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-500" />
                <span>{Math.floor(exam.exam_duration / 60)} mins</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReports}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Results"
            >
              <FileBarChart size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Exam"
            >
              <Trash2 size={20} />
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        {exam.questions && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Questions</span>
              <span className="font-bold text-gray-900">{exam.questions.length}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={14} />
            <span>Created recently</span>
          </div>
          
          <button 
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Exam
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
