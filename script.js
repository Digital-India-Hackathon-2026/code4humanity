  const sb = window.sb;
(function(){

  const DEMO_FIRST_NAMES = ['Aarav','Vihaan','Aditya','Ishaan','Kabir','Reyansh','Arjun','Sai','Rohan','Karthik','Priya','Ananya','Diya','Isha','Meera','Kavya','Riya','Sneha','Pooja','Neha','Varun','Nikhil','Sanjana','Divya'];
  const DEMO_LAST_NAMES = ['Reddy','Rao','Sharma','Gupta','Kumar','Patel','Nair','Iyer','Chandra','Verma','Naidu','Prasad','Menon','Pillai','Choudhary','Reddy Gari','Goud'];
  const DEMO_BLOOD_GROUPS = ['O+','O+','O+','O+','A+','A+','A+','B+','B+','B+','AB+','O-','O-','A-','B-','AB-'];
  const DEMO_HOSPITAL_NAMES = ['Apollo Health Center','Care Multispeciality Hospital','Continental Hospital','Sunrise Health Center','Yashoda Hospitals','KIMS Hospital'];
  const DEMO_BLOODBANK_NAMES = ['Red Cross Blood Bank','City Central Blood Bank','LifeLink Community Blood Bank','St. Mary Blood Bank'];

  function demoRandomName(){
    const f = DEMO_FIRST_NAMES[Math.floor(Math.random() * DEMO_FIRST_NAMES.length)];
    const l = DEMO_LAST_NAMES[Math.floor(Math.random() * DEMO_LAST_NAMES.length)];
    return `${f} ${l}`;
  }

  function haversineKm(lat1, lng1, lat2, lng2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function demoJitterPoint(lat, lng, maxKm){
    const distKm = Math.random() * maxKm;
    const angle = Math.random() * 2 * Math.PI;
    const dLat = (distKm / 111) * Math.cos(angle);
    const dLng = (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    return { lat: lat + dLat, lng: lng + dLng };
  }

  function generateDemoDonors(lat, lng, bloodGroup, count){
    count = count || (5 + Math.floor(Math.random() * 4)); // 5-8 donors
    const donors = [];
    for(let i = 0; i < count; i++){
      const pt = demoJitterPoint(lat, lng, 20); // within ~20km
      const group = bloodGroup || DEMO_BLOOD_GROUPS[Math.floor(Math.random() * DEMO_BLOOD_GROUPS.length)];
      donors.push({
        full_name: demoRandomName(),
        blood_group: group,
        donor_lat: pt.lat,
        donor_lng: pt.lng,
        distance_km: haversineKm(lat, lng, pt.lat, pt.lng),
        demo: true,
      });
    }
    return donors;
  }

  function generateDemoFacilities(lat, lng){
    const points = [];
    DEMO_HOSPITAL_NAMES.slice(0, 3 + Math.floor(Math.random() * 2)).forEach(name => {
      const pt = demoJitterPoint(lat, lng, 14);
      points.push({ type: 'hospital', lat: pt.lat, lng: pt.lng, label: name, sub: 'Health Center', demo: true });
    });
    DEMO_BLOODBANK_NAMES.slice(0, 2 + Math.floor(Math.random() * 2)).forEach(name => {
      const pt = demoJitterPoint(lat, lng, 14);
      points.push({ type: 'bloodbank', lat: pt.lat, lng: pt.lng, label: name, sub: 'Blood Bank', demo: true });
    });
    return points;
  }

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

  const STAGE_SIZE = 720; // matches .hero-right css box
  const CENTER = STAGE_SIZE / 2;

  const ICON_KIDNEY = `<svg viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.4 3.2c-6.6 0-11.9 5.9-11.9 13.2 0 7.3 5.1 12.8 11.1 12.2 3.2-.3 4.4-2.9 3-5.7-1.5-3-1.3-5.1.4-7.3 1.9-2.4 2.2-6.8-.1-9.9C19.9 4.1 19.2 3.5 18.4 3.2z" fill="#9C3B3B"/><circle cx="21.6" cy="16.4" r="4.3" fill="#FBECEC"/></svg>`;
  const ICON_PANCREAS = `<svg viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.6 17.4c-.5-2.1.9-3.9 3-4.1 2.9-.3 3.9-1.8 6.2-3.2 2.9-1.8 6.8-2.3 9.7-.5 2.5 1.5 3.5 4.3 2.3 6.4-1 1.9-3.3 2.1-4.9 3.1-1.3.8-1 2.8-2.6 3.7-1.8 1-4 .2-4.8-1.6-.5-1.2-1.7-1.4-3.1-1.3-2.4.2-5.3-.4-5.8-2.5z" fill="#D98F63"/></svg>`;

  const organs = [
    { icon:'🩸', name:'Blood Bank', status:'available', ring:1, angle:270 },
    { icon:'🫁', name:'Lungs',      status:'available', ring:2, angle:40  },
    { icon:'🧠', name:'Brain',      status:'available', ring:2, angle:160 },
    { icon:'👁️', name:'Eye',        status:'available', ring:2, angle:280 },
    { icon:'🫀', name:'Liver',      status:'low',       ring:3, angle:60  },
    { icon:ICON_KIDNEY, name:'Kidney',     status:'available', ring:3, angle:180 },
    { icon:'🦴', name:'Bone Marrow',status:'low',       ring:3, angle:300 },
    { icon:ICON_PANCREAS, name:'Pancreas',   status:'available', ring:4, angle:90  }
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
    'Kidney':       { icon:ICON_KIDNEY.replace('width="26" height="26"', 'width="34" height="34"'), donors: 63,  hospitals: 27 },
    'Bone Marrow':  { icon:'🦴', donors: 9,   hospitals: 6  },
    'Pancreas':     { icon:ICON_PANCREAS.replace('width="26" height="26"', 'width="34" height="34"'), donors: 18,  hospitals: 8  }
  };

  const overlay = document.getElementById('organPanelOverlay');
  const panelIcon = document.getElementById('panelIcon');
  const panelName = document.getElementById('panelOrganName');
  const panelDonors = document.getElementById('panelDonors');
  const panelHospitals = document.getElementById('panelHospitals');
  const panelClose = document.getElementById('panelClose');

  function openPanel(organName){
    const d = panelData[organName] || { icon:'🫀', donors:'—', hospitals:'—' };
    panelIcon.innerHTML = d.icon;
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
    { quote:"As a health center coordinator, the verification layer means I trust every request that comes through the network.", name:'Dr. Amina T.', role:'Transplant Coordinator' },
    { quote:"Donating became a habit once I saw how directly it connected to someone's recovery timeline.", name:'Leo Fontaine', role:'Regular Blood Donor' },
    { quote:"The waiting list transparency gave our family real answers instead of guesswork.", name:'Priya N.', role:'Liver Recipient Family' },
    { quote:"Six health centers, one shared system — LifeLink cut our average match time nearly in half.", name:'Dr. Samuel O.', role:'Health Center Director' }
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

  let cachedLocation = null;
  let locationRequestedOnce = false;
  async function getLocationCached(){
    if(cachedLocation) return cachedLocation;
    const loc = await getBrowserLocation();
    cachedLocation = loc;
    return loc;
  }
  async function captureLocationOnce(userId){
    if(locationRequestedOnce) return;
    locationRequestedOnce = true;
    try{
      const loc = await getLocationCached();
      if(userId){
        await sb.from('profiles').update({ location: `POINT(${loc.lng} ${loc.lat})` }).eq('id', userId);
      }
      if(typeof liveMap !== 'undefined' && liveMap) refreshLiveMap(false);
    }catch(e){ /* location denied or unavailable — continue without it */ }
  }

  let currentUser = null;
  let currentUserDoctorVerified = false; // gates visibility of other donors' phone/email

  async function refreshAuthUI(){
    const { data: { user } } = await sb.auth.getUser();
    currentUser = user;
    const headerRight = document.getElementById('headerRight');
    if(user){
      captureLocationOnce(user.id);

      let name = (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split('@')[0] : 'there');
      let role = 'donor';
      let donationCount = 0;
      currentUserDoctorVerified = false;
      try{
        const { data: profile } = await sb.from('profiles').select('full_name, role, doctor_verified').eq('id', user.id).single();
        if(profile && profile.full_name) name = profile.full_name;
        if(profile && profile.role) role = profile.role;
        currentUserDoctorVerified = !!(profile && profile.doctor_verified);
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
          <button class="ll-settings-btn" id="settingsLinkBtn">⚙️ Settings</button>
          <button class="ll-logout" id="logoutBtn">Log out</button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        refreshAuthUI();
      });
      const dashBtn = document.getElementById('dashLinkBtn');
      if(dashBtn) dashBtn.addEventListener('click', openDashboard);
      document.getElementById('settingsLinkBtn').addEventListener('click', openSettingsModal);
    } else {
      currentUserDoctorVerified = false;
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
  function showLoginForm(){
    hideAllAuthForms();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authModal').classList.remove('ll-modal-wide');
  }
  function showRegisterForm(){
    hideAllAuthForms();
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModal').classList.add('ll-modal-wide');
    document.getElementById('regIsDoctor').checked = false;
    document.getElementById('doctorFieldsWrap').style.display = 'none';
    document.getElementById('regHealthCondition').value = 'no';
    document.getElementById('healthIssuesWrap').style.display = 'none';
    document.getElementById('regHealthIssues').value = '';
  }
  function showForgotForm(){
    hideAllAuthForms();
    document.getElementById('forgotForm').style.display = 'block';
    document.getElementById('authModal').classList.remove('ll-modal-wide');
  }
  function showResetForm(){
    hideAllAuthForms();
    document.getElementById('resetForm').style.display = 'block';
    document.getElementById('authModal').classList.remove('ll-modal-wide');
  }

  document.getElementById('regHealthCondition').addEventListener('change', (e) => {
    document.getElementById('healthIssuesWrap').style.display = e.target.value === 'yes' ? 'block' : 'none';
  });

  document.getElementById('loginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); openModal('authOverlay'); });
  document.getElementById('joinBtn').addEventListener('click', () => { showRegisterForm(); openModal('authOverlay'); });
  document.getElementById('registerBtn').addEventListener('click', () => { showRegisterForm(); openModal('authOverlay'); });

  document.getElementById('authClose').addEventListener('click', () => closeModal('authOverlay'));
  document.getElementById('authOverlay').addEventListener('click', (e) => { if(e.target.id === 'authOverlay') closeModal('authOverlay'); });
  document.getElementById('toRegister').addEventListener('click', showRegisterForm);
  document.getElementById('toLogin').addEventListener('click', showLoginForm);
  document.getElementById('toForgot').addEventListener('click', showForgotForm);
  document.getElementById('forgotToLogin').addEventListener('click', showLoginForm);

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

  const regIsDoctorEl = document.getElementById('regIsDoctor');
  const doctorFieldsWrap = document.getElementById('doctorFieldsWrap');
  regIsDoctorEl.addEventListener('change', () => {
    doctorFieldsWrap.style.display = regIsDoctorEl.checked ? 'block' : 'none';
  });

  document.getElementById('registerSubmit').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    const bloodGroup = document.getElementById('regBloodGroup').value;
    const isOrganDonor = document.getElementById('regOrganDonor').checked;
    const isDoctor = regIsDoctorEl.checked;
    const hospitalName = document.getElementById('regHospitalName').value.trim();
    const nmrId = document.getElementById('regNmrId').value.trim();
    const age = document.getElementById('regAge').value.trim();
    const gender = document.getElementById('regGender').value;
    const hasHealthCondition = document.getElementById('regHealthCondition').value === 'yes';
    const healthIssues = document.getElementById('regHealthIssues').value.trim();

    if(!name || !email || !password){ showMsg('registerMsg', 'Name, email and password are required.', true); return; }
    if(password.length < 6){ showMsg('registerMsg', 'Password must be at least 6 characters.', true); return; }
    if(isDoctor && (!hospitalName || !nmrId)){
      showMsg('registerMsg', 'Health center name and NMR ID are required to register as a doctor.', true);
      return;
    }
    if(hasHealthCondition && !healthIssues){
      showMsg('registerMsg', 'Please describe your health condition(s), or switch back to "No health complications".', true);
      return;
    }

    const btn = document.getElementById('registerSubmit');
    btn.disabled = true; btn.textContent = 'Creating account...';

    const { data: signUpData, error: signUpError } = await sb.auth.signUp({
      email, password,
      options: { data: {
        full_name: name, phone: phone, blood_group: bloodGroup, is_organ_donor: isOrganDonor,
        role: isDoctor ? 'doctor' : 'donor',
        is_doctor: isDoctor,
        hospital_name: isDoctor ? hospitalName : null,
        nmr_id: isDoctor ? nmrId : null,
        doctor_verified: false,
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        has_health_condition: hasHealthCondition,
        health_issues: hasHealthCondition ? healthIssues : null
      } }
    });
    if(signUpError){
      btn.disabled = false; btn.textContent = 'Create Account';
      showMsg('registerMsg', signUpError.message, true);
      return;
    }

    if(signUpData.session){
      await captureLocationOnce(signUpData.session.user.id);
    }

    btn.disabled = false; btn.textContent = 'Create Account';
    const doctorNote = isDoctor ? ' Your doctor verification (health center + NMR ID) is pending admin review.' : '';
    if(signUpData.session){
      showMsg('registerMsg', 'Account created! Logging you in...' + doctorNote, false);
      showToast('Account created — welcome to LifeLink!' + (isDoctor ? ' Doctor verification pending.' : ''), false);
      await refreshAuthUI();
      setTimeout(() => closeModal('authOverlay'), 900);
    } else {
      showMsg('registerMsg', 'Account created! Check your email to confirm, then log in.' + doctorNote, false);
      showToast('Account created — check your email to confirm.', false);
      setTimeout(() => { showLoginForm(); }, 1600);
    }
  });

  document.getElementById('settingsClose').addEventListener('click', () => closeModal('settingsOverlay'));
  document.getElementById('settingsOverlay').addEventListener('click', (e) => { if(e.target.id === 'settingsOverlay') closeModal('settingsOverlay'); });

  async function openSettingsModal(){
    clearMsg('settingsMsg');
    document.getElementById('setNewPassword').value = '';
    document.getElementById('setNewPasswordConfirm').value = '';
    document.getElementById('setCurrentPassword').value = '';

    const { data: { user } } = await sb.auth.getUser();
    if(!user) return;
    document.getElementById('setEmail').value = user.email || '';
    document.getElementById('setName').value = (user.user_metadata && user.user_metadata.full_name) || '';
    document.getElementById('setPhone').value = (user.user_metadata && user.user_metadata.phone) || '';
    try{
      const { data: profile } = await sb.from('profiles').select('full_name, phone').eq('id', user.id).single();
      if(profile){
        if(profile.full_name) document.getElementById('setName').value = profile.full_name;
        if(profile.phone) document.getElementById('setPhone').value = profile.phone;
      }
    }catch(e){ /* profile row may not exist yet — form still works off auth metadata */ }

    openModal('settingsOverlay');
  }

  document.getElementById('settingsSubmit').addEventListener('click', async () => {
    const name = document.getElementById('setName').value.trim();
    const email = document.getElementById('setEmail').value.trim();
    const phone = document.getElementById('setPhone').value.trim();
    const newPassword = document.getElementById('setNewPassword').value;
    const newPasswordConfirm = document.getElementById('setNewPasswordConfirm').value;
    const currentPassword = document.getElementById('setCurrentPassword').value;

    if(!name || !email){ showMsg('settingsMsg', 'Name and email are required.', true); return; }
    if(newPassword && newPassword.length < 6){ showMsg('settingsMsg', 'New password must be at least 6 characters.', true); return; }
    if(newPassword && newPassword !== newPasswordConfirm){ showMsg('settingsMsg', 'New passwords do not match.', true); return; }
    if(!currentPassword){ showMsg('settingsMsg', 'Enter your current password to save changes.', true); return; }

    const { data: { user } } = await sb.auth.getUser();
    if(!user){ showMsg('settingsMsg', 'Your session expired — please log in again.', true); return; }

    const btn = document.getElementById('settingsSubmit');
    btn.disabled = true; btn.textContent = 'Verifying password...';

    const { error: verifyError } = await sb.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if(verifyError){
      btn.disabled = false; btn.textContent = 'Save Changes';
      showMsg('settingsMsg', 'Current password is incorrect.', true);
      return;
    }

    btn.textContent = 'Saving...';

    const authUpdate = {};
    if(email && email !== user.email) authUpdate.email = email;
    if(newPassword) authUpdate.password = newPassword;
    if(Object.keys(authUpdate).length > 0){
      const { error: authError } = await sb.auth.updateUser(authUpdate);
      if(authError){
        btn.disabled = false; btn.textContent = 'Save Changes';
        showMsg('settingsMsg', authError.message, true);
        return;
      }
    }

    const { error: profileError } = await sb.from('profiles').update({ full_name: name, phone: phone }).eq('id', user.id);

    btn.disabled = false; btn.textContent = 'Save Changes';
    if(profileError){
      showMsg('settingsMsg', 'Some details saved, but profile update failed: ' + profileError.message, true);
      showToast('Profile update failed: ' + profileError.message, true);
      return;
    }

    document.getElementById('setNewPassword').value = '';
    document.getElementById('setNewPasswordConfirm').value = '';
    document.getElementById('setCurrentPassword').value = '';

    const emailNote = (email !== user.email) ? ' Check your new email to confirm the change.' : '';
    showMsg('settingsMsg', 'Account updated successfully.' + emailNote, false);
    showToast('Account settings saved.', false);
    await refreshAuthUI();
  });

  let currentSearchResults = []; // the (max 3) donors currently listed, for click-to-detail lookups
  function resetSearchLocationUI(){
    searchLocMode = 'current'; pickedLocation = null;
    document.getElementById('locOptCurrent').classList.add('active');
    document.getElementById('locOptCustom').classList.remove('active');
    document.getElementById('customLocWrap').style.display = 'none';
    document.getElementById('searchLocationInput').value = '';
    document.getElementById('locSuggestions').innerHTML = '';
    document.getElementById('locPicked').style.display = 'none';
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    clearMsg('searchMsg');
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResultsNote').style.display = 'none';
    currentSearchResults = [];
    resetSearchLocationUI();
    openModal('searchOverlay');
  });
  document.getElementById('searchClose').addEventListener('click', () => closeModal('searchOverlay'));
  document.getElementById('searchOverlay').addEventListener('click', (e) => { if(e.target.id === 'searchOverlay') closeModal('searchOverlay'); });

  let searchLocMode = 'current';   // 'current' | 'custom'
  let pickedLocation = null;       // { lat, lng, label } once user selects a place
  const locOptCurrent   = document.getElementById('locOptCurrent');
  const locOptCustom    = document.getElementById('locOptCustom');
  const customLocWrap   = document.getElementById('customLocWrap');
  const searchLocInput  = document.getElementById('searchLocationInput');
  const locSuggestionsEl= document.getElementById('locSuggestions');
  const locPickedEl     = document.getElementById('locPicked');

  function setLocMode(mode){
    searchLocMode = mode;
    locOptCurrent.classList.toggle('active', mode === 'current');
    locOptCustom.classList.toggle('active', mode === 'custom');
    customLocWrap.style.display = mode === 'custom' ? 'block' : 'none';
  }
  locOptCurrent.addEventListener('click', () => setLocMode('current'));
  locOptCustom.addEventListener('click', () => { setLocMode('custom'); searchLocInput.focus(); });

  let locSearchDebounce = null;
  searchLocInput.addEventListener('input', () => {
    pickedLocation = null;
    locPickedEl.style.display = 'none';
    const q = searchLocInput.value.trim();
    clearTimeout(locSearchDebounce);
    if(q.length < 3){ locSuggestionsEl.innerHTML = ''; return; }
    locSearchDebounce = setTimeout(async () => {
      try{
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`);
        const results = await res.json();
        locSuggestionsEl.innerHTML = '';
        (results || []).forEach(r => {
          const item = document.createElement('div');
          item.className = 'll-loc-suggestion';
          item.textContent = r.display_name;
          item.addEventListener('click', () => {
            pickedLocation = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name };
            searchLocInput.value = '';
            locSuggestionsEl.innerHTML = '';
            locPickedEl.style.display = 'flex';
            locPickedEl.innerHTML = `<span>Searching near <b>${r.display_name}</b></span><span class="ll-loc-clear" id="locClear">Change</span>`;
            document.getElementById('locClear').addEventListener('click', () => {
              pickedLocation = null;
              locPickedEl.style.display = 'none';
              searchLocInput.focus();
            });
          });
          locSuggestionsEl.appendChild(item);
        });
      }catch(e){ /* geocoding hiccup — user can just try again */ }
    }, 400);
  });

  document.getElementById('searchSubmit').addEventListener('click', async () => {
    if(!currentUser){
      showLoginForm(); openModal('authOverlay');
      showToast('Please log in to search for donors.', true);
      return;
    }

    const bloodGroup = document.getElementById('searchBloodGroup').value;
    const isAllGroups = bloodGroup === 'all';
    const resultsEl = document.getElementById('searchResults');
    resultsEl.innerHTML = '';
    clearMsg('searchMsg');

    const btn = document.getElementById('searchSubmit');

    let loc;
    if(searchLocMode === 'custom'){
      if(!pickedLocation){
        showMsg('searchMsg', 'Pick a place from the suggestions first, or switch to "My Current Location".', true);
        return;
      }
      loc = pickedLocation;
    } else {
      btn.disabled = true; btn.textContent = 'Locating you...';
      try{
        loc = await getLocationCached();
      }catch(e){
        btn.disabled = false; btn.textContent = 'Search Nearby Donors';
        showMsg('searchMsg', 'Location access is needed to search nearby donors. Please allow location access, or use "Choose a Place" instead.', true);
        return;
      }
    }

    btn.disabled = true; btn.textContent = 'Searching...';
    resultsEl.innerHTML = `
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    `;

    const SEARCH_RADII_KM = [15, 50, 200];
    let data = null, error = null;
    for(const radius_km of SEARCH_RADII_KM){
      const res = await sb.rpc('nearby_donors', {
        target_blood_group: isAllGroups ? null : bloodGroup,
        lat: loc.lat,
        lng: loc.lng,
        radius_km
      });
      data = res.data; error = res.error;
      if(error) break;
      if(data && data.length > 0) break;
    }

    if(!data || data.length === 0){
      data = generateDemoDonors(loc.lat, loc.lng, isAllGroups ? null : bloodGroup);
      error = null;
    }

    btn.disabled = false; btn.textContent = 'Search Nearby Donors';
    resultsEl.innerHTML = '';

    if(error){ showMsg('searchMsg', error.message, true); showToast('Search failed: ' + error.message, true); return; }
    if(!data || data.length === 0){
      showMsg('searchMsg', isAllGroups ? 'No verified donors found near you yet.' : `No verified ${bloodGroup} donors found near you yet.`, true);
      return;
    }
    data = data.slice().sort((a, b) => a.distance_km - b.distance_km);

    const nearLabel = searchLocMode === 'custom' ? `near ${pickedLocation.label.split(',')[0]}` : 'near you';
    const isDemoData = data.some(d => d.demo);
    showMsg('searchMsg', `Found ${data.length} donor(s) ${nearLabel}, nearest first.${isDemoData ? ' (demo data)' : ''}`, false);
    showToast(isAllGroups ? `Found ${data.length} nearby donor(s).` : `Found ${data.length} nearby ${bloodGroup} donor(s).`, false);

    const originLabel = searchLocMode === 'custom' ? pickedLocation.label.split(',')[0] : 'You are here';
    const donorPoints = [{ type: 'you', lat: loc.lat, lng: loc.lng, label: originLabel }];
    data.forEach(d => {
      if(d.donor_lat && d.donor_lng) donorPoints.push({ type: 'donor', lat: d.donor_lat, lng: d.donor_lng, label: d.full_name, sub: `${d.blood_group} · ${d.distance_km.toFixed(1)}km away` });
    });
    if(liveMap){
      initMap(loc.lat, loc.lng);
      liveMap.setView([loc.lat, loc.lng], 12);
      const facilities = await loadFacilityPoints(loc.lat, loc.lng);
      plotOnMap([...donorPoints, ...facilities]);
    }

    const MAX_RESULTS_SHOWN = 3;
    currentSearchResults = data.slice(0, MAX_RESULTS_SHOWN);

    const noteEl = document.getElementById('searchResultsNote');
    if(data.length > MAX_RESULTS_SHOWN){
      noteEl.style.display = 'block';
      noteEl.textContent = `Showing the nearest ${MAX_RESULTS_SHOWN} of ${data.length} donors found. Tap a donor for details.`;
    } else {
      noteEl.style.display = 'block';
      noteEl.textContent = 'Tap a donor to view details.';
    }

    currentSearchResults.forEach((donor, i) => {
      const row = document.createElement('div');
      row.className = 'll-result-row' + (i === 0 ? ' nearest' : '');
      row.id = `donor-row-${i}`;
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      const badge = i === 0 ? '<span class="nearest-badge">Nearest</span>' : '';
      const locHtml = (donor.donor_lat && donor.donor_lng)
        ? `<span class="ll-result-loc" id="donor-loc-${i}">Locating…</span>`
        : '';
      row.innerHTML = `<span><span class="ll-result-title"><b>${donor.full_name}</b> · ${donor.blood_group}${badge}</span>${locHtml}</span><span>${donor.distance_km.toFixed(1)} km<span class="ll-result-chevron">›</span></span>`;
      const openThisDonor = () => openDonorDetail(donor, i);
      row.addEventListener('click', openThisDonor);
      row.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openThisDonor(); } });
      resultsEl.appendChild(row);
    });

    resolveDonorLocations(currentSearchResults);
  });

  const reverseGeocodeCache = new Map();
  async function resolveDonorLocations(data){
    for(let i = 0; i < data.length; i++){
      const donor = data[i];
      const locEl = document.getElementById(`donor-loc-${i}`);
      if(!locEl || !donor.donor_lat || !donor.donor_lng) continue;

      const cacheKey = `${donor.donor_lat.toFixed(2)},${donor.donor_lng.toFixed(2)}`;
      if(reverseGeocodeCache.has(cacheKey)){
        locEl.textContent = reverseGeocodeCache.get(cacheKey);
        continue;
      }
      try{
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${donor.donor_lat}&lon=${donor.donor_lng}&zoom=12`);
        const place = await res.json();
        const a = place.address || {};
        const city = a.city || a.town || a.village || a.suburb || a.county || '';
        const state = a.state || '';
        const label = [city, state].filter(Boolean).join(', ') || 'Location unavailable';
        reverseGeocodeCache.set(cacheKey, label);
        locEl.textContent = label;
      }catch(e){
        locEl.textContent = 'Location unavailable';
      }
      if(typeof activeDonorRowIndex !== 'undefined' && activeDonorRowIndex === i){
        const modalLocEl = document.querySelector('#donorDetailInfoGrid .ll-donor-info-value');
        if(modalLocEl && document.getElementById('donorDetailOverlay').classList.contains('open')) modalLocEl.textContent = locEl.textContent;
      }
      await new Promise(r => setTimeout(r, 300)); // stay well under Nominatim's rate limit
    }
  }

  function getDonorId(donor){
    return donor.id || donor.donor_id || donor.user_id || null;
  }

  let activeDonor = null;   // the donor object currently shown in the detail modal
  let activeDonorRowIndex = null;

  function openDonorDetail(donor, rowIndex){
    activeDonor = donor;
    activeDonorRowIndex = rowIndex;

    clearMsg('donorDetailMsg');
    const donateBtn = document.getElementById('donorDetailDonateBtn');
    donateBtn.disabled = false;
    donateBtn.classList.remove('done');
    donateBtn.textContent = 'Mark as Donated';

    document.getElementById('donorDetailAvatar').textContent = (donor.full_name || '?').trim().charAt(0).toUpperCase();
    document.getElementById('donorDetailName').textContent = donor.full_name;

    const badgesEl = document.getElementById('donorDetailBadges');
    badgesEl.innerHTML = `
      <span class="ll-donor-badge${rowIndex === 0 ? ' nearest' : ''}">${donor.blood_group}</span>
      ${rowIndex === 0 ? '<span class="ll-donor-badge nearest">Nearest</span>' : ''}
      <span class="ll-donor-badge">${donor.distance_km.toFixed(1)} km away</span>
    `;

    const locText = (() => {
      const el = document.getElementById(`donor-loc-${rowIndex}`);
      return (el && el.textContent && el.textContent !== 'Locating…') ? el.textContent : null;
    })();

    const phone = donor.phone || donor.contact_phone || null;
    const email = donor.email || donor.contact_email || null;

    const infoGrid = document.getElementById('donorDetailInfoGrid');
    const contactHtml = currentUserDoctorVerified
      ? `
      <div class="ll-donor-info-row">
        <span class="ll-donor-info-icon">📞</span>
        <div><div class="ll-donor-info-label">Phone</div>${phone
          ? `<a class="ll-donor-info-value" href="tel:${phone}">${phone}</a>`
          : '<div class="ll-donor-info-value muted">Not shared yet</div>'}</div>
      </div>
      <div class="ll-donor-info-row">
        <span class="ll-donor-info-icon">✉️</span>
        <div><div class="ll-donor-info-label">Email</div>${email
          ? `<a class="ll-donor-info-value" href="mailto:${email}">${email}</a>`
          : '<div class="ll-donor-info-value muted">Not shared yet</div>'}</div>
      </div>`
      : `
      <div class="ll-donor-info-row">
        <span class="ll-donor-info-icon">🔒</span>
        <div><div class="ll-donor-info-label">Contact Details</div><div class="ll-donor-info-value muted">Visible to verified health center accounts only</div><button type="button" id="donorDetailVerifyCta" style="margin-top:6px; font-size:12px; font-weight:600; color:var(--red-deep); text-decoration:underline; background:none; padding:0;">Register as a health center</button></div>
      </div>`;

    infoGrid.innerHTML = `
      <div class="ll-donor-info-row">
        <span class="ll-donor-info-icon">📍</span>
        <div><div class="ll-donor-info-label">Location</div><div class="ll-donor-info-value">${locText || 'Resolving…'}</div></div>
      </div>
      ${contactHtml}
    `;

    openModal('donorDetailOverlay');

    const verifyCtaBtn = document.getElementById('donorDetailVerifyCta');
    if(verifyCtaBtn){
      verifyCtaBtn.addEventListener('click', () => {
        closeModal('donorDetailOverlay');
        showRegisterForm();
        openModal('authOverlay');
        const doctorCheckbox = document.getElementById('regIsDoctor');
        if(doctorCheckbox && !doctorCheckbox.checked) doctorCheckbox.click();
      });
    }
  }

  document.getElementById('donorDetailClose').addEventListener('click', () => closeModal('donorDetailOverlay'));
  document.getElementById('donorDetailOverlay').addEventListener('click', (e) => { if(e.target.id === 'donorDetailOverlay') closeModal('donorDetailOverlay'); });

  document.getElementById('donorDetailDonateBtn').addEventListener('click', async () => {
    if(!activeDonor) return;
    if(!currentUser){
      showMsg('donorDetailMsg', 'Please log in first.', true);
      return;
    }
    const donorId = getDonorId(activeDonor);
    const btn = document.getElementById('donorDetailDonateBtn');
    btn.disabled = true; btn.textContent = 'Marking...';
    clearMsg('donorDetailMsg');

    try{
      const { error: insertError } = await sb.from('donations').insert({
        donor_id: donorId,
        blood_group: activeDonor.blood_group,
        marked_by: currentUser.id
      });
      if(insertError) throw insertError;

      if(donorId){
        try{
          await sb.from('profiles').update({ is_available: false }).eq('id', donorId);
        }catch(flagErr){ /* column may not exist yet — safe to ignore */ }
      }

      const row = document.getElementById(`donor-row-${activeDonorRowIndex}`);
      if(row) row.remove();
      currentSearchResults = currentSearchResults.filter((d, idx) => idx !== activeDonorRowIndex);

      btn.classList.add('done');
      btn.textContent = 'Marked as Donated ✓';
      showToast(`${activeDonor.full_name} marked as donated — thank you!`, false);
      setTimeout(() => closeModal('donorDetailOverlay'), 1200);
    }catch(err){
      btn.disabled = false; btn.textContent = 'Mark as Donated';
      showMsg('donorDetailMsg', err.message || 'Could not mark this donor as donated.', true);
      showToast('Could not mark as donated: ' + (err.message || 'unknown error'), true);
    }
  });

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
    btn.disabled = true; btn.textContent = 'Checking your session...';

    const { data: { user: liveUser }, error: sessionError } = await sb.auth.getUser();
    if(sessionError || !liveUser){
      currentUser = null;
      btn.disabled = false; btn.textContent = 'Send Emergency Alert';
      showMsg('sosMsg', 'Your session has expired. Please log in again.', true);
      showToast('Session expired — please log in again.', true);
      await sb.auth.signOut();
      await refreshAuthUI();
      showLoginForm();
      return;
    }
    currentUser = liveUser;

    btn.textContent = 'Locating you...';

    let loc;
    try{
      loc = await getLocationCached();
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
      if(/foreign key constraint/i.test(reqError.message)){
        showMsg('sosMsg', 'Your session is out of date. Please log out and log in again.', true);
        showToast('Session out of date — please log in again.', true);
        currentUser = null;
        await sb.auth.signOut();
        await refreshAuthUI();
        showLoginForm();
      } else {
        showMsg('sosMsg', reqError.message, true);
      }
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

  document.querySelectorAll('.blood-card').forEach(card => {
    card.addEventListener('click', () => {
      const bg = card.dataset.bg;
      document.getElementById('searchBloodGroup').value = bg;
      document.getElementById('searchResults').innerHTML = '';
      document.getElementById('searchResultsNote').style.display = 'none';
      currentSearchResults = [];
      clearMsg('searchMsg');
      resetSearchLocationUI();
      openModal('searchOverlay');
    });
  });

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

  function pinIcon(symbolSvg, bgColor){
    return L.divIcon({
      className: 'll-map-pin',
      html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23 0 15 0z" fill="${bgColor}" stroke="#fff" stroke-width="1.5"/>
        ${symbolSvg}
      </svg>`,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -36]
    });
  }
  const PLUS_SYMBOL = '<rect x="12" y="7" width="6" height="16" rx="1.5" fill="#fff"/><rect x="7" y="12" width="16" height="6" rx="1.5" fill="#fff"/>';
  const DROP_SYMBOL = '<path d="M15 8c3.6 4.6 6 8 6 11.3a6 6 0 1 1-12 0C9 16 11.4 12.6 15 8z" fill="#fff"/>';
  const healthCenterIcon = pinIcon(PLUS_SYMBOL, '#7A0019');
  const bloodBankIcon    = pinIcon(DROP_SYMBOL, '#C0122F');

  function plotOnMap(points){
    if(!liveMap) return;
    clearMapMarkers();
    points.forEach(pt => {
      let marker;
      if(pt.type === 'hospital' || pt.type === 'bloodbank'){
        marker = L.marker([pt.lat, pt.lng], { icon: pt.type === 'bloodbank' ? bloodBankIcon : healthCenterIcon });
      } else {
        marker = L.circleMarker([pt.lat, pt.lng], {
          radius: 8, color: '#C0122F', fillColor: '#C0122F', fillOpacity: 0.85, weight: 2
        });
      }
      marker.bindPopup(`<b>${pt.label}</b>${pt.sub ? '<br>' + pt.sub : ''}`);
      marker.addTo(liveMap);
      mapMarkers.push(marker);
    });
  }

  let facilityPoints = [];
  async function loadFacilityPoints(lat, lng){
    const RADII_KM = [25, 75, 150];
    let hospitalRows = [];
    for(const radius_km of RADII_KM){
      try{
        const { data } = await sb.rpc('nearby_hospitals', { lat, lng, radius_km });
        hospitalRows = data || [];
      }catch(e){ /* nearby_hospitals may not exist yet if schema.sql hasn't been run — fail quietly */ }
      if(hospitalRows.length > 0) break;
    }

    const points = hospitalRows
      .filter(h => h.hosp_lat && h.hosp_lng)
      .map(h => {
        const category = (h.category || '').toLowerCase();
        const isBloodBank = category.includes('blood');
        return {
          type: isBloodBank ? 'bloodbank' : 'hospital',
          lat: h.hosp_lat, lng: h.hosp_lng, label: h.name,
          sub: h.category || (isBloodBank ? 'Blood Bank' : 'Health Center')
        };
      });

    try{
      const { data: bloodBanks } = await sb.rpc('nearby_blood_banks', { lat, lng, radius_km: 75 });
      (bloodBanks || []).forEach(b => {
        if(b.bank_lat && b.bank_lng) points.push({ type: 'bloodbank', lat: b.bank_lat, lng: b.bank_lng, label: b.name, sub: 'Blood Bank' });
      });
    }catch(e){ /* nearby_blood_banks may not exist — fail quietly */ }

    if(points.length === 0){
      facilityPoints = generateDemoFacilities(lat, lng);
      return facilityPoints;
    }

    facilityPoints = points;
    return points;
  }

  async function refreshLiveMap(promptForLocation){
    const hintEl = document.getElementById('mapHint');
    let loc = cachedLocation;
    if(!loc && promptForLocation){
      try{ loc = await getLocationCached(); }catch(e){ /* denied/unavailable — fall back below */ }
    }
    if(loc){
      hintEl.style.display = 'none';
    } else {
      loc = { lat: 20.5937, lng: 78.9629 }; // fallback: broad default center
      hintEl.textContent = 'Log in or hit refresh to center the map on your location';
      hintEl.style.display = 'block';
    }
    initMap(loc.lat, loc.lng);
    liveMap.setView([loc.lat, loc.lng], 12);

    const facilities = await loadFacilityPoints(loc.lat, loc.lng);
    const points = [{ type: 'you', lat: loc.lat, lng: loc.lng, label: 'You are here' }, ...facilities];
    plotOnMap(points);
  }
  document.getElementById('mapRefreshBtn').addEventListener('click', () => {
    if(!currentUser){
      showLoginForm(); openModal('authOverlay');
      showToast('Please log in to search the live map.', true);
      return;
    }
    refreshLiveMap(true);
  });

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
    } else {
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

    await loadDoctorVerifications();
  }

  async function loadDoctorVerifications(){
    const tbody = document.getElementById('doctorVerifyTableBody');
    const emptyEl = document.getElementById('doctorVerifyEmpty');
    tbody.innerHTML = '';
    emptyEl.style.display = 'none';

    const { data: doctors, error } = await sb
      .from('profiles')
      .select('id, full_name, hospital_name, nmr_id, doctor_verified')
      .eq('is_doctor', true)
      .order('doctor_verified', { ascending: true });

    if(error || !doctors || doctors.length === 0){
      emptyEl.style.display = 'block';
      return;
    }

    doctors.forEach(d => {
      const tr = document.createElement('tr');
      const pill = d.doctor_verified
        ? '<span class="doc-status-pill verified">Verified</span>'
        : '<span class="doc-status-pill pending">Pending</span>';
      const action = d.doctor_verified
        ? ''
        : `<button class="doc-verify-btn" data-id="${d.id}">Verify</button>`;
      tr.innerHTML = `
        <td>${d.full_name || '—'}</td>
        <td>${d.hospital_name || '—'}</td>
        <td>${d.nmr_id || '—'}</td>
        <td>${pill}</td>
        <td>${action}</td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.doc-verify-btn').forEach(b => {
      b.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        e.target.disabled = true; e.target.textContent = 'Verifying...';
        const { error: verifyError } = await sb.from('profiles').update({ doctor_verified: true }).eq('id', id);
        if(verifyError){
          showToast('Failed to verify doctor: ' + verifyError.message, true);
          e.target.disabled = false; e.target.textContent = 'Verify';
          return;
        }
        showToast('Doctor verified.', false);
        loadDoctorVerifications();
      });
    });
  }
  function openModal2(id){ document.getElementById(id).classList.add('open'); }
  document.getElementById('dashClose').addEventListener('click', () => document.getElementById('dashOverlay').classList.remove('open'));
  document.getElementById('dashOverlay').addEventListener('click', (e) => { if(e.target.id === 'dashOverlay') e.target.classList.remove('open'); });


  const aiChatWidget = document.getElementById('aiChatWidget');
  const aiChatToggle = document.getElementById('aiChatToggle');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const aiChatTyping = document.getElementById('aiChatTyping');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');

  let aiChatOpenedOnce = false;

  function toggleAiChat(){
    const opening = !aiChatWidget.classList.contains('open');
    aiChatWidget.classList.toggle('open');
    if(opening){
      document.getElementById('aiChatToggleIcon').textContent = '✕';
      if(!aiChatOpenedOnce){
        aiChatOpenedOnce = true;
        setTimeout(() => aiChatInput.focus(), 300);
      }
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    } else {
      document.getElementById('aiChatToggleIcon').textContent = '💬';
    }
  }
  aiChatToggle.addEventListener('click', toggleAiChat);
  aiChatClose.addEventListener('click', toggleAiChat);

  function addAiChatBubble(role, text){
    const bubble = document.createElement('div');
    bubble.className = 'll-ai-msg ' + role; // 'bot' | 'user' | 'error'
    bubble.textContent = text; // textContent only — never render raw HTML from user or model input
    aiChatMessages.appendChild(bubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    return bubble;
  }

  const FAQ_FALLBACK = "I don't have a canned answer for that yet. For anything urgent or specific to your case, please contact a doctor, verified hospital, or emergency services.";

  const AI_FAQ = [
    { keywords: ['o negative', 'o-', 'universal donor'],
      answer: "O- is the universal donor — it can be given to any blood type in an emergency. But O- people can only receive O- blood themselves." },
    { keywords: ['o positive', 'o+'],
      answer: "O+ can donate to O+, A+, B+, and AB+. O+ can only receive from O+ or O-. It's the most common blood type." },
    { keywords: ['a positive', 'a+'],
      answer: "A+ can donate to A+ and AB+. A+ can receive from A+, A-, O+, and O-." },
    { keywords: ['a negative', 'a-'],
      answer: "A- can donate to A+, A-, AB+, and AB-. A- can only receive from A- or O-." },
    { keywords: ['b positive', 'b+'],
      answer: "B+ can donate to B+ and AB+. B+ can receive from B+, B-, O+, and O-." },
    { keywords: ['b negative', 'b-'],
      answer: "B- can donate to B+, B-, AB+, and AB-. B- can only receive from B- or O-." },
    { keywords: ['ab positive', 'ab+', 'universal recipient'],
      answer: "AB+ is the universal recipient — it can receive blood from any type. AB+ can only donate to other AB+ patients." },
    { keywords: ['ab negative', 'ab-'],
      answer: "AB- can donate to AB+ and AB-. AB- can receive from AB-, A-, B-, and O-." },
    { keywords: ['blood type', 'blood group', 'compatib'],
      answer: "Compatibility depends on both the ABO group (O, A, B, AB) and the Rh factor (+/-). O- is the universal donor, AB+ is the universal recipient. Tell me a specific type (e.g. \"A+\") and I can break down who it can give to and receive from." },
    { keywords: ['rare blood type', 'rarest blood'],
      answer: "AB- is generally the rarest blood type, followed by B-. O+ and A+ are the most common." },

    { keywords: ['who can donate blood', 'eligib', 'donate blood requirements', 'age to donate'],
      answer: "In general, donors should be 18–65 years old, weigh at least 50kg (110lbs), and be in good general health. Specific rules vary by country and health center — LifeLink's verified centers will confirm your eligibility at donation time." },
    { keywords: ['how often', 'donate again', 'donation gap', 'wait between donation'],
      answer: "Whole blood donors typically need to wait about 3 months (12 weeks) between donations. Platelet donations can usually be made more frequently — check with your local blood bank for exact intervals." },
    { keywords: ['before donating', 'prepare for donation', 'donation tips'],
      answer: "Eat a good meal, stay hydrated, get enough sleep, and avoid heavy exercise right before donating. Bring ID and let staff know about any medications you're taking." },
    { keywords: ['after donating', 'donation recovery', 'side effects of donating'],
      answer: "Most people feel fine after donating. Rest for a few minutes, drink fluids, avoid heavy lifting or intense exercise for the rest of the day, and eat iron-rich foods to help replenish." },
    { keywords: ['does it hurt', 'pain', 'painful'],
      answer: "Donating blood involves a brief pinch when the needle is inserted, but the process itself is not painful for most people. It typically takes 8–10 minutes for whole blood." },
    { keywords: ['plasma', 'platelet donation'],
      answer: "Plasma and platelet donations use a process called apheresis, where blood is drawn, the needed component is separated, and the rest is returned to you. These donations take longer than whole blood (about 1–2 hours) but can be done more frequently." },
    { keywords: ['pregnant', 'pregnancy donate'],
      answer: "Pregnant women are generally advised not to donate blood. Guidelines usually recommend waiting at least 6 months after delivery — check with a doctor or your local blood bank for personal guidance." },
    { keywords: ['medication', 'medicine', 'on medication donate'],
      answer: "Many common medications don't prevent you from donating, but some do (e.g. certain blood thinners, recent antibiotics). It's best to disclose your medications to the health center staff, who'll confirm your eligibility." },
    { keywords: ['tattoo', 'piercing donate'],
      answer: "Most blood banks require a waiting period after getting a tattoo or piercing (commonly around 3–6 months), mainly due to infection risk. Check with your local center for their specific policy." },

    { keywords: ['organ donation process', 'how organ donation works', 'how does organ donation work'],
      answer: "Organ donation generally involves registering as a donor, medical/legal confirmation of eligibility, matching donors to recipients based on blood type, tissue compatibility, and urgency, then a coordinated surgical procedure. Living donors (e.g. for a kidney) go through additional health screening before donating." },
    { keywords: ['organ eligib', 'who can donate organs', 'organ donor requirements'],
      answer: "Eligibility depends on the organ and your health. Age alone rarely disqualifies someone — doctors evaluate on a case-by-case basis at the time of donation. Registering as a potential donor doesn't guarantee eligibility; that's confirmed later by medical professionals." },
    { keywords: ['living donor', 'donate a kidney', 'living donation'],
      answer: "Living donation is possible for organs like a kidney or part of a liver. It involves thorough medical, psychological, and compatibility screening beforehand, since the donor's own health is a top priority." },
    { keywords: ['waiting list', 'organ waiting', 'transplant list'],
      answer: "Recipients are placed on a waiting list and prioritized using factors like medical urgency, compatibility, and time on the list. Wait times vary a lot depending on the organ and blood type." },
    { keywords: ['which organs can be donated', 'organs list', 'what organs'],
      answer: "Commonly donated organs include kidneys, liver, heart, lungs, and pancreas. Tissue donations can include corneas, skin, bone, and heart valves — LifeLink lists live availability for several of these on the Find Organs page." },
    { keywords: ['brain dead', 'brain death organ'],
      answer: "Most deceased organ donations happen after brain death is confirmed by medical professionals, since organs need to stay oxygenated until recovery. This is confirmed through strict, independent medical criteria — not something registration status affects." },
    { keywords: ['register as organ donor', 'become an organ donor', 'sign up organ'],
      answer: "You can register as an organ donor right here on LifeLink — head to the Find Organs page or use Register Now. You can also usually register through your national donor registry or when renewing a driver's license, depending on your country." },
    { keywords: ['can i change my mind', 'remove organ donor', 'opt out organ'],
      answer: "Yes — organ donor registration can generally be updated or withdrawn at any time. Check your registration settings on LifeLink or your national registry to make changes." },

    { keywords: ['search availability', 'find blood', 'find donor near', 'nearby donor'],
      answer: "Use the \"Search Availability\" button on the homepage to see live blood and organ availability near you, filtered by type and distance." },
    { keywords: ['emergency sos', 'sos button', 'urgent request', 'emergency alert'],
      answer: "The Emergency SOS button instantly alerts nearby verified donors and health centers about an urgent need, so you can get help fast in a critical situation. It's meant for genuine emergencies." },
    { keywords: ['register as donor', 'sign up donor', 'become a donor', 'how to register'],
      answer: "Tap \"Register as Donor\" on the homepage, fill in your blood type, contact info, and location, and you'll be added to the live donor network so nearby requests can reach you." },
    { keywords: ['register as doctor', 'health center sign up', 'hospital registration', 'verify doctor'],
      answer: "Health centers and doctors can register through the \"For Health Centers\" section. Accounts go through an admin verification step (usually requiring your health center name and registration/NMR ID) before being fully activated." },
    { keywords: ['live map', 'map feature', 'donor map'],
      answer: "The live map shows real-time donor and organ availability in your area, so you can see where help is nearby at a glance." },
    { keywords: ['appointment', 'book a slot', 'schedule donation'],
      answer: "You can book a donation appointment directly through LifeLink once you've found a matching donor or center — pick an available time slot that works for you." },
    { keywords: ['notification', 'alerts', 'get notified'],
      answer: "LifeLink can notify you about matching requests, appointment reminders, and verification updates, depending on your notification settings." },
    { keywords: ['log in', 'login', 'sign in', 'account'],
      answer: "Use the \"Log In\" button in the top right to access your donor or health center account. If you don't have one yet, use \"Register Now\" instead." },
    { keywords: ['is my data safe', 'privacy', 'data secure'],
      answer: "LifeLink stores donor and request data securely and only shares what's needed to make a match. For specifics on data handling, check the site's privacy policy or contact support." },

    { keywords: ['hi', 'hello', 'hey'],
      answer: "Hi! Ask me about blood type compatibility, organ donation, or how to use Search Availability, Emergency SOS, or registering as a donor." },
    { keywords: ['thank', 'thanks'],
      answer: "You're welcome! Let me know if you have any other questions." },
    { keywords: ['who are you', 'what are you', 'what can you do'],
      answer: "I'm the LifeLink Assistant — I can answer common questions about blood type compatibility, organ donation basics, and how to use LifeLink's features like Search Availability, Emergency SOS, and donor registration." },
  ];

  function matchFaq(userText){
    const text = userText.toLowerCase();
    let best = null;
    let bestScore = 0;
    for(const entry of AI_FAQ){
      let score = 0;
      for(const kw of entry.keywords){
        if(text.includes(kw)) score++;
      }
      if(score > bestScore){
        bestScore = score;
        best = entry;
      }
    }
    return best ? best.answer : FAQ_FALLBACK;
  }

  aiChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = aiChatInput.value.trim();
    if(!text) return;

    addAiChatBubble('user', text);
    aiChatInput.value = '';
    aiChatInput.disabled = true;
    aiChatSend.disabled = true;
    aiChatTyping.style.display = 'flex';
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    setTimeout(() => {
      const reply = matchFaq(text);
      addAiChatBubble('bot', reply);

      aiChatTyping.style.display = 'none';
      aiChatInput.disabled = false;
      aiChatSend.disabled = false;
      aiChatInput.focus();
    }, 500 + Math.random() * 400);
  });


  refreshAuthUI();
  subscribeSosTicker();
  refreshLiveMap(false);

})();
