// React Login Page
(function(){
  if (!document.getElementById('app')) return;

  function LoginPage(){
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const onSubmit = async (e) => {
      e.preventDefault();
      
    };

    const submit = async (e) => {
      e.preventDefault();
      setMsg(''); setBusy(true);
      try {
        await api('/api/auth/login', { method:'POST', body:{ email: email.trim(), password }});
        location.replace('home.html');
      } catch (err) { setMsg(err.message); }
      finally { setBusy(false); }
    };

    const onGoogle = () => { location.href = API_BASE_URL + '/api/auth/google'; };

    return React.createElement('div', {},
      React.createElement('h2', null, 'Login'),
      React.createElement('form', { onSubmit: submit },
        React.createElement('label', null, 'Email'),
        React.createElement('input', { type:'email', required:true, value:email, onChange:e=>setEmail(e.target.value) }),
        React.createElement('label', null, 'Password'),
        React.createElement('input', { type:'password', required:true, value:password, onChange:e=>setPassword(e.target.value) }),
        React.createElement('button', { className:'btn', type:'submit', disabled:busy }, busy ? 'Please wait...' : 'Login')
      ),
      React.createElement('div', { className:'divider' }, 'or'),
      React.createElement('button', { className:'btn outline', onClick:onGoogle }, 'Sign in with Google'),
      React.createElement('p', { className:'muted' }, React.createElement('a', { href:'reset.html' }, 'Forgot password?')),
      React.createElement('p', { id:'msg', className:'muted' }, msg)
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(LoginPage));
})();
