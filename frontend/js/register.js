(function(){
  if (!document.getElementById('app')) return;

  function RegisterPage(){
    const [email, setEmail] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const onSubmit = async (e) => {
      e.preventDefault();
      setMsg('');
      setBusy(true);
      try {
        const resp = await api('/api/auth/register', { method:'POST', body:{ email: email.trim() }});
        sessionStorage.setItem('pendingEmail', email.trim());
        if (resp && resp.dev_code) sessionStorage.setItem('dev_code', resp.dev_code);
        location.href = 'check.html';
      } catch (err) {
        setMsg(err.message);
      } finally { setBusy(false); }
    };

    const onGoogle = () => { location.href = API_BASE_URL + '/api/auth/google'; };

    return React.createElement('div', {},
      React.createElement('h2', null, 'Register with Email'),
      React.createElement('form', { onSubmit },
        React.createElement('label', null, 'Email'),
        React.createElement('input', { type:'email', required:true, value:email, onChange:e=>setEmail(e.target.value) }),
        React.createElement('button', { className:'btn', type:'submit', disabled:busy }, busy ? 'Please wait...' : 'Register')
      ),
      React.createElement('div', { className:'divider' }, 'or'),
      React.createElement('button', { className:'btn outline', onClick:onGoogle }, 'Sign up with Google'),
      React.createElement('p', { id:'msg', className:'muted' }, msg)
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(RegisterPage));
})();
