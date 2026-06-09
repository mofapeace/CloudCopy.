import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintCustomizer from '../components/PrintCustomizer';
import PinDisplay from '../components/PinDisplay';
import TwoFactorModal from '../components/TwoFactorModal';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const detectColor = (canvas) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  // Sample every 16th pixel for performance
  for (let i = 0; i < data.length; i += 64) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 50) continue; 
    if (Math.abs(r - g) > 15 || Math.abs(r - b) > 15 || Math.abs(g - b) > 15) {
      return true;
    }
  }
  return false;
};

export default function StudentUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [colorPagesMap, setColorPagesMap] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [shopId, setShopId] = useState('');
  const [shops, setShops] = useState([]);
  const [reserveAtShop, setReserveAtShop] = useState(false);
  const [targetShopId, setTargetShopId] = useState('');
  const [options, setOptions] = useState({ color: false, doubleSided: false, copies: 1 });
  
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);

  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [confirmingTwoFA, setConfirmingTwoFA] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');

  useEffect(() => {
    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        if (session.user.user_metadata?.isPro) setReserveAtShop(true);
        if (session.user.user_metadata?.name) {
          setStudentName(session.user.user_metadata.name);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (session.user.user_metadata?.isPro) setReserveAtShop(true);
        if (session.user.user_metadata?.name && !studentName) {
          setStudentName(session.user.user_metadata.name);
        }
      } else {
        setUser(null);
      }
    });

    const uses = parseInt(localStorage.getItem('cloudkopii_free_uses') || '0', 10);
    // If not logged in and used >= 5 free prints, redirect to login
    if (!user && uses >= 5) navigate('/login');

    api.get('/shop').then((res) => {
      setShops(res.data);
      if (res.data.length > 0) {
        setShopId(res.data[0].id);
        if (!targetShopId) setTargetShopId(res.data[0].id);
      }
    }).catch(console.error);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, user]);

  const handleFile = async (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrls([]);
      setColorPagesMap([]);
      setIsParsing(true);
      
      if (selectedFile.type.startsWith('image/')) {
        setPageCount(1);
        const url = URL.createObjectURL(selectedFile);
        
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          // Fill white background in case of transparent PNG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const isColor = detectColor(canvas);
          setColorPagesMap([isColor]);
          setPreviewUrls([url]);
          setIsParsing(false);
        };
      } else if (selectedFile.type === 'application/pdf') {
        try {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          setPageCount(pdf.numPages);
          
          const newPreviewUrls = [];
          const newColorMap = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            // High quality preview - render at 2.0 scale for crisp display
            const scale = 2.0;
            const scaledViewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
            
            const isColor = detectColor(canvas);
            newColorMap.push(isColor);
            newPreviewUrls.push(canvas.toDataURL());
            
            // Only force React state update every 5 pages to keep UI snappy, or at the end
            if (i % 5 === 0 || i === pdf.numPages) {
              setPreviewUrls([...newPreviewUrls]);
              setColorPagesMap([...newColorMap]);
            }
            
            // Yield to main thread
            await new Promise(r => setTimeout(r, 0));
          }
          setIsParsing(false);
        } catch (err) {
          console.error("Error parsing PDF:", err);
          setPageCount(1);
          setIsParsing(false);
        }
      } else {
        setIsParsing(false);
      }
    }
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !studentName || !shopId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentName', studentName);
    formData.append('shopId', shopId);
    formData.append('color', options.color);
    formData.append('doubleSided', options.doubleSided);
    formData.append('copies', options.copies);
    formData.append('colorPagesMap', JSON.stringify(colorPagesMap));
    // Pro reservation fields
    formData.append('isPro', reserveAtShop ? 'true' : 'false');
    formData.append('targetShopId', reserveAtShop ? targetShopId : '');

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uses = parseInt(localStorage.getItem('cloudkopii_free_uses') || '0', 10);
      localStorage.setItem('cloudkopii_free_uses', (uses + 1).toString());

      const displayShopName = reserveAtShop ? shops.find(s => s.id === targetShopId)?.name : shops.find(s => s.id === shopId)?.name;
      setResult({ ...res.data, shopName: displayShopName });
      setShow2FA(false);
      setTwoFACode('');
      setTwoFAError('');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmTwoFA = async (code) => {
    if (!result?.job_id) {
      setTwoFAError('No job ID found');
      return;
    }

    setConfirmingTwoFA(true);
    setTwoFAError('');

    try {
      await api.post('/pin/confirm-2fa', {
        jobId: result.job_id,
        twoFACode: code
      });
      
      setShow2FA(false);
      setTwoFACode('');
      
      // Show success message and reset upload
      setTimeout(() => {
        setResult(null);
        setFile(null);
        setPreviewUrls([]);
        setColorPagesMap([]);
        setPageCount(0);
        alert('✅ Print confirmed! Operator will release your document to the printer.');
        const uses = parseInt(localStorage.getItem('cloudkopii_free_uses') || '0', 10);
        if (uses >= 5) navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Invalid code';
      setTwoFAError(errorMsg);
    } finally {
      setConfirmingTwoFA(false);
    }
  };

  if (result) {
    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <PinDisplay pin={result.pin} price={result.price} priceMin={result.priceMin} priceMax={result.priceMax} pinMode={result.pinMode} shopName={result.shopName} />
        
        {/* 2FA Step */}
        <div className="glass-card" style={{ marginTop: '2rem', background: 'rgba(0, 122, 255, 0.05)', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(0, 122, 255, 0.15)', borderRadius: '8px' }}>
              <AlertCircle size={24} color="var(--accent-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Next: Enter Verification Code</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Show the PIN to an operator. They will give you a 6-digit verification code. Enter it below to confirm your print.
              </p>
            </div>
          </div>

          {!show2FA ? (
            <button 
              className="btn btn-primary" 
              onClick={() => setShow2FA(true)}
              style={{ width: '100%', background: 'var(--accent-primary)' }}
            >
              Ready to Enter Code
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Waiting for operator code...
              </p>
            </div>
          )}
        </div>

        <TwoFactorModal 
          isOpen={show2FA}
          onVerify={handleConfirmTwoFA}
          onClose={() => { setShow2FA(false); setTwoFAError(''); }}
        />

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={() => { 
            setResult(null); 
            setFile(null); 
            setPreviewUrls([]);
            setColorPagesMap([]);
            setPageCount(0);
            setShow2FA(false);
            setTwoFACode('');
            setTwoFAError('');
            const uses = parseInt(localStorage.getItem('cloudkopii_free_uses') || '0', 10);
            if (uses >= 5) navigate('/login');
          }}>
            Upload Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="glass-card animate-fade-in">
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Print a Document</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Upload your file, get a PIN, and pick it up at a partner shop.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{user.email}</span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.75rem' }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.removeItem('cloudkopii_free_uses');
                  navigate('/login');
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => navigate('/login?mode=signup')}>Sign Up</button>
          )}
        </div>

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Print Shop</label>
            <select 
              className="input-field" 
              value={shopId} 
              onChange={e => setShopId(e.target.value)}
              required
            >
              <option value="" disabled>Choose a location</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.location}</option>
              ))}
            </select>
          </div>

          {/* Reserve at specific shop (Pro users) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <input type="checkbox" checked={reserveAtShop} onChange={e => setReserveAtShop(e.target.checked)} />
              <span>Reserve at specific shop (Pro users)</span>
            </label>

            {reserveAtShop && (
              <div style={{ marginTop: '0.5rem' }}>
                <select value={targetShopId} onChange={e => setTargetShopId(e.target.value)} className="input-field" style={{ width: '100%' }}>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.location}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Your Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. John Doe"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              required
            />
          </div>

          <div 
            style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: file ? '1rem' : '3rem 2rem', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.02)',
              cursor: file ? 'default' : 'pointer',
              transition: 'var(--transition)',
              marginBottom: '1.5rem',
              overflow: 'hidden'
            }}
            onClick={() => !file && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
          >
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {pageCount > 0 ? `${pageCount} page${pageCount !== 1 ? 's' : ''}` : '...'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                
                {/* Scrollable Full Document Preview */}
                {previewUrls.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem', 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: '8px',
                    width: '100%',
                    filter: options.color ? 'none' : 'grayscale(100%)',
                    transition: 'filter 0.3s ease'
                  }}>
                    {previewUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                          Page {i + 1}
                        </div>
                        {colorPagesMap[i] && options.color && (
                          <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                            Color
                          </div>
                        )}
                        <img 
                          src={url} 
                          alt={`Page ${i + 1}`} 
                          style={{ 
                            width: '100%', 
                            borderRadius: '4px', 
                            boxShadow: 'var(--shadow-sm)',
                            background: 'white',
                            display: 'block'
                          }} 
                        />
                      </div>
                    ))}
                    {isParsing && (
                      <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        Parsing remaining pages...
                      </div>
                    )}
                  </div>
                )}
                
                {isParsing && previewUrls.length === 0 && (
                  <div style={{ padding: '2rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                    Analyzing document for color pages...
                  </div>
                )}
                
                <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => {
                  setFile(null);
                  setPreviewUrls([]);
                  setColorPagesMap([]);
                  setPageCount(0);
                }}>
                  Remove File
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <UploadCloud size={48} />
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Click or drag file to upload</div>
                <div style={{ fontSize: '0.85rem' }}>Supports PDF, JPG, PNG</div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.jpg,.jpeg,.png" 
              style={{ display: 'none' }} 
              required={!file}
            />
          </div>

          {file && !isParsing && (
            <div className="animate-fade-in">
              <PrintCustomizer options={options} setOptions={setOptions} pageCount={pageCount} colorPagesMap={colorPagesMap} />
            </div>
          )}

          <div style={{ marginTop: '2.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              disabled={!file || !studentName || !shopId || isUploading || isParsing}
            >
              {isUploading ? 'Uploading...' : 'Get Print PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
