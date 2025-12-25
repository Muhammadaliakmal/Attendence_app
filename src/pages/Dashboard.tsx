import { useEffect, useState } from "react";
import supabase from "../configdb/supabase";
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Tabs,
  Avatar,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Empty
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  CalendarOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// --- Types ---
type Student = {
  id: number;
  name: string;
  roll_num: string;
  status: string;
  created_at: string;
};

type AttendanceRecord = {
  id: number;
  student_id: number;
  date: string;
  status: string;
};

export default function Dashboard() {
  // --- State Management ---
  const [students, setStudents] = useState<Student[]>([]);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  // Default to today
  const today = dayjs().format('YYYY-MM-DD');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rollInput, setRollInput] = useState("");
  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("studentsTable")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setStudents(data);
    if (error) message.error("Failed to load students");
    setLoading(false);
  };

  const fetchAttendance = async (date: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Attendence")
      .select("*")
      .eq("date", date);

    if (data) setAttendanceRecords(data);
    if (error) message.error("Failed to load attendance");
    setLoading(false);
  };

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
          navigate('/login');
      }
  };

  // --- Effects ---
  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance(today);
  }, []);

  // --- Handlers ---
  const handleSubmit = async (values: any) => {
    setLoading(true);
    let error;
    
    if (editingId) {
      const result = await supabase.from("studentsTable").update(values).eq("id", editingId);
      error = result.error;
      if (!error) {
        message.success("Student updated");
        setEditingId(null);
      }
    } else {
      const result = await supabase.from("studentsTable").insert([values]);
      error = result.error;
      if (!error) {
        message.success("Student added to database");
      }
    }

    if (error) message.error(error.message);
    else {
      form.resetFields();
      fetchStudents();
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("studentsTable").delete().eq("id", id);
    if (!error) {
      message.success("Student record deleted");
      fetchStudents();
    } else {
      message.error(error.message);
    }
    setLoading(false);
  };

  const markAttendance = async (studentId: number, status: string) => {
    // Optimistic update could go here, but keeping it simple as requested
    const { data: existing } = await supabase
      .from("Attendence")
      .select("id")
      .eq("student_id", studentId)
      .eq("date", today)
      .single();

    let error;
    if (existing) {
      const result = await supabase.from("Attendence").update({ status }).eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase.from("Attendence").insert([{ student_id: studentId, date: today, status }]);
      error = result.error;
    }

    if (!error) {
       // message.success(`Marked as ${status}`); // Too noisy
      fetchAttendance(today);
      return true;
    } else {
      message.error("Could not update attendance");
      return false;
    }
  };

  const handleRollSubmit = async () => {
    if (!rollInput.trim()) return;
    
    const student = students.find(s => s.roll_num.toLowerCase() === rollInput.trim().toLowerCase());
    
    if (student) {
      if (student.status !== 'active') {
        message.warning(`Student ${student.name} is inactive`);
        return;
      }
      
      const success = await markAttendance(student.id, 'present');
      if (success) {
        message.success(`Marked PRESENT: ${student.name}`);
        setRollInput("");
      }
    } else {
      message.error(`Roll number "${rollInput}" not found`);
    }
  };

  // --- Logic Helpers ---
  const getAttendanceStatus = (studentId: number) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record ? record.status : "pending";
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_num.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Columns Config ---
  const studentColumns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      render: (name: string, record: Student) => (
        <Space size="middle">
          <Avatar 
            style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: 600 }} 
            size="large"
          >
            {getInitials(name)}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700 text-[15px]">{name}</span>
            <span className="text-xs text-slate-400 font-mono">{record.roll_num}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => (
        <Tag 
          color={status === 'active' ? 'success' : 'default'} 
          style={{ borderRadius: 100, border: 'none', background: status === 'active' ? '#ecfdf5' : '#f3f4f6', color: status === 'active' ? '#059669' : '#6b7280' }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 150,
      align: 'right' as const,
      render: (_: any, record: Student) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-slate-400 hover:text-indigo-600" />} 
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <Popconfirm
            title="Delete student?"
            description="Allows you to remove this record permanently."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined className="opacity-60 hover:opacity-100" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const attendanceColumns = [
    {
      title: 'STUDENT',
      dataIndex: 'name',
      render: (name: string) => (
        <Space>
           <Avatar 
            style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} 
          >
            {getInitials(name)}
          </Avatar>
          <span className="font-medium text-slate-700">{name}</span>
        </Space>
      ),
    },
    {
      title: 'ATTENDANCE',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Student) => {
        const status = getAttendanceStatus(record.id);
        const isPresent = status === 'present';
        const isAbsent = status === 'absent';
        const isLate = status === 'late';

        return (
          <div className="flex justify-end gap-2">
            <Button
              className={`min-w-[40px] border-0 transition-all ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              icon={<CheckCircleFilled />}
              onClick={() => markAttendance(record.id, 'present')}
              shape="default"
            >
              <span className="hidden sm:inline">Present</span>
            </Button>
            
            <Button
              className={`min-w-[40px] border-0 transition-all ${isAbsent ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              icon={<CloseCircleFilled />}
              onClick={() => markAttendance(record.id, 'absent')}
              shape="default"
            >
               <span className="hidden sm:inline">Absent</span>
            </Button>

            <Button
              className={`min-w-[40px] border-0 transition-all ${isLate ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              icon={<ClockCircleFilled />}
              onClick={() => markAttendance(record.id, 'late')}
              shape="default"
            >
               <span className="hidden sm:inline">Late</span>
            </Button>
          </div>
        );
      },
    },
  ];

  // --- Render ---
  return (
    <Layout className="min-h-screen bg-slate-50/50">
      <Header className="bg-white sticky top-0 z-50 px-6 h-16 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <CheckSquareOutlined className="text-lg" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">Class<span className="text-indigo-600">Mate</span></span>
        </div>
        <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-500"
        >
            Logout
        </Button>
      </Header>

      <Content className="max-w-6xl mx-auto w-full p-6 sm:p-8">
        <Tabs
          defaultActiveKey="students"
          className="custom-tabs"
          items={[
            {
              key: 'students',
              label: (<span><TeamOutlined className="mr-1" /> Students</span>),
              children: (
                <div className="animate-fade-in space-y-8">
                  {/* Summary Cards */}
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Card bordered={false} className="shadow-soft hover:shadow-float transition-all duration-300">
                        <Statistic 
                          title={<span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Total Students</span>}
                          value={students.length}
                          valueStyle={{ fontWeight: 600, color: '#1e293b' }} 
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card bordered={false} className="shadow-soft hover:shadow-float transition-all duration-300">
                        <Statistic 
                          title={<span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Active</span>}
                          value={students.filter(s => s.status === 'active').length}
                          valueStyle={{ fontWeight: 600, color: '#059669' }} 
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                       <Card bordered={false} className="shadow-soft hover:shadow-float transition-all duration-300">
                        <Statistic 
                          title={<span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Inactive</span>}
                          value={students.filter(s => s.status !== 'active').length}
                          valueStyle={{ fontWeight: 600, color: '#94a3b8' }} 
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24">
                        <Card 
                          title={editingId ? "Edit Existing Student" : "Register New Student"} 
                          bordered={false} 
                          className="shadow-float"
                        >
                          <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{ status: 'active' }}
                            requiredMark={false}
                          >
                            <Form.Item
                              label="Full Name"
                              name="name"
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Input placeholder="e.g. John Doe" size="large" />
                            </Form.Item>

                            <Form.Item
                              label="Roll / ID Number"
                              name="roll_num"
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Input placeholder="e.g. 2024-001" size="large" />
                            </Form.Item>

                            <Form.Item label="Status" name="status">
                              <Select size="large">
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                              </Select>
                            </Form.Item>

                            <div className="flex gap-2 pt-2">
                              <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading} 
                                block 
                                size="large"
                                icon={<PlusOutlined />}
                              >
                                {editingId ? 'Save Changes' : 'Add Student'}
                              </Button>
                              {editingId && (
                                <Button 
                                  onClick={() => { setEditingId(null); form.resetFields(); }}
                                  size="large"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </Form>
                        </Card>
                      </div>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 space-y-4">
                      <Input 
                        prefix={<SearchOutlined className="text-slate-400" />} 
                        placeholder="Search students..." 
                        className="!bg-transparent !border-0 !border-b !border-slate-200 !rounded-none !shadow-none focus:!border-indigo-500 px-0" 
                        onChange={e => setSearchTerm(e.target.value)}
                        allowClear
                      />
                      
                      <div className="bg-white rounded-2xl shadow-subtle border border-slate-200 overflow-hidden">
                        <Table
                          columns={studentColumns}
                          dataSource={filteredStudents}
                          rowKey="id"
                          loading={loading}
                          pagination={{ pageSize: 8, hideOnSinglePage: true }}
                          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No students found" /> }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'attendance',
              label: (<span><CalendarOutlined className="mr-1" /> Attendance</span>),
              children: (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                  <Card bordered={false} className="shadow-soft bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <ClockCircleFilled style={{ fontSize: 20 }} />
                        </div>
                        <div>
                          <Text className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Today's Session</Text>
                          <Title level={4} style={{ margin: 0, color: '#334155' }}>
                            {dayjs().format('MMMM D, YYYY')}
                          </Title>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto min-w-[300px]">
                         <Input.Search
                            placeholder="Enter Roll Number..."
                            enterButton="Mark Present"
                            size="large"
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value)}
                            onSearch={handleRollSubmit}
                         />
                      </div>
                    </div>
                  </Card>

                  <div className="bg-white rounded-2xl shadow-float border border-slate-200/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <Title level={5} style={{ margin: 0, fontWeight: 600 }}>Attendance Sheet</Title>
                      <Tag className="m-0 bg-slate-100 text-slate-500 border-0">
                         {students.filter(s => s.status === 'active').length} Active Students
                      </Tag>
                    </div>
                    
                    <Table
                      columns={attendanceColumns}
                      dataSource={students.filter(s => s.status === 'active')}
                      rowKey="id"
                      loading={loading}
                      pagination={false}
                      rowClassName="hover:bg-slate-50 transition-colors"
                      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active students" /> }}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Content>
    </Layout>
  );
}
