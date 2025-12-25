import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../configdb/supabase';

const { Title, Text } = Typography;

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (values: any) => {
    setLoading(true);
    const { email, password } = values;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      message.error(error.message);
    } else {
      message.success('Registration successful! Please sign in.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card bordered={false} className="shadow-float w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-emerald-200 shadow-lg mx-auto mb-4">
             <UserAddOutlined className="text-xl" />
          </div>
          <Title level={2} style={{ marginTop: 0 }}>Create Account</Title>
          <Text type="secondary">Join us to manage attendance efficiently</Text>
        </div>

        <Form
          name="signup"
          onFinish={handleSignup}
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
            rules={[{ required: true, message: 'Please input your Password!' }, { min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="bg-emerald-600 hover:bg-emerald-500">
              Sign Up
            </Button>
          </Form.Item>
          
           <div className="text-center">
             <Text type="secondary">Already have an account? <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">Log in</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
