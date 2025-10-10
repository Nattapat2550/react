// React Index Page
(function(){
  if (!document.getElementById('app')) return;
  function IndexPage(){
    return React.createElement('div', {},
      React.createElement('h1', null, 'Welcome'),
      React.createElement('p', null, 'This is a public landing page. Please register or login to continue.'),
      React.createElement('div', { className:'actions' },
        React.createElement('a', { className:'btn', href:'register.html' }, 'Register'),
        React.createElement('a', { className:'btn', href:'login.html' }, 'Login')
      )
    );
  }
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(React.createElement(IndexPage));
})();
