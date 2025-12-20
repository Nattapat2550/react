import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';

function normalizeCarousel(items) {
  const arr = Array.isArray(items) ? items : (items?.data || items?.items || []);
  return (arr || [])
    .map((it) => ({
      id: it.id,
      item_index: it.item_index ?? it.itemIndex ?? 0,
      image_dataurl: it.image_dataurl ?? it.imageDataUrl ?? '',
      title: it.title || '',
      subtitle: it.subtitle || '',
      description: it.description || '',
    }))
    .sort((a, b) => (a.item_index || 0) - (b.item_index || 0));
}

function pickHomepage(contentArray) {
  const m = new Map();
  (contentArray || []).forEach((r) => m.set(r.section_name, r.content));
  return {
    welcome_title: m.get('welcome_title') || 'Welcome!',
    main_paragraph: m.get('main_paragraph') || 'This is your protected homepage.',
  };
}

const HomePage = () => {
  const [slides, setSlides] = useState([]);
  const [home, setHome] = useState({ welcome_title: 'Welcome!', main_paragraph: 'This is your protected homepage.' });
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState('');
  const touch = useRef({ startX: 0, moved: false });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr('');
      try {
        const [cRes, hRes] = await Promise.all([
          api.get('/api/carousel'),
          api.get('/api/homepage'),
        ]);

        const c = normalizeCarousel(cRes.data);
        const h = pickHomepage(hRes.data);

        if (!cancelled) {
          setSlides(c);
          setHome(h);
          setIdx(0);
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || 'Failed to load homepage');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(() => slides[idx] || null, [slides, idx]);

  const prev = () => {
    if (!slides.length) return;
    setIdx((i) => (i - 1 + slides.length) % slides.length);
  };
  const next = () => {
    if (!slides.length) return;
    setIdx((i) => (i + 1) % slides.length);
  };

  return (
    <>
      <h1>Home</h1>
      {err ? <p className="muted">{err}</p> : null}

      <div className="carousel">
        <button className="carousel-btn prev" type="button" onClick={prev}>⟨</button>

        <div
          className="carousel-viewport"
          onTouchStart={(e) => {
            touch.current.startX = e.touches[0].clientX;
            touch.current.moved = false;
          }}
          onTouchMove={(e) => {
            const dx = e.touches[0].clientX - touch.current.startX;
            if (Math.abs(dx) > 25) touch.current.moved = true;
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches[0].clientX;
            const dx = endX - touch.current.startX;
            if (!touch.current.moved) return;
            if (dx > 30) prev();
            if (dx < -30) next();
          }}
        >
          <div
            className="carousel-track"
            style={{
              transform: `translateX(${-idx * 100}%)`,
              width: `${Math.max(slides.length, 1) * 100}%`,
            }}
          >
            {(slides.length ? slides : [{ id: 'empty', image_dataurl: '' }]).map((it) => (
              <div className="carousel-slide" key={it.id}>
                {it.image_dataurl ? (
                  <img src={it.image_dataurl} alt={it.title || 'slide'} />
                ) : (
                  <div className="carousel-empty">No slides</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button className="carousel-btn next" type="button" onClick={next}>⟩</button>
      </div>

      <div className="thumbs">
        {slides.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className={'thumb' + (i === idx ? ' active' : '')}
            onClick={() => setIdx(i)}
            title={it.title || `Slide ${i + 1}`}
          >
            <img src={it.image_dataurl} alt="" />
          </button>
        ))}
      </div>

      <section className="card caption">
        <h2>{current?.title || ''}</h2>
        <h3 className="muted">{current?.subtitle || ''}</h3>
        <p>{current?.description || ''}</p>
      </section>

      <section className="card">
        <h2>{home.welcome_title}</h2>
        <p>{home.main_paragraph}</p>
      </section>
    </>
  );
};

export default HomePage;
