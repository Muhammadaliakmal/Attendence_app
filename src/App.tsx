import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import supabase from "./configdb/supabase";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./pages/Dashboard";
import ExamListPage from "./pages/ExamListPage";
import { QuizEngine } from "./components/exam/QuizEngine";
import { ResultSummary } from "./components/exam/ResultSummary";
import AddExamPage from "./pages/AddExamPage";
import ExamReportsPage from "./pages/ExamReportsPage";


export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!session ? <Login /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/signup" 
        element={!session ? <Signup /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/" 
        element={session ? <Dashboard /> : <Navigate to="/login" state={{ from: location }} replace />} 
      />
      
      {/* Exam Routes */}
      <Route path="/exams" element={<ExamListPage />} />
      <Route path="/exams/new" element={<AddExamPage />} />
      <Route path="/exams/reports/:id" element={<ExamReportsPage />} />
      <Route path="/exams/take/:id" element={<QuizEngine />} />
      <Route path="/exams/results/:id" element={<ResultSummary />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
