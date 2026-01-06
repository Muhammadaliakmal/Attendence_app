import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
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
      // Navigate is handled by App.tsx state change
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card bordered={false} className="shadow-float w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg mx-auto mb-4">
             <LoginOutlined className="text-xl" />
          </div>
          <Title level={2} style={{ marginTop: 0 }}>Welcome Back</Title>
          <Text type="secondary">Please sign in to your account</Text>
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Invalid email!' }]}
          >
            <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="bg-indigo-600 hover:bg-indigo-500">
              Sign In
            </Button>
          </Form.Item>
          
          <div className="text-center">
             <Text type="secondary">Don't have an account? <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign up</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
