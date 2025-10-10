(function(){
  if (!document.getElementById('app')) return;

  function useQuery(){
    const [params] = React.useState(new URLSearchParams(location.search));
    return params;
  }

  function ResetPage(){
    const qs = useQuery();
    const token = qs.get('token');
    const [email, setEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const [stage, setStage] = React.useState(token ? 'set' : 'request');
    const [busy, setBusy] = React.useState(false);

    const request = async (e)=>{
      e.preventDefault(); setMsg(''); setBusy(true);
      try { await api('/api/auth/forgot-password', { method:'POST', body:{ email: email.trim() }}); setMsg('If that email exists, a reset link was sent.'); }
      catch(err){ setMsg(err.message); }
      finally{ setBusy(false); }
    };

    const setpw = async (e)=>{
      e.preventDefault(); setMsg(''); setBusy(true);
      try { await api('/api/auth/reset-password', { method:'POST', body:{ token, newPassword }});
        setMsg('Password set. You can login now.');
      } catch(err){ setMsg(err.message); }
      finally { setBusy(false); }
    };

    if (stage === 'request') {
      return React.createElement('div', {},
        React.createElement('h2', null, 'Reset Password'),
        React.createElement('p', null, 'Enter your email and we\'ll send a reset link.'),
        React.createElement('form', { onSubmit: request },
          React.createElement('label', null, 'Email'),
          React.createElement('input', { type:'email', required:true, value:email, onChange:e=>setEmail(e.target.value) }),
          React.createElement('button', { className:'btn', type:'submit', disabled:busy }, busy ? 'Please wait...' : 'Send reset link')
        ),
        React.createElement('p', { id:'msg', className:'muted' }, msg)
      );
    } else {
      return React.createElement('div', {},
        React.createElement('h2', null, 'Set New Password'),
        React.createElement('form', { onSubmit: setpw },
          React.createElement('label', null, 'New Password'),
          React.createElement('input', { type:'password', required:true, minLength:8, value:newPassword, onChange:e=>setNewPassword(e.target.value) }),
          React.createElement('button', { className:'btn', type:'submit', disabled:busy }, busy ? 'Please wait...' : 'Set Password')
        ),
        React.createElement('p', { id:'msg', className:'muted' }, msg)
      );
    }
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(ResetPage));
})();
