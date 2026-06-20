import React from 'react';
import { Printer, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function JobCard({ job, onRelease, onComplete, disabled = false }) {
  const handleRelease = async () => {
    try {
      await api.post('/pin/release', { jobId: job.id });
      onRelease(job.id);
      toast.success('Job released to printer!');
    } catch (err) {
      toast.error('Failed to release job: ' + err.message);
    }
  };

  const handleComplete = async () => {
    try {
      await api.post('/pin/complete', { jobId: job.id });
      if (onComplete) onComplete(job.id);
      toast.success('Job marked as completed!');
    } catch (err) {
      toast.error('Failed to complete job: ' + err.message);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', background: 'rgba(0,122,255,0.1)', borderRadius: '12px' }}>
            <FileText size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.15rem', marginBottom: '0.15rem' }}>{job.student_name || job.studentName}</h4>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Job ID: {(job.id || '').slice(0, 8)}...
            </div>
          </div>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
          {job.price_cfa || job.price} CFA
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.5rem', 
        marginBottom: '1.25rem', 
        padding: '0.75rem', 
        background: 'rgba(0,0,0,0.03)', 
        borderRadius: 'var(--radius-md)' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Pages</div>
          <div style={{ fontWeight: 600 }}>{job.page_count || job.pageCount}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Mode</div>
          <div style={{ fontWeight: 600 }}>{job.color ? 'Color' : 'B&W'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Sides</div>
          <div style={{ fontWeight: 600 }}>{job.double_sided || job.doubleSided ? '2-Sided' : '1-Sided'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Copies</div>
          <div style={{ fontWeight: 600 }}>{job.copies}</div>
        </div>
      </div>

      {!disabled && job.fileUrl && (
        <a 
          href={job.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-secondary" 
          style={{ width: '100%', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Eye size={18} />
          Preview Document
        </a>
      )}

      {job.status === 'printing' ? (
        <button className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-primary)' }} onClick={handleComplete}>
          Mark as Completed
        </button>
      ) : (
        <button className="btn btn-success" style={{ width: '100%' }} onClick={handleRelease} disabled={disabled}>
          <Printer size={18} />
          {disabled ? 'Waiting for Student...' : 'Release to Printer'}
        </button>
      )}
    </div>
  );
}
