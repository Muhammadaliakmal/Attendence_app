import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import supabase from '../../configdb/supabase';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);

  interface LoginValues {
    email: string;
    password: string;
  }

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    const { email, password } = values;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      message.error(error.message);
    } else {
      message.success('Welcome back!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-3xl p-8 shadow-premium">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl gradient-premium flex items-center justify-center text-white shadow-glow mx-auto mb-4"
            >
              <LogIn size={32} />
            </motion.div>
            <Title level={2} className="!mb-2 !text-slate-800">
              Welcome Back
            </Title>
            <Text className="text-slate-600 flex items-center justify-center gap-1">
              <Sparkles size={14} className="text-indigo-500" />
              Sign in to continue your journey
            </Text>
          </div>

          {/* Form */}
          <Form
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            className="space-y-2"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<Mail size={18} className="text-slate-400" />}
                placeholder="you@example.com"
                className="!h-12"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<Lock size={18} className="text-slate-400" />}
                placeholder="••••••••"
                className="!h-12"
              />
            </Form.Item>

            <Form.Item className="!mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="!h-12 !text-base !font-semibold !mt-2"
                icon={!loading && <LogIn size={18} />}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-200/60">
            <Text className="text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
              >
                Create one
              </Link>
            </Text>
          </div>
        </div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-slate-500 text-sm"
        >
          Secure authentication powered by Supabase
        </motion.p>
      </motion.div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
