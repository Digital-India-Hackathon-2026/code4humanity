(function(){

  /* ---------------------------------------------------------
     Typewriter (preserved)
  --------------------------------------------------------- */
  const fullText = "Find Blood & Organ Donors the Moment Someone Needs Them Most";
  const darkLen = 45;
  const el = document.getElementById('typewriter');
  let i = 0;
  function renderTyped(){
    const shown = fullText.slice(0, i);
    const darkPart = shown.slice(0, darkLen);
    const redPart = shown.slice(darkLen);
    el.innerHTML =
      '<span style="color:#14060A">' + darkPart + '</span>' +
      '<span style="color:#C0122F">' + redPart + '</span>' +
      '<span class="cursor"></span>';
  }
  function typeStep(){
    if(i <= fullText.length){ renderTyped(); i++; setTimeout(typeStep, 35); }
  }
  setTimeout(typeStep, 400);

  /* ---------------------------------------------------------
     Center count-up (preserved)
  --------------------------------------------------------- */
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function countUp(){
    const target = 42, duration = 2000, start = performance.now();
    const countEl = document.getElementById('countUp');
    function frame(now){
      const p = Math.min((now - start) / duration, 1);
      const val = Math.floor(easeOutCubic(p) * target);
      countEl.textContent = val + 'k+';
      if(p < 1) requestAnimationFrame(frame); else countEl.textContent = target + 'k+';
    }
    requestAnimationFrame(frame);
  }
  setTimeout(countUp, 1200);

  /* ---------------------------------------------------------
     Impact stats strip count-up (preserved, IntersectionObserver)
  --------------------------------------------------------- */
  function formatNumber(n){ return n.toLocaleString('en-US'); }
  function animateStat(elm, targetOverride, suffixOverride){
    const target = targetOverride !== undefined ? targetOverride : parseInt(elm.dataset.target, 10);
    const suffix = suffixOverride !== undefined ? suffixOverride : (elm.dataset.suffix || '');
    const duration = 1800, start = performance.now();
    function frame(now){
      const p = Math.min((now - start) / duration, 1);
      const val = Math.floor(easeOutCubic(p) * target);
      elm.textContent = formatNumber(val) + suffix;
      if(p < 1) requestAnimationFrame(frame); else elm.textContent = formatNumber(target) + suffix;
    }
    requestAnimationFrame(frame);
  }
  const statEls = document.querySelectorAll('.stats-strip .stat-number');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ animateStat(entry.target); statsObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.4 });
  statEls.forEach(elm => statsObserver.observe(elm));

  // section 1 big-num counters
  const bigNums = document.querySelectorAll('.big-num[data-count]');
  const bigNumObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animateStat(entry.target, parseInt(entry.target.dataset.count, 10), '');
        bigNumObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bigNums.forEach(elm => bigNumObserver.observe(elm));

  /* ---------------------------------------------------------
     HUMAN LIFE NETWORK — hero animation
  --------------------------------------------------------- */
  const STAGE_SIZE = 720; // matches .hero-right css box
  const CENTER = STAGE_SIZE / 2;

  const organs = [
    { icon:'🩸', name:'Blood Bank', status:'available', ring:1, angle:270 },
    { icon:'🫁', name:'Lungs',      status:'available', ring:2, angle:40  },
    { icon:'🧠', name:'Brain',      status:'available', ring:2, angle:160 },
    { icon:'👁️', name:'Eye',        status:'available', ring:2, angle:280 },
    { icon:'🫀', name:'Liver',      status:'low',       ring:3, angle:60  },
    { icon:'🫘', name:'Kidney',     status:'available', ring:3, angle:180 },
    { icon:'🦴', name:'Bone Marrow',status:'low',       ring:3, angle:300 },
    { icon:'🫃', name:'Pancreas',   status:'available', ring:4, angle:90  }
  ];

  const ringRadius = { 1:176, 2:250, 3:324, 4:398 };

  const organOrbit = document.getElementById('organOrbit');
  const connectorsSvg = document.getElementById('connectorsSvg');
  const svgNS = 'http://www.w3.org/2000/svg';
  const CSVG_CENTER = 360;

  const panelData = {
    'Blood Bank':   { icon:'🩸', donors: 214, hospitals: 38 },
    'Lungs':        { icon:'🫁', donors: 12,  hospitals: 9  },
    'Brain':        { icon:'🧠', donors: 0,   hospitals: 4  },
    'Eye':          { icon:'👁️', donors: 46,  hospitals: 21 },
    'Liver':        { icon:'🫀', donors: 7,   hospitals: 12 },
    'Kidney':       { icon:'🫘', donors: 63,  hospitals: 27 },
    'Bone Marrow':  { icon:'🦴', donors: 9,   hospitals: 6  },
    'Pancreas':     { icon:'🫃', donors: 18,  hospitals: 8  }
  };

  const overlay = document.getElementById('organPanelOverlay');
  const panelIcon = document.getElementById('panelIcon');
  const panelName = document.getElementById('panelOrganName');
  const panelDonors = document.getElementById('panelDonors');
  const panelHospitals = document.getElementById('panelHospitals');
  const panelClose = document.getElementById('panelClose');

  function openPanel(organName){
    const d = panelData[organName] || { icon:'🫀', donors:'—', hospitals:'—' };
    panelIcon.textContent = d.icon;
    panelName.textContent = organName.replace(' (R)','');
    panelDonors.textContent = d.donors;
    panelHospitals.textContent = d.hospitals;
    overlay.classList.add('open');
  }
  function closePanel(){ overlay.classList.remove('open'); }
  panelClose.addEventListener('click', closePanel);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closePanel(); });

  const connectorPaths = [];
  organs.forEach((o, idx) => {
    const rad = ringRadius[o.ring];
    const angleRad = (o.angle - 90) * Math.PI / 180;
    const x = CSVG_CENTER + rad * Math.cos(angleRad);
    const y = CSVG_CENTER + rad * Math.sin(angleRad);
    const midX = CSVG_CENTER + (rad * 0.55) * Math.cos(angleRad - 0.15);
    const midY = CSVG_CENTER + (rad * 0.55) * Math.sin(angleRad - 0.15);
    const d = `M${CSVG_CENTER},${CSVG_CENTER} Q${midX},${midY} ${x},${y}`;

    const basePath = document.createElementNS(svgNS, 'path');
    basePath.setAttribute('class', 'connector-path');
    basePath.setAttribute('d', d);
    basePath.dataset.organIdx = idx;
    connectorsSvg.appendChild(basePath);
    connectorPaths.push({ path: basePath, length: basePath.getTotalLength(), organIdx: idx });

    const particle = document.createElementNS(svgNS, 'circle');
    particle.setAttribute('r', 3.4);
    particle.setAttribute('class', 'blood-particle');
    connectorsSvg.appendChild(particle);
    connectorPaths[connectorPaths.length - 1].particle = particle;
    connectorPaths[connectorPaths.length - 1].offset = Math.random();
    connectorPaths[connectorPaths.length - 1].speed = 0.00022 + Math.random() * 0.00012;
  });

  organs.forEach((o, idx) => {
    const rad = ringRadius[o.ring];
    const angleRad = (o.angle - 90) * Math.PI / 180;
    const dx = rad * Math.cos(angleRad);
    const dy = rad * Math.sin(angleRad);

    const card = document.createElement('button');
    card.className = 'organ-card' + (o.status === 'low' ? ' low' : '');
    card.style.left = dx + 'px';
    card.style.top = dy + 'px';
    card.setAttribute('data-organ-idx', idx);
    card.setAttribute('type', 'button');
    card.innerHTML = `
      <span class="card-enter" style="animation-delay:${(0.5 + idx * 0.12)}s">
        <span class="float-inner">
          <span class="icon-wrap">${o.icon}</span>
          <span class="organ-name">${o.name}</span>
          <span class="status-dot-row">
            <span class="status-dot"></span>
            <span class="status-text">${o.status === 'low' ? 'Low' : 'Available'}</span>
          </span>
        </span>
      </span>
    `;

    card.addEventListener('click', () => openPanel(o.name));
    card.addEventListener('mouseenter', () => setConnectorLit(idx, true));
    card.addEventListener('mouseleave', () => setConnectorLit(idx, false));
    card.addEventListener('focus', () => setConnectorLit(idx, true));
    card.addEventListener('blur', () => setConnectorLit(idx, false));

    organOrbit.appendChild(card);
  });

  function setConnectorLit(idx, lit){
    const conn = connectorPaths[idx];
    if(!conn) return;
    conn.path.classList.toggle('lit', lit);
    conn.lit = lit;
  }

  const vesselPaths = document.querySelectorAll('.vessel-path');

  let lastTs = performance.now();
  function animateParticles(ts){
    const dt = ts - lastTs; lastTs = ts;
    connectorPaths.forEach(conn => {
      const speed = conn.lit ? conn.speed * 3.2 : conn.speed;
      conn.offset = (conn.offset + speed * dt) % 1;
      const pt = conn.path.getPointAtLength(conn.offset * conn.length);
      conn.particle.setAttribute('cx', pt.x);
      conn.particle.setAttribute('cy', pt.y);
      conn.particle.setAttribute('r', conn.lit ? 5 : 3.4);
    });
    requestAnimationFrame(animateParticles);
  }
  requestAnimationFrame(animateParticles);

  function ambientGlow(){
    const ring = vesselPaths[Math.floor(Math.random() * vesselPaths.length)];
    ring.classList.add('lit');
    setTimeout(() => ring.classList.remove('lit'), 900);
    setTimeout(ambientGlow, 1400 + Math.random() * 1400);
  }
  setTimeout(ambientGlow, 2000);

  /* ---------------------------------------------------------
     Mouse parallax for hero network
  --------------------------------------------------------- */
  const stage = document.getElementById('lifeNetwork');
  const parallaxLayer = document.getElementById('networkParallax');
  const coreWrap = document.getElementById('coreWrap');
  let targetX = 0, targetY = 0, curX = 0, curY = 0;

  if(window.matchMedia('(pointer:fine)').matches){
    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = relX; targetY = relY;
    });
    stage.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

    function parallaxLoop(){
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      parallaxLayer.style.transform = `translate(${curX * 16}px, ${curY * 16}px)`;
      coreWrap.style.transform = `translate(-50%,-50%) rotate(${curX * 2}deg)`;
      requestAnimationFrame(parallaxLoop);
    }
    requestAnimationFrame(parallaxLoop);
  }

  /* ---------------------------------------------------------
     Scroll reveal for all sections
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(elm => revealObserver.observe(elm));

  const timelineSteps = document.querySelectorAll('.timeline-step');
  const timelineProgress = document.getElementById('timelineProgress');
  let maxStepReached = -1;
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = Array.from(timelineSteps).indexOf(entry.target);
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        if(idx > maxStepReached){
          maxStepReached = idx;
          const pct = ((idx + 1) / timelineSteps.length) * 1000;
          timelineProgress.setAttribute('x2', pct);
        }
      }
    });
  }, { threshold: 0.5 });
  timelineSteps.forEach(elm => timelineObserver.observe(elm));

  const matchRings = document.querySelectorAll('.match-ring .fgc');
  const matchObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const circle = entry.target;
        const pct = parseInt(circle.dataset.pct, 10);
        const circumference = 150.8;
        const offset = circumference - (pct / 100) * circumference;
        requestAnimationFrame(() => { circle.style.strokeDashoffset = offset; });
        matchObserver.unobserve(circle);
      }
    });
  }, { threshold: 0.4 });
  matchRings.forEach(elm => matchObserver.observe(elm));

  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });

  const testimonials = [
    { quote:"I registered on a Tuesday and by Friday I'd donated a kidney to someone I'd never met. The matching process felt careful, not rushed.", name:'Maya R.', role:'Kidney Donor' },
    { quote:"My son needed O-negative blood at 2am. LifeLink found three compatible donors within fifteen minutes.", name:'David K.', role:'Recipient Family' },
    { quote:"As a hospital coordinator, the verification layer means I trust every request that comes through the network.", name:'Dr. Amina T.', role:'Transplant Coordinator' },
    { quote:"Donating became a habit once I saw how directly it connected to someone's recovery timeline.", name:'Leo Fontaine', role:'Regular Blood Donor' },
    { quote:"The waiting list transparency gave our family real answers instead of guesswork.", name:'Priya N.', role:'Liver Recipient Family' },
    { quote:"Six hospitals, one shared system — LifeLink cut our average match time nearly in half.", name:'Dr. Samuel O.', role:'Hospital Director' }
  ];
  const testiTrack = document.getElementById('testiTrack');
  function buildTestiCard(t){
    const card = document.createElement('div');
    card.className = 'testi-card';
    const initials = t.name.split(' ').map(w => w[0]).join('').slice(0,2);
    card.innerHTML = `
      <p class="testi-quote">"${t.quote}"</p>
      <div class="testi-person">
        <div class="testi-avatar">${initials}</div>
        <div>
          <div class="testi-name">${t.name}</div>
          <div class="testi-role">${t.role}</div>
        </div>
      </div>
    `;
    return card;
  }
  testimonials.concat(testimonials).forEach(t => testiTrack.appendChild(buildTestiCard(t)));

  /* ===========================================================
     ================  LIFELINK BACKEND WIRING  =================
     =========================================================== */

  // ---------- helpers ----------
  function showMsg(elId, text, isError){
    const el = document.getElementById(elId);
    el.textContent = text;
    el.className = 'll-msg ' + (isError ? 'error' : 'success');
  }
  function clearMsg(elId){
    const el = document.getElementById(elId);
    el.textContent = ''; el.className = 'll-msg';
  }
  function openModal(id){ document.getElementById(id).classList.add('open'); }
  function closeModal(id){ document.getElementById(id).classList.remove('open'); }
  function getBrowserLocation(){
    return new Promise((resolve, reject) => {
      if(!navigator.geolocation){ reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy:true, timeout:10000 }
      );
    });
  }

  let currentUser = null;

  async function refreshAuthUI(){
    const { data: { user } } = await sb.auth.getUser();
    currentUser = user;
    const headerRight = document.getElementById('headerRight');
    if(user){
      // prefer the name given at signup (available immediately, no DB round-trip needed),
      // then the profiles table, and only fall back to the email's local part — never the raw email.
      let name = (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split('@')[0] : 'there');
      let role = 'donor';
      let donationCount = 0;
      try{
        const { data: profile } = await sb.from('profiles').select('full_name, role').eq('id', user.id).single();
        if(profile && profile.full_name) name = profile.full_name;
        if(profile && profile.role) role = profile.role;
      }catch(e){}
      try{
        const { count } = await sb.from('donations').select('id', { count: 'exact', head: true }).eq('donor_id', user.id);
        donationCount = count || 0;
      }catch(e){}

      const streakHtml = donationCount > 0
        ? `<span class="streak-badge"><span class="flame">🔥</span>${donationCount} donation${donationCount === 1 ? '' : 's'}</span>`
        : '';
      const dashHtml = (role === 'admin' || role === 'hospital')
        ? `<button class="dash-link" id="dashLinkBtn">Dashboard</button>`
        : '';

      headerRight.innerHTML = `
        <div class="ll-userbar">
          ${dashHtml}
          ${streakHtml}
          <span>👋 ${name}</span>
          <button class="ll-logout" id="logoutBtn">Log out</button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        refreshAuthUI();
      });
      const dashBtn = document.getElementById('dashLinkBtn');
      if(dashBtn) dashBtn.addEventListener('click', openDashboard);
    } else {
      headerRight.innerHTML = `
        <a class="login-link" href="#" id="loginLink">Log In</a>
        <div class="btn-border-wrap">
          <button class="btn-join" id="joinBtn">Register Now</button>
        </div>
      `;
      document.getElementById('loginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); openModal('authOverlay'); });
      document.getElementById('joinBtn').addEventListener('click', () => { showRegisterForm(); openModal('authOverlay'); });
    }
  }

  function hideAllAuthForms(){
    ['loginForm','registerForm','forgotForm','resetForm'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    ['loginMsg','registerMsg','forgotMsg','resetMsg'].forEach(clearMsg);
  }
  function showLoginForm(){ hideAllAuthForms(); document.getElementById('loginForm').style.display = 'block'; }
  function showRegisterForm(){ hideAllAuthForms(); document.getElementById('registerForm').style.display = 'block'; }
  function showForgotForm(){ hideAllAuthForms(); document.getElementById('forgotForm').style.display = 'block'; }
  function showResetForm(){ hideAllAuthForms(); document.getElementById('resetForm').style.display = 'block'; }

  // initial wiring for header buttons (before first refreshAuthUI overwrite)
  document.getElementById('loginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); openModal('authOverlay'); });
  document.getElementById('joinBtn').addEventListener('click', () => { showRegisterForm(); openModal('authOverlay'); });
  document.getElementById('registerBtn').addEventListener('click', () => { showRegisterForm(); openModal('authOverlay'); });

  document.getElementById('authClose').addEventListener('click', () => closeModal('authOverlay'));
  document.getElementById('authOverlay').addEventListener('click', (e) => { if(e.target.id === 'authOverlay') closeModal('authOverlay'); });
  document.getElementById('toRegister').addEventListener('click', showRegisterForm);
  document.getElementById('toLogin').addEventListener('click', showLoginForm);
  document.getElementById('toForgot').addEventListener('click', showForgotForm);
  document.getElementById('forgotToLogin').addEventListener('click', showLoginForm);

  // ---------- LOGIN ----------
  document.getElementById('loginSubmit').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if(!email || !password){ showMsg('loginMsg', 'Please enter email and password.', true); return; }
    const btn = document.getElementById('loginSubmit');
    btn.disabled = true; btn.textContent = 'Logging in...';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.textContent = 'Log In';
    if(error){
      if(/email not confirmed/i.test(error.message)){
        const msgEl = document.getElementById('loginMsg');
        msgEl.innerHTML = 'Please confirm your email first. <button id="resendVerifyBtn" style="text-decoration:underline; font-weight:600;">Resend verification email</button>';
        msgEl.className = 'll-msg error';
        document.getElementById('resendVerifyBtn').addEventListener('click', async () => {
          const { error: resendError } = await sb.auth.resend({ type: 'signup', email });
          showMsg('loginMsg', resendError ? resendError.message : 'Verification email resent — check your inbox.', !!resendError);
        });
      } else {
        showMsg('loginMsg', error.message, true);
      }
      return;
    }
    showMsg('loginMsg', 'Logged in successfully!', false);
    showToast('Welcome back — logged in successfully.', false);
    await refreshAuthUI();
    setTimeout(() => closeModal('authOverlay'), 700);
  });

  // ---------- FORGOT PASSWORD ----------
  document.getElementById('forgotSubmit').addEventListener('click', async () => {
    const email = document.getElementById('forgotEmail').value.trim();
    if(!email){ showMsg('forgotMsg', 'Please enter your email.', true); return; }
    const btn = document.getElementById('forgotSubmit');
    btn.disabled = true; btn.textContent = 'Sending...';
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname + '?type=recovery'
    });
    btn.disabled = false; btn.textContent = 'Send Reset Link';
    if(error){ showMsg('forgotMsg', error.message, true); return; }
    showMsg('forgotMsg', 'If that email is registered, a reset link is on its way.', false);
  });

  // ---------- SET NEW PASSWORD (after clicking the emailed recovery link) ----------
  sb.auth.onAuthStateChange((event) => {
    if(event === 'PASSWORD_RECOVERY'){
      showResetForm();
      openModal('authOverlay');
    }
  });

  document.getElementById('resetSubmit').addEventListener('click', async () => {
    const pw = document.getElementById('resetPassword').value;
    const pwConfirm = document.getElementById('resetPasswordConfirm').value;
    if(!pw || pw.length < 6){ showMsg('resetMsg', 'Password must be at least 6 characters.', true); return; }
    if(pw !== pwConfirm){ showMsg('resetMsg', 'Passwords do not match.', true); return; }
    const btn = document.getElementById('resetSubmit');
    btn.disabled = true; btn.textContent = 'Updating...';
    const { error } = await sb.auth.updateUser({ password: pw });
    btn.disabled = false; btn.textContent = 'Update Password';
    if(error){ showMsg('resetMsg', error.message, true); return; }
    showMsg('resetMsg', 'Password updated! You are now logged in.', false);
    await refreshAuthUI();
    setTimeout(() => closeModal('authOverlay'), 1200);
  });

  // ---------- REGISTER ----------
  document.getElementById('registerSubmit').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    const bloodGroup = document.getElementById('regBloodGroup').value;
    const isOrganDonor = document.getElementById('regOrganDonor').checked;

    if(!name || !email || !password){ showMsg('registerMsg', 'Name, email and password are required.', true); return; }
    if(password.length < 6){ showMsg('registerMsg', 'Password must be at least 6 characters.', true); return; }

    const btn = document.getElementById('registerSubmit');
    btn.disabled = true; btn.textContent = 'Creating account...';

    // Profile row is created automatically by a database trigger (handle_new_user)
    // reading this metadata off auth.users — works even when email confirmation
    // is required and there is no active session yet.
    const { data: signUpData, error: signUpError } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, phone: phone, blood_group: bloodGroup, is_organ_donor: isOrganDonor, role: 'donor' } }
    });
    if(signUpError){
      btn.disabled = false; btn.textContent = 'Create Account';
      showMsg('registerMsg', signUpError.message, true);
      return;
    }

    // If a session exists immediately (e.g. email confirmation is disabled),
    // opportunistically save GPS location onto the profile the trigger just created.
    if(signUpData.session){
      try{
        const loc = await getBrowserLocation();
        await sb.from('profiles').update({ location: `POINT(${loc.lng} ${loc.lat})` }).eq('id', signUpData.session.user.id);
      }catch(e){ /* location denied or unavailable — continue without it */ }
    }

    btn.disabled = false; btn.textContent = 'Create Account';
    if(signUpData.session){
      showMsg('registerMsg', 'Account created! Logging you in...', false);
      showToast('Account created — welcome to LifeLink!', false);
      await refreshAuthUI();
      setTimeout(() => closeModal('authOverlay'), 900);
    } else {
      showMsg('registerMsg', 'Account created! Check your email to confirm, then log in.', false);
      showToast('Account created — check your email to confirm.', false);
      setTimeout(() => { showLoginForm(); }, 1600);
    }
  });

  // ---------- SEARCH AVAILABILITY ----------
  document.getElementById('startBtn').addEventListener('click', () => {
    clearMsg('searchMsg');
    document.getElementById('searchResults').innerHTML = '';
    openModal('searchOverlay');
  });
  document.getElementById('searchClose').addEventListener('click', () => closeModal('searchOverlay'));
  document.getElementById('searchOverlay').addEventListener('click', (e) => { if(e.target.id === 'searchOverlay') closeModal('searchOverlay'); });

  document.getElementById('searchSubmit').addEventListener('click', async () => {
    const bloodGroup = document.getElementById('searchBloodGroup').value;
    const resultsEl = document.getElementById('searchResults');
    resultsEl.innerHTML = '';
    clearMsg('searchMsg');

    const btn = document.getElementById('searchSubmit');
    btn.disabled = true; btn.textContent = 'Locating you...';

    let loc;
    try{
      loc = await getBrowserLocation();
    }catch(e){
      btn.disabled = false; btn.textContent = 'Search Nearby Donors';
      showMsg('searchMsg', 'Location access is needed to search nearby donors. Please allow location access.', true);
      return;
    }

    btn.textContent = 'Searching...';
    resultsEl.innerHTML = `
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    `;

    // No manual radius — just look for the closest verified donors, quietly
    // widening the search area if nothing turns up nearby at first.
    const SEARCH_RADII_KM = [15, 50, 200];
    let data = null, error = null;
    for(const radius_km of SEARCH_RADII_KM){
      const res = await sb.rpc('nearby_donors', {
        target_blood_group: bloodGroup,
        lat: loc.lat,
        lng: loc.lng,
        radius_km
      });
      data = res.data; error = res.error;
      if(error) break;
      if(data && data.length > 0) break;
    }

    btn.disabled = false; btn.textContent = 'Search Nearby Donors';
    resultsEl.innerHTML = '';

    if(error){ showMsg('searchMsg', error.message, true); showToast('Search failed: ' + error.message, true); return; }
    if(!data || data.length === 0){
      showMsg('searchMsg', `No verified ${bloodGroup} donors found near you yet.`, true);
      return;
    }
    showMsg('searchMsg', `Found ${data.length} donor(s) near you.`, false);
    showToast(`Found ${data.length} nearby ${bloodGroup} donor(s).`, false);

    // plot matches on the live map alongside hospitals
    const donorPoints = [{ type: 'you', lat: loc.lat, lng: loc.lng, label: 'You are here' }];
    data.forEach(d => {
      if(d.donor_lat && d.donor_lng) donorPoints.push({ type: 'donor', lat: d.donor_lat, lng: d.donor_lng, label: d.full_name, sub: `${d.blood_group} · ${d.distance_km.toFixed(1)}km away` });
    });
    if(liveMap){ initMap(loc.lat, loc.lng); liveMap.setView([loc.lat, loc.lng], 12); plotOnMap(donorPoints); }

    data.forEach(donor => {
      const row = document.createElement('div');
      row.className = 'll-result-row';
      row.innerHTML = `<span><b>${donor.full_name}</b></span><span>${donor.distance_km.toFixed(1)} km</span>`;
      resultsEl.appendChild(row);
    });
  });

  // ---------- EMERGENCY SOS ----------
  function openSosModal(){
    if(!currentUser){
      showLoginForm(); openModal('authOverlay');
      return;
    }
    clearMsg('sosMsg');
    openModal('sosOverlay');
  }
  document.getElementById('sosBtn').addEventListener('click', function(){
    this.style.transform = 'scale(0.94)';
    setTimeout(() => { this.style.transform = ''; }, 180);
    openSosModal();
  });
  document.getElementById('emergencyReqBtn').addEventListener('click', openSosModal);

  document.getElementById('sosClose').addEventListener('click', () => closeModal('sosOverlay'));
  document.getElementById('sosOverlay').addEventListener('click', (e) => { if(e.target.id === 'sosOverlay') closeModal('sosOverlay'); });

  document.getElementById('sosType').addEventListener('change', (e) => {
    const isBlood = e.target.value === 'blood';
    document.getElementById('sosBloodGroupField').style.display = isBlood ? 'block' : 'none';
    document.getElementById('sosOrganField').style.display = isBlood ? 'none' : 'block';
  });

  document.getElementById('sosSubmit').addEventListener('click', async () => {
    if(!currentUser){ showMsg('sosMsg', 'Please log in first.', true); return; }
    const btn = document.getElementById('sosSubmit');
    btn.disabled = true; btn.textContent = 'Locating you...';

    let loc;
    try{
      loc = await getBrowserLocation();
    }catch(e){
      btn.disabled = false; btn.textContent = 'Send Emergency Alert';
      showMsg('sosMsg', 'Location access is required to send an SOS alert.', true);
      return;
    }

    const type = document.getElementById('sosType').value;
    const urgency = document.getElementById('sosUrgency').value;
    const bloodGroup = type === 'blood' ? document.getElementById('sosBloodGroup').value : null;
    const organType = type === 'organ' ? document.getElementById('sosOrganType').value : null;
    const locationPoint = `POINT(${loc.lng} ${loc.lat})`;

    btn.textContent = 'Sending alert...';

    const { data: request, error: reqError } = await sb.from('requests').insert({
      requester_id: currentUser.id,
      request_type: type,
      blood_group: bloodGroup,
      organ_type: organType,
      urgency: urgency,
      location: locationPoint
    }).select().single();

    if(reqError){
      btn.disabled = false; btn.textContent = 'Send Emergency Alert';
      showMsg('sosMsg', reqError.message, true);
      return;
    }

    const { error: alertError } = await sb.from('emergency_alerts').insert({
      request_id: request.id,
      triggered_by: currentUser.id,
      radius_km: 10
    });

    btn.disabled = false; btn.textContent = 'Send Emergency Alert';

    if(alertError){
      showMsg('sosMsg', 'Request created, but alert broadcast failed: ' + alertError.message, true);
      showToast('Alert broadcast failed: ' + alertError.message, true);
      return;
    }

    showMsg('sosMsg', 'Emergency alert sent! Nearby verified donors are being notified.', false);
    showToast('Emergency alert sent — nearby donors are being notified.', false);
    addTickerItem('🚨 Your alert was broadcast', `${urgency} · ${type === 'blood' ? bloodGroup : organType} · just now`);
    setTimeout(() => closeModal('sosOverlay'), 1800);
  });

  // ---------- clicking a blood-group card opens Search modal pre-filled ----------
  document.querySelectorAll('.blood-card').forEach(card => {
    card.addEventListener('click', () => {
      const bg = card.dataset.bg;
      document.getElementById('searchBloodGroup').value = bg;
      document.getElementById('searchResults').innerHTML = '';
      clearMsg('searchMsg');
      openModal('searchOverlay');
    });
  });

  // ---------- TOASTS ----------
  function showToast(text, isError){
    const stack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = 'toast ' + (isError ? 'error' : 'success');
    el.innerHTML = `<span class="toast-dot"></span><span>${text}</span><span class="toast-close">✕</span>`;
    stack.appendChild(el);
    const remove = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 280); };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 5000);
  }

  // ---------- LIVE MAP ----------
  let liveMap = null;
  let mapMarkers = [];
  function initMap(centerLat, centerLng){
    if(liveMap) return;
    liveMap = L.map('liveMap').setView([centerLat, centerLng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
    }).addTo(liveMap);
  }
  function clearMapMarkers(){
    mapMarkers.forEach(m => liveMap.removeLayer(m));
    mapMarkers = [];
  }
  function plotOnMap(points){
    if(!liveMap) return;
    clearMapMarkers();
    points.forEach(pt => {
      const marker = L.circleMarker([pt.lat, pt.lng], {
        radius: 8,
        color: pt.type === 'hospital' ? '#7A0019' : '#C0122F',
        fillColor: pt.type === 'hospital' ? '#7A0019' : '#C0122F',
        fillOpacity: 0.85, weight: 2
      }).bindPopup(`<b>${pt.label}</b>${pt.sub ? '<br>' + pt.sub : ''}`);
      marker.addTo(liveMap);
      mapMarkers.push(marker);
    });
  }
  async function refreshLiveMap(){
    const hintEl = document.getElementById('mapHint');
    let loc;
    try{
      loc = await getBrowserLocation();
      hintEl.style.display = 'none';
    }catch(e){
      loc = { lat: 20.5937, lng: 78.9629 }; // fallback: broad default center
      hintEl.textContent = 'Location unavailable — showing default view';
    }
    initMap(loc.lat, loc.lng);
    liveMap.setView([loc.lat, loc.lng], 12);

    const points = [{ type: 'you', lat: loc.lat, lng: loc.lng, label: 'You are here' }];

    try{
      const { data: hospitals } = await sb.rpc('nearby_hospitals', { lat: loc.lat, lng: loc.lng, radius_km: 25 });
      (hospitals || []).forEach(h => {
        if(h.hosp_lat && h.hosp_lng) points.push({ type: 'hospital', lat: h.hosp_lat, lng: h.hosp_lng, label: h.name, sub: h.category || '' });
      });
    }catch(e){ /* nearby_hospitals may not exist yet if schema.sql hasn't been run — fail quietly */ }

    plotOnMap(points);
  }
  document.getElementById('mapRefreshBtn').addEventListener('click', refreshLiveMap);

  // ---------- REAL-TIME SOS TICKER ----------
  function addTickerItem(text, sub){
    const list = document.getElementById('tickerList');
    const empty = list.querySelector('.ticker-empty');
    if(empty) empty.remove();
    const row = document.createElement('div');
    row.className = 'ticker-item';
    row.innerHTML = `<span><b>${text}</b></span><span>${sub}</span>`;
    list.prepend(row);
    while(list.children.length > 8) list.removeChild(list.lastChild);
  }
  function subscribeSosTicker(){
    sb.channel('emergency_alerts_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergency_alerts' }, payload => {
        addTickerItem('🚨 New emergency alert', `radius ${payload.new.radius_km}km · just now`);
      })
      .subscribe();
  }

  // ---------- HOSPITAL / ADMIN DASHBOARD ----------
  async function openDashboard(){
    openModal2('dashOverlay');
    const tbody = document.getElementById('dashTableBody');
    const emptyEl = document.getElementById('dashEmpty');
    tbody.innerHTML = '';
    emptyEl.style.display = 'none';

    const { data: requests, error } = await sb
      .from('requests')
      .select('id, request_type, blood_group, organ_type, urgency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if(error || !requests || requests.length === 0){
      emptyEl.style.display = 'block';
      return;
    }

    requests.forEach(r => {
      const tr = document.createElement('tr');
      const need = r.request_type === 'blood' ? (r.blood_group || '—') : (r.organ_type || '—');
      const when = new Date(r.created_at).toLocaleString();
      tr.innerHTML = `
        <td>${r.request_type}</td>
        <td>${need}</td>
        <td>${r.urgency}</td>
        <td>${when}</td>
        <td>
          <select class="dash-status-select" data-id="${r.id}">
            ${['open','matched','fulfilled','cancelled','expired'].map(s => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.dash-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        const { error: updateError } = await sb.from('requests').update({ status }).eq('id', id);
        showToast(updateError ? 'Failed to update status: ' + updateError.message : 'Request status updated.', !!updateError);
      });
    });
  }
  // small alias so the dashboard overlay (a plain div, not .ll-modal-overlay) can reuse open/close styling
  function openModal2(id){ document.getElementById(id).classList.add('open'); }
  document.getElementById('dashClose').addEventListener('click', () => document.getElementById('dashOverlay').classList.remove('open'));
  document.getElementById('dashOverlay').addEventListener('click', (e) => { if(e.target.id === 'dashOverlay') e.target.classList.remove('open'); });

  // ---------- init ----------
  refreshAuthUI();
  subscribeSosTicker();
  refreshLiveMap();

})();
