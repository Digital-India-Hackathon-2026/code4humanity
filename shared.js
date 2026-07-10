/* =====================================================
   LifeLink — shared.js
   Common behaviour reused across the sub-pages:
   scroll reveal, toasts, modal helpers, FAQ accordion,
   and a tiny localStorage "database" so forms actually
   persist data between visits (no backend required).
   ===================================================== */

/* ---------- SCROLL REVEAL ---------- */
(function initReveal(){
  const revealEls = document.querySelectorAll('.reveal');
  if(!revealEls.length) return;
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));
})();

/* ---------- COUNT-UP NUMBERS (elements with data-count) ---------- */
(function initCountUp(){
  const nums = document.querySelectorAll('[data-count]');
  if(!nums.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10) || 0;
      const dur = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  nums.forEach(el => obs.observe(el));
})();

/* ---------- TOASTS ---------- */
function showToast(text, isError){
  const stack = document.getElementById('toastStack');
  if(!stack) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (isError ? 'error' : 'success');
  el.innerHTML = `<span class="toast-dot"></span><span>${text}</span><span class="toast-close">✕</span>`;
  stack.appendChild(el);
  const remove = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 280); };
  el.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 5000);
}

/* ---------- LOGIN / REGISTER MODAL (shared across pages) ---------- */
function openModal(id){
  const overlay = document.getElementById(id);
  if(overlay) overlay.classList.add('open');
}
function closeModal(id){
  const overlay = document.getElementById(id);
  if(overlay) overlay.classList.remove('open');
}
(function wireAuthModal(){
  const authOverlay = document.getElementById('authOverlay');
  if(!authOverlay) return;
  const loginLink = document.getElementById('loginLink');
  const joinBtn = document.getElementById('joinBtn');
  const authClose = document.getElementById('authClose');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toRegister = document.getElementById('toRegister');
  const toLogin = document.getElementById('toLogin');

  if(loginLink) loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    if(loginForm) loginForm.style.display = 'block';
    if(registerForm) registerForm.style.display = 'none';
    openModal('authOverlay');
  });
  if(joinBtn) joinBtn.addEventListener('click', () => {
    if(loginForm) loginForm.style.display = 'none';
    if(registerForm) registerForm.style.display = 'block';
    openModal('authOverlay');
  });
  if(authClose) authClose.addEventListener('click', () => closeModal('authOverlay'));
  if(authOverlay) authOverlay.addEventListener('click', (e) => { if(e.target === authOverlay) closeModal('authOverlay'); });
  if(toRegister) toRegister.addEventListener('click', () => { loginForm.style.display='none'; registerForm.style.display='block'; });
  if(toLogin) toLogin.addEventListener('click', () => { registerForm.style.display='none'; loginForm.style.display='block'; });

  const registerSubmit = document.getElementById('registerSubmit');
  if(registerSubmit) registerSubmit.addEventListener('click', () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const msg = document.getElementById('registerMsg');
    if(!name || !email){ if(msg) msg.textContent = 'Please fill in your name and email.'; return; }
    if(msg) msg.textContent = '';
    showToast('Account created — welcome to LifeLink!');
    closeModal('authOverlay');
  });

  const loginSubmit = document.getElementById('loginSubmit');
  if(loginSubmit) loginSubmit.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const msg = document.getElementById('loginMsg');
    if(!email){ if(msg) msg.textContent = 'Please enter your email.'; return; }
    if(msg) msg.textContent = '';
    showToast('Logged in successfully.');
    closeModal('authOverlay');
  });
})();

/* ---------- FAQ ACCORDION ---------- */
(function initFaq(){
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });
})();

/* ---------- TINY LOCAL "DATABASE" ----------
   Stores form submissions in localStorage so registering
   as a donor / partner hospital actually persists and can
   be listed back on the page. Purely client-side demo data. */
const LifeLinkDB = {
  _read(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch(e){ return []; }
  },
  _write(key, arr){
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){}
  },
  add(key, record){
    const arr = this._read(key);
    record.id = Date.now() + '-' + Math.random().toString(36).slice(2,7);
    record.createdAt = new Date().toISOString();
    arr.unshift(record);
    this._write(key, arr);
    return record;
  },
  all(key){ return this._read(key); },
  count(key){ return this._read(key).length; }
};

/* ---------- GENERIC FORM VALIDATION HELPER ---------- */
function validateFields(fields){
  for(const f of fields){
    const el = document.getElementById(f.id);
    if(!el) continue;
    const val = (el.value || '').trim();
    if(f.required && !val) return `Please fill in "${f.label}".`;
    if(f.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return `Please enter a valid email for "${f.label}".`;
    if(f.phone && val && !/^[0-9+\-\s()]{7,16}$/.test(val)) return `Please enter a valid phone number for "${f.label}".`;
    if(f.min !== undefined && val && Number(val) < f.min) return `"${f.label}" must be at least ${f.min}.`;
  }
  return null;
}

function fmtDate(iso){
  try {
    return new Date(iso).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  } catch(e){ return ''; }
}
