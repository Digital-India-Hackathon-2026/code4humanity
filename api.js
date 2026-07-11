(function(){
  const API_BASE = window.LIFELINK_API_BASE || 'http://localhost:4000/api';
  let authToken = localStorage.getItem('ll_token') || null;
  let authListeners = [];

  function setToken(t){
    authToken = t;
    if(t) localStorage.setItem('ll_token', t);
    else localStorage.removeItem('ll_token');
    authListeners.forEach(cb => cb(t ? 'SIGNED_IN' : 'SIGNED_OUT', t ? { user: null } : null));
  }

  async function request(path, options){
    options = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if(authToken) headers['Authorization'] = 'Bearer ' + authToken;
    let res;
    try{
      res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    }catch(e){
      return { data: null, error: { message: 'Network error contacting server' } };
    }
    let body = null;
    try{ body = await res.json(); }catch(e){ body = null; }
    if(!res.ok){
      return { data: null, error: { message: (body && body.message) || 'Request failed' } };
    }
    return { data: body, error: null };
  }

  function buildQuery(params){
    const pairs = [];
    Object.keys(params || {}).forEach(k => {
      if(params[k] === undefined || params[k] === null) return;
      pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  const authApi = {
    async getUser(){
      if(!authToken) return { data: { user: null }, error: null };
      const { data, error } = await request('/auth/me');
      if(error){ setToken(null); return { data: { user: null }, error: null }; }
      return { data: { user: data.user }, error: null };
    },
    async signInWithPassword({ email, password }){
      const { data, error } = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if(error) return { error };
      setToken(data.token);
      return { error: null };
    },
    async signUp({ email, password, options }){
      const metadata = (options && options.data) || {};
      const { data, error } = await request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, metadata }) });
      if(error) return { data: null, error };
      if(data.token) setToken(data.token);
      return { data: { session: data.token ? { user: data.user } : null, user: data.user }, error: null };
    },
    async signOut(){
      await request('/auth/logout', { method: 'POST' });
      setToken(null);
      return { error: null };
    },
    async resend({ type, email }){
      const { error } = await request('/auth/resend', { method: 'POST', body: JSON.stringify({ type, email }) });
      return { error };
    },
    async resetPasswordForEmail(email, opts){
      const { error } = await request('/auth/forgot', { method: 'POST', body: JSON.stringify({ email, redirectTo: opts && opts.redirectTo }) });
      return { error };
    },
    async updateUser(payload){
      const { error } = await request('/auth/update', { method: 'POST', body: JSON.stringify(payload) });
      return { error };
    },
    onAuthStateChange(cb){
      authListeners.push(cb);
      return { data: { subscription: { unsubscribe(){ authListeners = authListeners.filter(l => l !== cb); } } } };
    }
  };

  function table(name){
    const state = { filters: {}, columns: '*', order: null, limit: null, count: null, head: false };

    const chain = {
      select(cols, opts){
        state.columns = cols || '*';
        if(opts && opts.count) state.count = opts.count;
        if(opts && opts.head) state.head = true;
        return chain;
      },
      eq(col, val){ state.filters[col] = val; return chain; },
      order(col, opts){ state.order = col + '.' + (opts && opts.ascending === false ? 'desc' : 'asc'); return chain; },
      limit(n){ state.limit = n; return chain; },
      async single(){
        const params = Object.assign({ select: state.columns }, state.filters);
        const { data, error } = await request('/' + name + buildQuery(params));
        if(error) return { data: null, error };
        return { data: Array.isArray(data) ? (data[0] || null) : data, error: null };
      },
      then(resolve, reject){
        const params = Object.assign({ select: state.columns }, state.filters);
        if(state.order) params.order = state.order;
        if(state.limit) params.limit = state.limit;
        if(state.count) params.count = state.count;
        if(state.head) params.head = 'true';
        return request('/' + name + buildQuery(params)).then(result => {
          const extra = (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) ? result.data : {};
          const final = { data: result.data, error: result.error };
          if(state.count) final.count = extra.count != null ? extra.count : 0;
          resolve(final);
        }, reject);
      },
      insert(payload){
        const promise = request('/' + name, { method: 'POST', body: JSON.stringify(payload) });
        return {
          select(){ return this; },
          single(){
            return promise.then(res => {
              if(res.error) return res;
              return { data: Array.isArray(res.data) ? res.data[0] : res.data, error: null };
            });
          },
          then(resolve, reject){ return promise.then(resolve, reject); }
        };
      },
      update(payload){
        return {
          eq(col, val){
            return request('/' + name + '/' + encodeURIComponent(val), { method: 'PATCH', body: JSON.stringify(payload) });
          }
        };
      }
    };

    return chain;
  }

  async function rpc(fn, params){
    return request('/rpc/' + fn, { method: 'POST', body: JSON.stringify(params || {}) });
  }

  function channel(){
    return {
      on(){ return this; },
      subscribe(){ return this; }
    };
  }

  window.sb = { auth: authApi, from: table, rpc, channel };
})();
