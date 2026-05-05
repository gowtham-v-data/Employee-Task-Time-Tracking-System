import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import Navigation from '../components/Navigation';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(response.data.data);
      setEditData({
        title: response.data.data.title,
        description: response.data.data.description,
        deadline: response.data.data.deadline.split('T')[0],
        status: response.data.data.status
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch task:', err);
      setError(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/tasks/${id}/comments`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      fetchTaskDetail(); // Refresh to show new comment
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditMode(false);
      fetchTaskDetail();
    } catch (err) {
      console.error('Failed to update task:', err);
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTaskDetail();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Loading task details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="card" style={{ backgroundColor: '#fee', padding: '20px' }}>
          <h3 style={{ color: '#c00' }}>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/tasks')} className="btn btn-primary">
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const isCreator = task.created_by === user.id;
  const isAssigned = task.assignedUsers?.some(u => u.id === user.id);
  const canEdit = ['admin', 'manager'].includes(user.role) || (user.role === 'team_lead' && isCreator);
  const canDelete = ['admin', 'manager'].includes(user.role);
  const canUpdateStatus = isAssigned || canEdit;
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <button 
            onClick={() => navigate('/tasks')} 
            className="btn"
            style={{ backgroundColor: 'var(--bg-tertiary)', marginBottom: '15px' }}
          >
            ← Back to Tasks
          </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ marginBottom: '10px' }}>{task.title}</h1>
            <span className={`badge badge-${isOverdue ? 'overdue' : task.status}`}>
              {isOverdue ? 'Overdue' : task.status.replace('_', ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canEdit && !editMode && (
              <button onClick={() => setEditMode(true)} className="btn btn-primary">
                Edit Task
              </button>
            )}
            {canDelete && (
              <button onClick={handleDeleteTask} className="btn btn-danger">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Mode */}
      {editMode && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Edit Task</h3>
          <form onSubmit={handleUpdateTask}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Deadline</label>
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button 
                type="button" 
                onClick={() => setEditMode(false)} 
                className="btn"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Main Content */}
        <div>
          {/* Task Details */}
          <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{task.description}</p>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Deadline</div>
                  <div style={{ fontWeight: '500', marginTop: '5px' }}>
                    {format(new Date(task.deadline), 'MMMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Created</div>
                  <div style={{ fontWeight: '500', marginTop: '5px' }}>
                    {format(new Date(task.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                {task.completed_at && (
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Completed</div>
                    <div style={{ fontWeight: '500', marginTop: '5px' }}>
                      {format(new Date(task.completed_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Update */}
          {canUpdateStatus && task.status !== 'completed' && (
            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Update Status</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {task.status === 'pending' && (
                  <button 
                    onClick={() => handleStatusChange('in_progress')} 
                    className="btn btn-primary"
                  >
                    Start Working
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button 
                    onClick={() => handleStatusChange('completed')} 
                    className="btn btn-success"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>
              Comments ({task.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  marginBottom: '10px'
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {task.comments && task.comments.length > 0 ? (
                task.comments.map(comment => (
                  <div 
                    key={comment.id}
                    style={{
                      padding: '15px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--primary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '500' }}>
                        {comment.author?.name}
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          textTransform: 'capitalize'
                        }}>
                          ({comment.author?.role})
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Assigned Users */}
          <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Assigned To</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {task.assignedUsers?.map(assignedUser => (
                <div 
                  key={assignedUser.id}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '5px'
                  }}
                >
                  <div style={{ fontWeight: '500' }}>{assignedUser.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {assignedUser.email}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                    marginTop: '3px'
                  }}>
                    {assignedUser.role}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Creator Info */}
          {task.creator && (
            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Created By</h3>
              <div style={{
                padding: '10px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '5px'
              }}>
                <div style={{ fontWeight: '500' }}>{task.creator.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {task.creator.email}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize',
                  marginTop: '3px'
                }}>
                  {task.creator.role}
                </div>
              </div>
            </div>
          )}

          {/* Audit History */}
          {task.auditLogs && task.auditLogs.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Activity History</h3>
              <div style={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {task.auditLogs.map(log => (
                  <div 
                    key={log.id}
                    style={{
                      padding: '10px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '5px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '3px' }}>
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      by {log.user?.name}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '3px' }}>
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
};

export default TaskDetail;
