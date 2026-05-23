import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, Star, MapPin, ChevronRight, Printer, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const SHOPS = [
  { id: 1, name: 'UB Main Campus Print Shop', location: 'Near IT Center', jobs: 1240, rating: 4.8 },
  { id: 2, name: 'Faculty of Engineering Printers', location: 'Block C', jobs: 850, rating: 4.5 },
  { id: 3, name: 'Library Quick Print', location: 'Main Library Ground Floor', jobs: 3200, rating: 4.9 },
  { id: 4, name: 'Molyko Student Center', location: 'Molyko', jobs: 410, rating: 4.2 }
];

const ClientHome = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  
  const [step, setStep] = useState('upload'); // upload | uploading | configure | shop | pin | review
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pin, setPin] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Print Settings
  const [pages, setPages] = useState(1);
  const [isColor, setIsColor] = useState(false);
  
  // Shop Selection
  const [selectedShop, setSelectedShop] = useState(null);
  
  // Review
  const [reviewRating, setReviewRating] = useState(0);

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setStep('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setPdfUrl(`http://localhost:8000${data.url}`);
        setStep('configure');
      } else {
        alert('File upload/conversion failed');
        setStep('upload');
      }
    } catch (error) {
      console.error(error);
      alert('Network error during upload');
      setStep('upload');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleGeneratePin = () => {
    // Simulate final job submission to DB
    setStep('pin');
    setTimeout(() => {
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
    }, 1000);
  };

  const resetFlow = () => {
    setStep('upload');
    setFile(null);
    setPdfUrl(null);
    setPin(null);
    setPages(1);
    setIsColor(false);
    setSelectedShop(null);
    setReviewRating(0);
  };

  const calculateTotal = () => {
    return pages * (isColor ? 75 : 25);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container hero">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Campus printing, <span>unchained.</span></h1>
          <p>Upload from your room. Pay at the counter. No flash drives. No queues. No malware.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ marginBottom: '0.5rem', color: '#718096' }}>Welcome, <strong>{user?.name}</strong></p>
          <button
            onClick={handleLogout}
            style={{
              background: '#fed7d7',
              color: '#c53030',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div 
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <UploadCloud className="dropzone-icon" />
            <h3>Drag & drop your document here</h3>
            <p style={{ margin: 0 }}>or click to browse</p>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }} 
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx"
            />
          </div>
        )}

        {/* STEP 1.5: UPLOADING/CONVERTING */}
        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <UploadCloud size={48} className="dropzone-icon" style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 1rem' }} />
            <h3>Uploading and Converting...</h3>
            <p style={{ color: '#666' }}>We are preparing your print preview. Non-PDF files will be converted automatically.</p>
          </div>
        )}

        {/* FILE INFO HEADER (Shown in all steps after upload) */}
        {file && step !== 'upload' && step !== 'uploading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--blue-100)', borderRadius: '12px', marginBottom: '2rem' }}>
            <FileText color="var(--primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>{file.name}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            {step !== 'configure' && (
              <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{calculateTotal()} CFA</div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIGURE PRINT SETTINGS */}
        {step === 'configure' && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Left side: Print Layout Preview */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Print Layout</h3>
              <div style={{ border: '1px solid #ccc', borderRadius: '12px', overflow: 'hidden', height: '400px', background: '#f8f9fa' }}>
                {pdfUrl ? (
                  <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Loading preview...</div>
                )}
              </div>
            </div>

            {/* Right side: Settings */}
            <div style={{ flex: '1 1 300px' }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Print Settings</h2>
              
              <div className="print-settings-group">
                <div className="setting-row">
                  <span style={{ fontWeight: '600' }}>Number of Pages</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="500" 
                    value={pages} 
                    onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                
                <div className="setting-row">
                  <span style={{ fontWeight: '600' }}>Color Option</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`toggle-btn ${!isColor ? 'active' : ''}`}
                      onClick={() => setIsColor(false)}
                    >
                      B&W (25 CFA)
                    </button>
                    <button 
                      className={`toggle-btn ${isColor ? 'active' : ''}`}
                      onClick={() => setIsColor(true)}
                    >
                      Color (75 CFA)
                    </button>
                  </div>
                </div>
              </div>

              <div className="price-display">
                Total Estimated Cost: {calculateTotal()} CFA
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn" style={{ background: '#e2e8f0', color: '#4a5568', flex: 1 }} onClick={resetFlow}>Cancel</button>
                <button className="btn" style={{ flex: 2 }} onClick={() => setStep('shop')}>
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DISCOVER SHOPS */}
        {step === 'shop' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Select a Print Shop</h2>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {SHOPS.map(shop => (
                <div 
                  key={shop.id} 
                  className={`shop-card ${selectedShop?.id === shop.id ? 'active' : ''}`}
                  onClick={() => setSelectedShop(shop)}
                >
                  <div className="shop-info">
                    <h3>{shop.name}</h3>
                    <div className="shop-meta" style={{ marginBottom: '0.5rem' }}>
                      <MapPin size={14} /> {shop.location}
                    </div>
                    <div className="shop-meta">
                      <span className="star-rating">
                        <Star size={14} fill="currentColor" /> {shop.rating}
                      </span>
                      <span>•</span>
                      <span>{shop.jobs} jobs completed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn" style={{ background: '#e2e8f0', color: '#4a5568', flex: 1 }} onClick={() => setStep('configure')}>Back</button>
              <button 
                className="btn success" 
                style={{ flex: 2 }} 
                disabled={!selectedShop}
                onClick={handleGeneratePin}
              >
                Confirm Job & Get PIN
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PIN GENERATION */}
        {step === 'pin' && (
          <div style={{ textAlign: 'center' }}>
            {!pin ? (
              <div style={{ padding: '3rem 0' }}>
                <Printer size={48} className="dropzone-icon" style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 1rem' }} />
                <h3>Dispatching job to {selectedShop?.name}...</h3>
              </div>
            ) : (
              <div>
                <CheckCircle2 color="var(--success)" size={48} style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>Job Received!</h2>
                <p style={{ marginBottom: '2rem' }}>Show this PIN at <strong>{selectedShop?.name}</strong> to print</p>
                <div style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '0.5rem', color: 'var(--primary)', background: 'var(--blue-100)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center' }}>
                  {pin}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn" style={{ background: '#e2e8f0', color: '#4a5568' }} onClick={resetFlow}>Upload Another</button>
                  <button className="btn success" onClick={() => setStep('review')}><Star size={18} /> Leave a Review</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === 'review' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2>Rate your experience</h2>
            <p style={{ marginBottom: '2rem', color: '#718096' }}>How was the service at {selectedShop?.name}?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star}
                  size={48} 
                  fill={star <= reviewRating ? '#ecc94b' : 'none'}
                  color={star <= reviewRating ? '#ecc94b' : '#cbd5e0'}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setReviewRating(star)}
                />
              ))}
            </div>

            {reviewRating > 0 && (
              <p style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '2rem' }}>Thank you for your feedback!</p>
            )}

            <button className="btn" onClick={resetFlow}>Done</button>
          </div>
        )}

      </div>
      
      {/* Pulse Animation for Loading */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
      `}} />
    </div>
  );
};

export default ClientHome;
