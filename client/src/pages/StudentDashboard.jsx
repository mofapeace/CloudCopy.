import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { FileText, Edit2, CheckCircle, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({ color: false, doubleSided: false, copies: 1 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/login');
      } else if (session.user.user_metadata?.role === 'operator') {
        navigate('/operator');
      } else {
        setUser(session.user);
        fetchJobs(session.user.email);
      }
    });
  }, [navigate]);

  const fetchJobs = async (email) => {
    try {
      const res = await api.get(`/jobs/student/${email}`);
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.post(`/jobs/${id}/confirm`);
      setJobs(jobs.map(j => j.id === id ? { ...j, student_confirmed: true } : j));
    } catch (err) {
      alert('Failed to confirm job.');
    }
  };

  const handleEditSave = async (id) => {
    try {
      const res = await api.patch(`/jobs/${id}`, editForm);
      setJobs(jobs.map(j => j.id === id ? { ...j, ...res.data } : j));
      setEditingJob(null);
    } catch (err) {
      alert('Failed to update job.');
    }
  };

  const startEdit = (job) => {
    setEditingJob(job.id);
    setEditForm({ color: job.color, doubleSided: job.double_sided, copies: job.copies });
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const pastJobs = jobs.filter(j => j.status !== 'pending');

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>My Prints</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/student')}>Upload New</button>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={20} /> Pending Prints
      </h2>
      
      {pendingJobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          No pending prints.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255, 149, 0, 0.1)', border: '1px solid rgba(255, 149, 0, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <div>
              <strong>Don't forget!</strong> Your 4-digit PIN is required to print at the shop. Any unprinted jobs are automatically wiped from the system after 12 hours for security.
            </div>
          </div>
          {pendingJobs.map(job => (
            <div key={job.id} className="glass-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> {job.shops?.name || 'Shop'} 
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                    {job.page_count} pages • {job.color ? 'Color' : 'B&W'} • {job.double_sided ? 'Double-sided' : 'Single-sided'} • {job.copies} copies
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '1.25rem' }}>
                    {job.price_cfa} CFA
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Your PIN</div>
                  <div style={{ fontSize: '1.5rem', letterSpacing: '0.2em', fontWeight: 700, background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                    {job.raw_pin || '----'}
                  </div>
                </div>
              </div>

              {editingJob === job.id ? (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.checked})} />
                      Color
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={editForm.doubleSided} onChange={e => setEditForm({...editForm, doubleSided: e.target.checked})} />
                      Double-sided
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      Copies:
                      <input type="number" min="1" max="100" value={editForm.copies} onChange={e => setEditForm({...editForm, copies: parseInt(e.target.value)||1})} style={{ width: '60px', padding: '0.2rem' }} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={() => handleEditSave(job.id)}>Save Changes</button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setEditingJob(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {!job.student_confirmed ? (
                    <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleConfirm(job.id)}>
                      <CheckCircle size={18} /> Confirm Print
                    </button>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 500, background: 'rgba(52, 199, 89, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle size={18} /> Confirmed! Give PIN to shop.
                    </div>
                  )}
                  {!job.student_confirmed && (
                    <button className="btn btn-secondary" onClick={() => startEdit(job)}>
                      <Edit2 size={18} /> Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CheckCircle size={20} /> Past Prints
      </h2>
      
      {pastJobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No past prints.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pastJobs.map(job => (
            <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
              <div>
                <strong>{job.shops?.name || 'Shop'}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {job.page_count} pages • {job.price_cfa} CFA
                </div>
              </div>
              <div style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {job.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
