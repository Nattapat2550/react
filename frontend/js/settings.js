// React Settings Page
(function(){
  if (!document.getElementById('app')) return;

  function SettingsPage(){
    const [username, setUsername] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const [me, setMe] = React.useState(null);

    React.useEffect(()=>{ (async()=>{
      try { const m = await api('/api/users/me'); setMe(m); setUsername(m.username||''); }
      catch { location.replace('index.html'); }
    })(); }, []);

    const onSubmit = async (e)=>{
      e.preventDefault(); setMsg('');
      try { await api('/api/users/me', { method:'PUT', body:{ username }});
        setMsg('Saved.'); }
      catch(err){ setMsg(err.message); }
    };

    const onUpload = async (e)=>{
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setMsg('Uploading...');
      const form = new FormData(); form.append('avatar', file);
      try {
        const res = await fetch(API_BASE_URL + '/api/users/upload-avatar', { method:'POST', body: form, credentials:'include' });
        if (!res.ok) { const j = await res.json().catch(()=>({error:'Upload failed'})); throw new Error(j.error || 'Upload failed'); }
        const data = await res.json(); setMe(m=>({ ...(m||{}), profile_picture_url: data.profile_picture_url })); setMsg('Avatar uploaded.');
      } catch(err){ setMsg(err.message); }
    };

    const onDelete = async ()=>{
      if (!confirm('Delete your account? This cannot be undone.')) return;
      try { await api('/api/users/me', { method:'DELETE' }); location.replace('index.html'); }
      catch(err){ setMsg(err.message); }
    };

    if (!me) return React.createElement('p', null, 'Loading...');
    return React.createElement('div', {},
      React.createElement('div', { className:'profile' },
        React.createElement('img', { id:'avatar', src: me.profile_picture_url || 'images/user.png', width:64, height:64 }),
      ),
      React.createElement('form', { onSubmit },
        React.createElement('label', null, 'Username'),
        React.createElement('input', { value: username, onChange:e=>setUsername(e.target.value) }),
        React.createElement('button', { className:'btn', type:'submit' }, 'Save')
      ),
      React.createElement('div', { className:'divider' }, 'Avatar'),
      React.createElement('input', { type:'file', accept:'image/*', onChange: onUpload }),
      React.createElement('div', { className:'divider' }),
      React.createElement('button', { className:'btn outline', onClick: onDelete }, 'Delete account'),
      React.createElement('p', { id:'msg', className:'muted' }, msg)
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(SettingsPage));
})();
