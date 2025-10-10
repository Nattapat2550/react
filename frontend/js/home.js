(function(){
  if (!document.getElementById('app')) return;

  function useAsync(fn, deps){
    const [state, setState] = React.useState({ loading:true, error:null, data:null });
    React.useEffect(()=>{
      let alive = true;
      (async ()=>{
        try { const data = await fn(); if (alive) setState({ loading:false, error:null, data }); }
        catch(err){ if (alive) setState({ loading:false, error:err, data:null }); }
      })();
      return ()=>{ alive=false; };
    }, deps||[]);
    return state;
  }

  function Carousel({ items }){
    const [idx, setIdx] = React.useState(0);
    const n = items.length;
    const go = (d)=> setIdx((idx+d+n)%n);
    if (!n) return React.createElement('div', { className:'carousel' }, 'No slides yet');
    const it = items[idx];
    return React.createElement('div', { className:'carousel' },
      React.createElement('div', { className:'carousel-slide' },
        React.createElement('img', { src: it.image_dataurl || 'images/user.png', alt: it.title || 'Slide' }),
        React.createElement('div', { className:'caption' },
          React.createElement('h3', null, it.title || ''),
          React.createElement('p', null, it.subtitle || ''),
          React.createElement('p', null, it.description || '')
        )
      ),
      React.createElement('div', { className:'carousel-controls' },
        React.createElement('button', { className:'btn outline', onClick:()=>go(-1) }, 'Prev'),
        React.createElement('span', { className:'muted' }, (idx+1) + ' / ' + n),
        React.createElement('button', { className:'btn outline', onClick:()=>go(1) }, 'Next')
      )
    );
  }

  function HomePage(){
    const meState = useAsync(()=>api('/api/users/me'), []);
    if (meState.loading) return React.createElement('p', null, 'Loading...');
    if (meState.error) { location.replace('index.html'); return null; }
    const me = meState.data;

    const hpState = useAsync(()=>api('/api/homepage'), []);
    const slidesState = useAsync(()=>api('/api/carousel'), []);
    const contentMap = (hpState.data||[]).reduce((a,c)=> (a[c.section_name]=c.content, a), {});
    const slides = Array.isArray(slidesState.data) ? slidesState.data : [];

    return React.createElement('div', {},
      React.createElement('div', { className:'profile' },
        React.createElement('img', { id:'avatar', src: me.profile_picture_url || 'images/user.png', width:64, height:64 }),
        React.createElement('h2', { id:'uname' }, me.username || me.email),
        React.createElement('div', null, 
          React.createElement('a', { className:'btn outline', href:'settings.html' }, 'Settings'),
          React.createElement('button', { className:'btn', id:'logoutBtn', onClick: async ()=> { try{ await api('/api/auth/logout', { method:'POST' }); } catch{} location.replace('index.html'); } }, 'Logout')
        )
      ),
      React.createElement('section', null,
        React.createElement('h3', { id:'welcome_header' }, contentMap['welcome_header'] || `Welcome, ${me.username || me.email}`),
        React.createElement('p', { id:'main_paragraph' }, contentMap['main_paragraph'] || 'This is your dashboard.')
      ),
      React.createElement('section', null,
        React.createElement('h3', null, 'Carousel'),
        React.createElement(Carousel, { items: slides.length ? slides : [{ title:'No slides yet', image_dataurl:'images/user.png' }] })
      )
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(HomePage));
})();
