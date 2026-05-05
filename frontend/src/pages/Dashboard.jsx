import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import Navigation from '../components/Navigation';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

const API = 'http://localhost:5000';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [timeData, setTimeData] = useState(null);
  const [teamTimeData, setTeamTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, [user]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '/api/dashboard/employee';
      if (user.role === 'manager' || user.role === 'team_lead') endpoint = '/api/dashboard/manager';
      else if (user.role === 'admin') endpoint = '/api/dashboard/admin';

      const [dashRes, timeRes] = await Promise.all([
        axios.get(`${API}${endpoint}`, { headers }),
        axios.get(`${API}/api/time-tracking/my-summary`, { headers })
      ]);

      setDashboardData(dashRes.data.data);
      setTimeData(timeRes.data.data);

      // Fetch team time for managers/team leads/admins
      if (user.role !== 'employee') {
        const teamRes = await axios.get(`${API}/api/time-tracking/team-summary`, { headers });
        setTeamTimeData(teamRes.data.data);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h2>Loading dashboard...</h2>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="card" style={{ backgroundColor: '#fee', padding: '20px' }}>
        <h3 style={{ color: '#c00' }}>Error</h3>
        <p>{error}</p>
        <button onClick={fetchAll} className="btn btn-primary">Retry</button>
      </div>
    </div>
  );

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Welcome back, <strong>{user?.name}</strong>! ({user?.role})
          </p>
        </div>
        {user.role === 'employee' && <EmployeeDashboard data={dashboardData} timeData={timeData} />}
        {(user.role === 'manager' || user.role === 'team_lead') && <ManagerDashboard data={dashboardData} timeData={timeData} teamTimeData={teamTimeData} />}
        {user.role === 'admin' && <AdminDashboard data={dashboardData} timeData={timeData} teamTimeData={teamTimeData} />}
      </div>
    </>
  );
};

