import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const normalizeCarouselItems = (payload) => {
  // รองรับหลายรูปแบบ: array หรือ {ok,data}
  let items = payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    items = payload.data;
  }
  if (!Array.isArray(items)) return [];

  return items.map((it, idx) => ({
    id: it.id ?? idx,
    title: it.title ?? '',
    subtitle: it.subtitle ?? '',
    description: it.description ?? '',
    image_dataurl: it.image_dataurl || it.imageUrl || it.image_url || '',
  })).filter((x) => x.image_dataurl);
};

const HomePage = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [contentMap, setContentMap] = useState({});
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);

  const trackRef = useRef(null);
  const shellRef = useRef(null);

  const pointerDownRef = useRef(false);
  const startXRef = useRef(0);

  const safeSlides = useMemo(() => {
    if (slides.length > 0) return slides;
    return [
      {
        id: 'fallback',
        title: 'No slides yet',
        subtitle: '',
        description: '',
        image_dataurl: '/images/user.png',
      },
    ];
  }, [slides]);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await api.get('/api/users/me');
        setMe(meRes.data);

        const hpRes = await api.get('/api/homepage');
        const arr = Array.isArray(hpRes.data) ? hpRes.data : [];
        const map = Object.fromEntries(arr.map((c) => [c.section_name, c.content]));
        setContentMap(map);

        const carRes = await api.get('/api/carousel');
        const normalized = normalizeCarouselItems(carRes.data);
        setSlides(normalized);
      } catch {
        // ถ้า auth หลุด → กลับหน้าแรก
        navigate('/', { replace: true });
      }
    };
    init();
  }, [navigate]);

  // swipe (เหมือน docker)
  useEffect(() => {
    const onPointerUp = (e) => {
      if (!pointerDownRef.current) return;
      const dx = e.clientX - startXRef.current;
      if (dx > 40) setIndex((i) => (i - 1 + safeSlides.length) % safeSlides.length);
      else if (dx < -40) setIndex((i) => (i + 1) % safeSlides.length);
      pointerDownRef.current = false;
    };
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [safeSlides.length]);

  const goTo = (i) => {
    const len = safeSlides.length;
    setIndex((((i % len) + len) % len));
  };

  const current = safeSlides[index] || safeSlides[0];
  const welcomeHeader =
    contentMap.welcome_header || `Welcome, ${me?.username || me?.email || ''}`.trim();
  const mainParagraph = contentMap.main_paragraph || 'This is your dashboard.';

  return (
    <>
      {/* Carousel */}
      <div className="carousel" id="carousel" ref={shellRef}>
        <div
          className="carousel-track"
          id="carousel-track"
          ref={trackRef}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onPointerDown={(e) => {
            pointerDownRef.current = true;
            startXRef.current = e.clientX;
          }}
        >
          {safeSlides.map((it) => (
            <div className="carousel-slide" key={it.id}>
              <img src={it.image_dataurl} alt={it.title || 'Slide'} />
            </div>
          ))}
        </div>

        <button
          className="carousel-prev"
          id="carousel-prev"
          aria-label="รูปก่อนหน้า"
          title="< รูปก่อนหน้า"
          type="button"
          onClick={() => goTo(index - 1)}
        >
          &lt;
        </button>

        <button
          className="carousel-next"
          id="carousel-next"
          aria-label="รูปถัดไป"
          title="> รูปถัดไป"
          type="button"
          onClick={() => goTo(index + 1)}
        >
          &gt;
        </button>

        <div className="carousel-indicators" id="carousel-indicators">
          {safeSlides.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              className={idx === index ? 'active' : ''}
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
              title={it.title || `Slide ${idx + 1}`}
            >
              <img src={it.image_dataurl} alt={it.title || `Slide ${idx + 1}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Caption Box */}
      <div id="carousel-caption-box" className="card">
        <h3 id="cc-title">{current?.title || ''}</h3>
        <h5 id="cc-subtitle" className="muted">{current?.subtitle || ''}</h5>
        <p id="cc-desc">{current?.description || ''}</p>
      </div>

      <hr />

      <h2 id="welcome_header">{welcomeHeader}</h2>
      <p id="main_paragraph">{mainParagraph}</p>
    </>
  );
};

export default HomePage;
