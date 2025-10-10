// Minimal React "activation" without changing any existing DOM behavior/structure.
// It will mount a Fragment into <main id="app"> if present, otherwise no-op.
(function(){
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') return;
  const rootNode = document.getElementById('app') || document.querySelector('main');
  if (!rootNode) return;
  try {
    const root = ReactDOM.createRoot ? ReactDOM.createRoot(rootNode) : null;
    if (root) { root.render(React.createElement(React.Fragment, null)); }
  } catch(e){ /* no-op */ }
})();
