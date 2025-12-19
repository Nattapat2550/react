import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const HomePage = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);

  // 1. Fetch Carousel Data
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await api.get('/api/carousel');
        if (res.data.ok && res.data.data.length > 0) {
          setSlides(res.data.data);
        } else {
          // Fallback ถ้าไม่มีข้อมูลใน DB
          setSlides([
             { 
               id: 999, 
               image_dataurl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80', 
               title: 'Welcome to MyApp',
               description: 'Secure & Fast Platform'
             }
          ]);
        }
      } catch (err) {
        console.error("Load carousel failed", err);
      }
    };
    fetchSlides();
  }, []);

  // 2. Auto Slide Logic
  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000); // เปลี่ยนทุก 4 วินาที

    return () => resetTimeout();
  }, [current, slides.length]);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div className="home-container">
      {/* Hero / Carousel Section */}
      <div className="carousel-container" style={{ position: 'relative', overflow: 'hidden', height: '400px', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        {slides.length > 0 ? (
          <div 
            className="carousel-track"
            style={{
              display: 'flex',
              transform: `translateX(-${current * 100}%)`,
              transition: 'transform 0.5s ease-in-out',
              height: '100%'
            }}
          >
            {slides.map((slide, idx) => (
              <div key={idx} style={{ minWidth: '100%', position: 'relative' }}>
                <img 
                  src={slide.image_dataurl} 
                  alt={slide.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute', bottom: '30px', left: '30px',
                  background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '15px 25px', borderRadius: '8px',
                  backdropFilter: 'blur(4px)'
                }}>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{slide.title}</h2>
                  {slide.description && <p style={{ margin: 0, opacity: 0.9 }}>{slide.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#eee' }}>
            Loading...
          </div>
        )}

        {/* Indicators */}
        <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', zIndex: 10 }}>
          {slides.map((_, idx) => (
            <span 
              key={idx}
              onClick={() => setCurrent(idx)}
              style={{
                display: 'inline-block',
                width: '10px', height: '10px',
                borderRadius: '50%',
                background: current === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                margin: '0 6px', cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h1>Ready to get started?</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Download our application to experience the full features.</p>
        <Link to="/download" className="btn" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Download App</Link>
      </div>
    </div>
  );
};

export default HomePage;