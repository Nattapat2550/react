import React, { useEffect, useState } from 'react';
import api from '../api';

const HomePage = () => {
  const [me, setMe] = useState(null);
  const [content, setContent] = useState({});
  const [carousel, setCarousel] = useState([]);
  const [index, setIndex] = useState(0);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // ใช้ Promise.allSettled เพื่อให้ตัวใดตัวหนึ่งพัง (เช่น carousel 401) หน้าเว็บไม่พัง
        const results = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/homepage'),
          api.get('/api/carousel') // Rust บังคับ Admin เท่านั้น
        ]);

        if (cancelled) return;

        // 1. User Info
        if (results[0].status === 'fulfilled') {
          setMe(results[0].value.data.data);
        }

        // 2. Homepage Content
        if (results[1].status === 'fulfilled') {
          const list = results[1].value.data.data || [];
          const map = {};
          list.forEach((c) => {
            map[c.section_name] = c.content;
          });
          setContent(map);
        }

        // 3. Carousel
        if (results[2].status === 'fulfilled') {
          setCarousel(results[2].value.data.data || []);
        } else {
          // ถ้าโหลดไม่ได้ (เช่นไม่ได้เป็น Admin) ให้เป็น list ว่างๆ
          setCarousel([]);
        }

      } catch (err) {
        if (!cancelled) setMsg('Failed to load data');
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const hasCarousel = carousel && carousel.length > 0;
  const safeIndex = hasCarousel
    ? ((index % carousel.length) + carousel.length) % carousel.length
    : 0;
  const currentItem = hasCarousel ? carousel[safeIndex] : null;

  const go = (delta) => {
    if (!hasCarousel) return;
    setIndex((i) => i + delta);
  };

  const goto = (i) => {
    if (!hasCarousel) return;
    setIndex(i);
  };

  const welcomeHeader = content.welcome_header || (me ? `Welcome, ${me.username || me.email}` : 'Welcome');
  const mainParagraph = content.main_paragraph || 'This is your dashboard.';

  return (
    <>
      {/* Carousel */}
      <div className="carousel" id="carousel">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {hasCarousel ? (
            carousel.map((item) => (
              <div className="carousel-slide" key={item.id}>
                {item.image_dataurl ? (
                  <img src={item.image_dataurl} alt={item.title || 'Slide'} />
                ) : (
                  <div className="muted">No image</div>
                )}
              </div>
            ))
          ) : (
            <div className="carousel-slide">
              <div className="muted" style={{textAlign: 'center', paddingTop: '20px'}}>
                 {/* ไม่แสดงอะไร หรือบอกว่าไม่มีสไลด์ */}
                 No active slides
              </div>
            </div>
          )}
        </div>

        <button className="carousel-prev" onClick={() => go(-1)} disabled={!hasCarousel}>&lt;</button>
        <button className="carousel-next" onClick={() => go(1)} disabled={!hasCarousel}>&gt;</button>

        <div className="carousel-indicators">
          {hasCarousel && carousel.map((item, i) => (
            <button
              key={item.id}
              className={i === safeIndex ? 'active' : ''}
              onClick={() => goto(i)}
            >
              •
            </button>
          ))}
        </div>
      </div>

      <div id="carousel-caption-box" className="card">
        <h3>{currentItem?.title || ''}</h3>
        <h5 className="muted">{currentItem?.subtitle || ''}</h5>
        <p>{currentItem?.description || ''}</p>
      </div>

      <hr />

      <h2>{welcomeHeader}</h2>
      <p>{mainParagraph}</p>

      {msg && <p className="muted" style={{ color: 'red' }}>{msg}</p>}
    </>
  );
};

export default HomePage;