// ─── Time Tracking Section (shared) ──────────────────────────────────────────
const TimeTrackingSection = ({ timeData, title = 'My Coding Time' }) => {
  if (!timeData) return null;
  const byTask = timeData.by_task || [];
  const totalHours = parseFloat(timeData.total_active_hours || 0);

  const chartData = {
    labels: byTask.slice(0, 8).map(t => t.task_title?.substring(0, 20) || 'Unknown'),
    datasets: [{
      label: 'Active Hours',
      data: byTask.slice(0, 8).map(t => parseFloat(t.total_active_hours || 0)),
      backgroundColor: 'rgba(52, 152, 219, 0.7)',
      borderColor: 'rgba(52, 152, 219, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid #3498db' }}>
      <h3 style={{ marginBottom: '20px' }}>⏱ {title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <StatCard title="Total Active Hours" value={`${totalHours.toFixed(1)}h`} color="#3498db" />
        <StatCard title="Total Sessions" value={timeData.total_sessions || 0} color="#9b59b6" />
        {byTask.length > 0 && (
          <StatCard title="Tasks Tracked" value={byTask.length} color="#2ecc71" />
        )}
      </div>

      {byTask.length > 0 && (
        <>
          <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Hours per Task</h4>
          <div style={{ height: '200px' }}>
            <Bar
              data={chartData}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: { x: { beginAtZero: true, title: { display: true, text: 'Hours' } } },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Task</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Active Hours</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {byTask.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px' }}>{t.task_title || 'Unknown'}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge badge-${t.task_status}`}>{t.task_status || '-'}</span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#3498db' }}>
                    {parseFloat(t.total_active_hours || 0).toFixed(2)}h
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{t.total_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {byTask.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          No time tracked yet. Start coding in VS Code to see your time here!
        </p>
      )}
    </div>
  );
};

// ─── Team Time Section (manager/admin) ───────────────────────────────────────
const TeamTimeSection = ({ teamTimeData }) => {
  if (!teamTimeData) return null;
  const byUser = teamTimeData.by_user || [];
  if (byUser.length === 0) return null;

  const chartData = {
    labels: byUser.map(u => u.user?.name || 'Unknown'),
    datasets: [{
      label: 'Active Hours',
      data: byUser.map(u => parseFloat(u.total_active_hours || 0)),
      backgroundColor: [
        'rgba(52,152,219,0.7)', 'rgba(46,204,113,0.7)', 'rgba(155,89,182,0.7)',
        'rgba(243,156,18,0.7)', 'rgba(231,76,60,0.7)', 'rgba(26,188,156,0.7)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid #2ecc71' }}>
      <h3 style={{ marginBottom: '20px' }}>⏱ Team Coding Time</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ height: '220px' }}>
          <Bar
            data={chartData}
            options={{
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } },
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Employee</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Active Hours</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Sessions</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Tasks Worked On</th>
          </tr>
        </thead>
        <tbody>
          {byUser.map((u, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.user?.name || 'Unknown'}</td>
              <td style={{ padding: '10px' }}>
                <span className={`badge badge-${u.user?.role}`}>{u.user?.role}</span>
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2ecc71' }}>
                {parseFloat(u.total_active_hours || 0).toFixed(2)}h
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{u.total_sessions}</td>
              <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {(u.tasks || []).map(t => `${t.task_title} (${parseFloat(t.active_hours || 0).toFixed(1)}h)`).join(', ') || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Employee Dashboard ───────────────────────────────────────────────────────
const EmployeeDashboard = ({ data, timeData }) => {
  // Backend returns: { stats, upcomingDeadlines, completionTrend, timeTracking, recentActivity }
  const stats = data.stats || {};
  const completionTrend = data.completionTrend || [];
  const upcomingDeadlines = data.upcomingDeadlines || [];
  const timeTracking = data.timeTracking || {};
  const recentActivity = data.recentActivity || [];

  // Task status chart
  const taskStatusData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    datasets: [{
      label: 'Tasks',
      data: [
        stats.pendingTasks || 0,
        stats.inProgressTasks || 0,
        stats.completedTasks || 0,
        stats.overdueTasks || 0
      ],
      backgroundColor: [
        'rgba(255, 206, 86, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)'
      ],
      borderColor: [
        'rgba(255, 206, 86, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Completion trend chart
  const trendData = {
    labels: completionTrend.map(t => format(new Date(t.date), 'MMM dd')),
    datasets: [{
      label: 'Tasks Completed',
      data: completionTrend.map(t => parseInt(t.count)),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }]
  };

  return (
    <>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Total Tasks" value={stats.totalTasks || 0} color="#3498db" />
        <StatCard title="Completed" value={stats.completedTasks || 0} color="#2ecc71" />
        <StatCard title="In Progress" value={stats.inProgressTasks || 0} color="#f39c12" />
        <StatCard title="Performance Score" value={`${stats.performanceScore || 0}%`} color="#9b59b6" />
      </div>

      {/* Time Tracking Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Hours This Week" value={timeTracking.hoursThisWeek || 0} color="#e67e22" />
        <StatCard title="Hours This Month" value={timeTracking.hoursThisMonth || 0} color="#16a085" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Task Status Distribution</h3>
          <div style={{ width: '260px', height: '260px', margin: '0 auto' }}>
            <Doughnut
              data={taskStatusData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>

        {completionTrend.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Completion Trend (Last 30 Days)</h3>
            <div style={{ height: '220px' }}>
              <Line data={trendData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Upcoming Deadlines (Next 7 Days)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{task.title}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{format(new Date(task.deadline), 'MMM dd, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Recent Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{task.title}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{format(new Date(task.updated_at), 'MMM dd, yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VS Code Time Tracking */}
      <TimeTrackingSection timeData={timeData} title="My VS Code Coding Time" />
    </>
  );
};

// ─── Manager Dashboard ────────────────────────────────────────────────────────
const ManagerDashboard = ({ data, timeData, teamTimeData }) => {
  // Backend returns: { summary, lateTasks, tasksNearingDeadline, employeePerformance, topPerformers, completionTrend, workloadDistribution }
  const summary = data.summary || {};
  const lateTasks = data.lateTasks || [];
  const tasksNearingDeadline = data.tasksNearingDeadline || [];
  const employeePerformance = data.employeePerformance || [];
  const topPerformers = data.topPerformers || [];
  const completionTrend = data.completionTrend || [];
  const workloadDistribution = data.workloadDistribution || [];

  // Top performers chart
  const topPerformersData = {
    labels: topPerformers.map(p => p.name),
    datasets: [{
      label: 'Performance Score',
      data: topPerformers.map(p => p.performanceScore),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  // Workload distribution chart
  const workloadData = {
    labels: workloadDistribution.map(w => w.name),
    datasets: [
      {
        label: 'Pending',
        data: workloadDistribution.map(w => w.pendingTasks),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
      {
        label: 'In Progress',
        data: workloadDistribution.map(w => w.inProgressTasks),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }
    ]
  };

  return (
    <>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Total Tasks" value={summary.totalTasks || 0} color="#3498db" />
        <StatCard title="Completed Tasks" value={summary.completedTasks || 0} color="#2ecc71" />
        <StatCard title="Pending Tasks" value={summary.pendingTasks || 0} color="#f39c12" />
        <StatCard title="Late Tasks" value={summary.lateTasksCount || 0} color="#e74c3c" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {topPerformers.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Top Performers</h3>
            <div style={{ height: '220px' }}>
              <Bar
                data={topPerformersData}
                options={{
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 } }
                }}
              />
            </div>
          </div>
        )}

        {workloadDistribution.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Workload Distribution</h3>
            <div style={{ height: '220px' }}>
              <Bar
                data={workloadData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, stacked: true },
                    x: { stacked: true }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Late Tasks */}
      {lateTasks.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid #e74c3c' }}>
          <h3 style={{ marginBottom: '20px', color: '#e74c3c' }}>⚠️ Late Tasks</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Assigned To</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Deadline</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lateTasks.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{task.title}</td>
                    <td style={{ padding: '12px' }}>
                      {task.assignedUsers?.map(u => u.name).join(', ') || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px', color: '#e74c3c' }}>
                      {format(new Date(task.deadline), 'MMM dd, yyyy')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tasks Nearing Deadline */}
      {tasksNearingDeadline.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid #f39c12' }}>
          <h3 style={{ marginBottom: '20px', color: '#f39c12' }}>⏰ Tasks Nearing Deadline (Next 3 Days)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Assigned To</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Deadline</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasksNearingDeadline.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{task.title}</td>
                    <td style={{ padding: '12px' }}>
                      {task.assignedUsers?.map(u => u.name).join(', ') || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px' }}>{format(new Date(task.deadline), 'MMM dd, yyyy')}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Performance Table */}
      {employeePerformance.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Employee Performance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Tasks</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Completed</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{emp.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${emp.role}`}>{emp.role}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{emp.totalTasks || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{emp.completedTasks || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <strong style={{ color: emp.performanceScore >= 70 ? '#2ecc71' : '#e74c3c' }}>
                        {emp.performanceScore || 0}%
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Coding Time */}
      <TeamTimeSection teamTimeData={teamTimeData} />

      {/* My Own Coding Time */}
      <TimeTrackingSection timeData={timeData} title="My VS Code Coding Time" />
    </>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ data, timeData, teamTimeData }) => {
  // Backend returns: { summary, trends, topActiveUsers, systemHealth }
  const summary = data.summary || {};
  const usersByRole = summary.usersByRole || [];

  // Convert usersByRole array to object for easy access
  const roleCount = {};
  usersByRole.forEach(item => {
    roleCount[item.role] = parseInt(item.count);
  });

  return (
    <>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Total Users" value={summary.totalUsers || 0} color="#3498db" />
        <StatCard title="Active Users" value={summary.activeUsers || 0} color="#2ecc71" />
        <StatCard title="Total Tasks" value={summary.totalTasks || 0} color="#9b59b6" />
        <StatCard title="Completed Tasks" value={summary.completedTasks || 0} color="#f39c12" />
      </div>

      {/* User Distribution */}
      <div className="card" style={{ padding: '20px', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>User Distribution by Role</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Admins</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{roleCount.admin || 0}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Managers</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{roleCount.manager || 0}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Team Leads</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{roleCount.team_lead || 0}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Employees</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{roleCount.employee || 0}</div>
          </div>
        </div>
      </div>

      {/* Top Active Users */}
      {data.topActiveUsers && data.topActiveUsers.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Top Active Users</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Tasks</th>
                </tr>
              </thead>
              <tbody>
                {data.topActiveUsers.map((user, index) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{user.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{user.taskCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Coding Time */}
      <TeamTimeSection teamTimeData={teamTimeData} />
    </>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, color }) => (
  <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
      {title}
    </div>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>
      {value}
    </div>
  </div>
);

export default Dashboard;
