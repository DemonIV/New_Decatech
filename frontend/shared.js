
// ═══════════════════════════════════════════════════
//  DECATECH — shared.js  (localStorage persistence)
// ═══════════════════════════════════════════════════

const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem('dct_' + k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem('dct_' + k, JSON.stringify(v)),
};

const SS = {
  get: k => { try { return JSON.parse(sessionStorage.getItem('dct_' + k)); } catch { return null; } },
  set: (k, v) => sessionStorage.setItem('dct_' + k, JSON.stringify(v)),
};

// ── Default data (only used on first ever load) ──
const DEFAULT_TASKS = [];
const DEFAULT_PROJECTS = [
  {id:'p1',name:'Proje X',color:'#2d5299'},
  {id:'p2',name:'Proje Y',color:'#8b5cf6'},
];
const DEFAULT_MSGS = [
  {id:'m1',from:'Ebubekir K.',text:'Backend route düzenlemeleri demo için hazır.',time:'09:15',me:false},
  {id:'m2',from:'Samet K.',text:'Raporlama kartlarını sunum akışına göre kontrol ediyorum.',time:'10:32',me:false},
  {id:'m3',from:'Siz',text:'Harika, öğleden sonra birlikte geçelim.',time:'10:45',me:true},
  {id:'m4',from:'Safa A.',text:'Frontend yönetim paneli düzeni güncellendi.',time:'11:20',me:false},
  {id:'m5',from:'Siz',text:'Teşekkürler! İnceliyorum.',time:'11:22',me:true},
];
const DEFAULT_NOTIFS = [];

window.API = window.API || 'http://localhost:3000';

window.getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

window.setCurrentUser = (user) => {
  sessionStorage.setItem('user', JSON.stringify(user));
};

window.clearCurrentUser = () => {
  sessionStorage.removeItem('user');
};

window.getUserInfo = () => {
  const user = getCurrentUser();
  return LS.get('userInfo') || {
    name: user.username || 'Kullanıcı',
    email: '',
    role: user.role || 'user',
  };
};

window.setUserInfo = (info) => {
  LS.set('userInfo', info);
};

window.isAdmin = () => getCurrentUser().role === 'admin';

window.requireAuth = () => {
  const user = getCurrentUser();
  if (!user.id) {
    window.location.href = 'login.html';
    return null;
  }

  return user;
};

window.requireAdmin = () => {
  const user = requireAuth();
  if (!user) return null;

  if (user.role !== 'admin') {
    window.location.href = 'index.html';
    return null;
  }

  return user;
};

window.showAdminNav = () => {
  document.querySelectorAll('#nav-yonetim').forEach((el) => {
    el.style.display = isAdmin() ? 'flex' : 'none';
  });
};

window.currentUserInitials = () => {
  const user = getCurrentUser();
  return (user.initials || user.username || '').slice(0, 2).toUpperCase();
};

window.isTaskVisibleForCurrentUser = (task) => {
  if (isAdmin()) return true;
  const initials = currentUserInitials();
  return !task.assignee || String(task.assignee).toUpperCase() === initials;
};

window.canManageTask = (task) => {
  if (isAdmin()) return true;
  const initials = currentUserInitials();
  return String(task.assignee || '').toUpperCase() === initials;
};

const syncChannel = 'BroadcastChannel' in window ? new BroadcastChannel('decatech-demo-sync') : null;

window.notifyDemoSync = (type, payload = {}) => {
  const event = { type, payload, at: Date.now() };
  syncChannel?.postMessage(event);
  localStorage.setItem('dct_sync_event', JSON.stringify(event));
};

window.refreshDemoViews = () => {
  if (typeof renderKanban === 'function') renderKanban();
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderReports === 'function') renderReports();
  if (typeof loadCalendarData === 'function') loadCalendarData();
  if (typeof renderNotifs === 'function') renderNotifs();
  if (typeof loadUsers === 'function') loadUsers();
  if (typeof loadDeadlines === 'function') loadDeadlines();
  if (typeof loadTaskDeadlines === 'function') loadTaskDeadlines();
  renderChat();
  updateBadge();
};

syncChannel?.addEventListener('message', () => refreshDemoViews());
window.addEventListener('storage', (event) => {
  if (event.key === 'dct_sync_event' || event.key === 'dct_msgs' || event.key === 'dct_notifs') {
    refreshDemoViews();
  }
});

window.startDemoRealtime = () => {
  if (window.__demoRealtimeStarted) return;
  window.__demoRealtimeStarted = true;
  setInterval(refreshDemoViews, 3000);
};

window.initChatToggle = () => {
  const chat = document.querySelector('.chat');
  const header = document.querySelector('.chat-header');
  if (!chat || !header || document.getElementById('chatToggleBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'chatToggleBtn';
  btn.className = 'chat-toggle-btn';
  btn.type = 'button';
  btn.textContent = '↓';
  btn.title = 'Sohbeti aç/kapat';
  btn.addEventListener('click', () => {
    chat.classList.toggle('collapsed');
    btn.textContent = chat.classList.contains('collapsed') ? '↑' : '↓';
  });
  header.appendChild(btn);
};

document.addEventListener('DOMContentLoaded', () => {
  initChatToggle();
  if (getCurrentUser().id) startDemoRealtime();
});

window.renderOverview = window.renderOverview || (() => {});
window.renderKanban = window.renderKanban || (() => {});
window.renderReports = window.renderReports || (() => {});

// ── State — artık DB'den geliyor ──
window.ST = {
  get activeProj() { return SS.get('activeProj') || null; },
  setActiveProj(v) { SS.set('activeProj', v); },

  // Bunlar hâlâ localStorage'da kalıyor
  get msgs() {
    const msgs = LS.get('msgs');
    if (!msgs || msgs.some(m => ['Mehmet K.', 'Can K.', 'Ece Ö.'].includes(m.from))) return DEFAULT_MSGS;
    return msgs;
  },
  get notifs() {
    const notifs = LS.get('notifs');
    if (!notifs || notifs.some(n => String(n.body || '').includes('Mehmet K.'))) return DEFAULT_NOTIFS;
    return notifs;
  },
  setMsgs(v)   { LS.set('msgs', v); },
  setNotifs(v) { LS.set('notifs', v); },

  // Artık kullanılmıyor
  get tasks()    { return []; },
  get projects() { return []; },
  setTasks()     {},
  setProjects()  {},
};

// ── Helpers ──
window.getProj = () => ST.projects.find(p => p.id === ST.activeProj) || ST.projects[0];

window.TAG_NAMES = {'pill-blue':'Frontend','pill-violet':'Backend','pill-green':'Tasarım','pill-amber':'DevOps','pill-red':'Kritik','pill-cyan':'Araştırma'};
window.PRIO_NAMES = {'pill-green':'Düşük','pill-amber':'Orta','pill-red':'Yüksek'};

// ── Toast ──
window.toast = (msg, type='info') => {
  const icons = {success:'✓',error:'✕',info:'·'};
  let stack = document.getElementById('toastStack');
  if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; stack.id = 'toastStack'; document.body.appendChild(stack); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-weight:700">${icons[type]}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(12px)'; el.style.transition='.25s'; setTimeout(()=>el.remove(),250); }, 2400);
};

// ── Add notification ──
window.addNotif = (icon, title, body) => {
  const notifs = ST.notifs;
  const user = getCurrentUser();
  notifs.unshift({id:'n'+Date.now(),icon,title,body,time:'Az önce',unread:true,userId:user.id});
  ST.setNotifs(notifs);
  updateBadge();
  notifyDemoSync('notification');
};

window.addNotifForUser = (userId, icon, title, body) => {
  const notifs = ST.notifs;
  notifs.unshift({id:'n'+Date.now(),icon,title,body,time:'Az önce',unread:true,userId});
  ST.setNotifs(notifs);
  notifyDemoSync('notification');
};

window.notifyAssignee = async (assignee, title) => {
  if (!assignee) return;

  try {
    const res = await fetch(`${API}/users`);
    const users = await res.json();
    const target = users.find((user) => {
      const initials = (user.initials || user.username || '').slice(0, 2).toUpperCase();
      return initials === String(assignee).toUpperCase();
    });

    if (target) {
      addNotifForUser(target.id, '📋', 'Yeni görev atandı', `"${title}" görevi size atandı.`);
    }
  } catch (err) {
    console.error('Görev bildirimi gönderilemedi:', err);
  }
};

// ── Update notification badge (call from each page) ──
window.updateBadge = () => {
  const user = getCurrentUser();
  const count = ST.notifs.filter(n => n.unread && (!n.userId || n.userId === user.id)).length;
  const dot = document.getElementById('notifDot');
  const badge = document.getElementById('navBadge');
  if (dot) dot.style.display = count ? 'block' : 'none';
  if (badge) { badge.style.display = count ? 'flex' : 'none'; badge.textContent = count; }
};

// ── Sidebar project list ──
window.renderProjDD = async () => {
  try {
    const user = getCurrentUser();
    let projects;

    if (user.role === 'admin') {
      const res = await fetch(`${API}/projects`);
      projects = await res.json();
    } else {
      const res = await fetch(`${API}/users/${user.id}/projects`);
      projects = await res.json();
    }

    if (!projects.length) {
      document.getElementById('projDDList').innerHTML = '<div style="padding:8px;color:var(--text3);font-size:12px;">Proje yok</div>';
      return;
    }

    // activeProj yoksa ilkini seç
    if (!ST.activeProj && projects.length) {
      ST.setActiveProj(projects[0].id);
    }

    // activeProj kullanıcının projelerinde yoksa ilkini seç
    const active = projects.find(p => p.id == ST.activeProj) || projects[0];
    if (active) ST.setActiveProj(active.id);

    const nameEl = document.getElementById('sidebarProjName');
    const dotEl  = document.getElementById('projColorDot');
    const topEl  = document.getElementById('topbarProjName');
    if (nameEl) nameEl.textContent = active?.name || 'Proje';
    if (dotEl)  dotEl.style.background = active?.color || '#2d5299';
    if (topEl)  topEl.textContent = active?.name || 'Proje';

    const list = document.getElementById('projDDList');
    if (list) list.innerHTML = projects.map(p => `
      <div class="pd-item ${p.id == ST.activeProj ? 'active' : ''}">
        <div style="display:flex; align-items:center; gap:8px; flex:1;" onclick="switchProj(${p.id})">
          <div class="pd-dot" style="background:${p.color}"></div>
          ${p.name}
        </div>
        ${user.role === 'admin' ? `
        <div style="position:relative;">
          <div onclick="event.stopPropagation(); toggleProjMenu(${p.id})" style="cursor:pointer; padding:4px;">⋮</div>
          <div id="menu-${p.id}" class="proj-menu" style="display:none;">
            <div onclick="deleteProject(${p.id})" class="proj-menu-item">Sil</div>
          </div>
        </div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Projeler yüklenemedi:', err);
  }
};

window.toggleProjMenu = (id) => {
  document.querySelectorAll('.proj-menu').forEach(m => m.style.display = 'none');
  const menu = document.getElementById('menu-' + id);
  if (menu) menu.style.display = 'block';
};

window.deleteProject = async (id) => {
  const res = await fetch(`${API}/projects`);
  const projects = await res.json();
  if (projects.length <= 1) { toast('En az 1 proje olmalı', 'error'); return; }

  await fetch(`${API}/projects/${id}`, { method: 'DELETE' });

  if (ST.activeProj == id) {
    const others = projects.filter(p => p.id != id);
    if (others.length) ST.setActiveProj(others[0].id);
  }

  renderProjDD();
  toast('Proje silindi', 'success');
  document.querySelectorAll('.proj-menu').forEach(m => m.style.display = 'none');
};

window.toggleProjDD = () => {
  const dd = document.getElementById('projDD');
  const ch = document.getElementById('projChevron');
  if (dd) dd.classList.toggle('show');
  if (ch) ch.classList.toggle('open');
};

window.getProj = async () => {
  const res = await fetch(`${API}/projects`);
  const projects = await res.json();
  return projects.find(p => p.id == ST.activeProj) || projects[0];
};


window.switchProj = (id) => {
  ST.setActiveProj(id);
  renderProjDD();
  const dd = document.getElementById('projDD');
  const ch = document.getElementById('projChevron');
  if (dd) dd.classList.remove('show');
  if (ch) ch.classList.remove('open');
  
  // Aktif sayfaya göre yenile
  if (typeof renderKanban === 'function') renderKanban();
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderReports === 'function') renderReports();
  
  toast('Proje değiştirildi', 'info');
};

// ── Chat render ──
window.renderChat = () => {
  const el = document.getElementById('chatMsgs');
  if (!el) return;
  const user = getCurrentUser();
  el.innerHTML = ST.msgs.map(m => `
    <div class="msg-group ${(m.userId && m.userId === user.id) || m.me ? 'mine' : ''}">
      ${!((m.userId && m.userId === user.id) || m.me) ? `<div class="msg-sender-name">${m.from}</div>` : ''}
      <div class="msg-bubble ${((m.userId && m.userId === user.id) || m.me) ? 'mine' : 'them'}">${m.text}</div>
      <div class="msg-time">${m.time}</div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
};

const BOT_REPLIES = ['Anladım, teşekkürler!','Harika, devam edelim 👍','Bakıyorum şimdi.','Tamam, ilgileneceğim.','Güzel iş!','Bunu not ettim.','👌'];
const BOT_NAMES   = ['Ebubekir K.','Samet K.','Safa A.'];

window.sendMsg = () => {
  const input = document.getElementById('chatInput');
  const text  = input?.value.trim();
  if (!text) return;
  const user = getCurrentUser();
  const now = new Date();
  const time = now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  const msgs = ST.msgs;
  msgs.push({id:'m'+Date.now(),from:user.username || 'Kullanıcı',userId:user.id,text,time,me:false});
  ST.setMsgs(msgs);
  renderChat();
  input.value = '';
  notifyDemoSync('chat');
};

// ── Kanban card HTML ──
window.taskCardHTML = (t) => {
  const today = new Date().toISOString().split('T')[0];
  const dl = t.deadline ? t.deadline.split('T')[0] : null;
  const isOverdue = dl && dl < today;
  const canManage = canManageTask(t);
  const canDelete = isAdmin();
  return `
  <div class="k-card" draggable="${canManage}" id="c-${t.id}"
    ondragstart="dstart('${t.id}')" ondragend="dend()">
    <div class="k-card-top">
      <div class="k-card-title">${t.title}</div>
      ${canManage ? `<div class="k-card-menu">
        ${isAdmin() ? `<div class="k-menu-btn" onclick="window.openEditTask(${t.id})">✎</div>` : ''}
        ${!isAdmin() && t.col !== 'done' ? `<div class="k-menu-btn" title="Tamamlandı yap" onclick="window.markTaskDone(${t.id})">✓</div>` : ''}
        ${canDelete ? `<div class="k-menu-btn del" onclick="window.delTask(${t.id})">✕</div>` : ''}
      </div>` : ''}
    </div>
    ${t.desc||t.description ? `<div class="k-card-desc">${t.desc||t.description}</div>` : ''}
    <div class="k-card-footer">
      <span class="pill ${t.tag}">${TAG_NAMES[t.tag]||t.tag}</span>
      <span class="pill ${t.priority}">${PRIO_NAMES[t.priority]||t.priority}</span>
      ${t.assignee ? `<div class="k-assignee" title="${t.assignee}">${t.assignee}</div>` : ''}
      ${dl ? `<div class="k-card-deadline ${isOverdue ? 'overdue' : ''}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${dl}
      </div>` : ''}
    </div>
  </div>`;
};

window.markTaskDone = async (id) => {
  await fetch(`${API}/tasks/${id}/col`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ col: 'done' })
  });
  toast('Görev tamamlandı olarak işaretlendi', 'success');
  addNotif('✅', 'Görev tamamlandı', 'Çalışan bir görevi tamamlandı olarak işaretledi.');
  notifyDemoSync('task-updated', { id, col: 'done' });
  refreshDemoViews();
};

window.getTaskInsights = (tasks = []) => {
  const today = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter((t) => t.col !== 'done');
  const done = tasks.filter((t) => t.col === 'done').length;
  const total = tasks.length || 1;
  const overdue = activeTasks.filter((t) => t.deadline && t.deadline.split('T')[0] < today);
  const upcoming = activeTasks
    .filter((t) => t.deadline && t.deadline.split('T')[0] >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const highPriorityOpen = activeTasks.filter((t) => t.priority === 'pill-red');
  const unassigned = activeTasks.filter((t) => !t.assignee);
  const completion = Math.round((done / total) * 100);
  const healthScore = Math.max(
    0,
    Math.min(100, completion - overdue.length * 8 - highPriorityOpen.length * 4 - unassigned.length * 2)
  );

  return {
    activeTasks,
    completion,
    healthScore,
    highPriorityOpen,
    overdue,
    upcoming,
    unassigned,
  };
};

window.renderProjectInsights = (tasks = []) => {
  const el = document.getElementById('projectInsights');
  if (!el) return;

  const insights = getTaskInsights(tasks);
  const healthClass =
    insights.healthScore >= 75 ? 'risk-ok' :
    insights.healthScore >= 45 ? 'risk-warn' :
    'risk-bad';
  const healthColor =
    insights.healthScore >= 75 ? 'var(--green)' :
    insights.healthScore >= 45 ? 'var(--amber)' :
    'var(--red)';
  const healthLabel =
    insights.healthScore >= 75 ? 'Kontrollü ilerliyor' :
    insights.healthScore >= 45 ? 'Dikkat gerektiriyor' :
    'Riskli proje';

  const upcomingItems = insights.upcoming.slice(0, 3).map((task) => `
    <div class="insight-row">
      <span>${task.title}</span>
      <strong>${task.deadline.split('T')[0]}</strong>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="insight-card" style="cursor:pointer;" onclick="alert('Sağlık Puanı Hesaplanışı:\\n\\nTemel Puan: %' + Math.round(${insights.completion}) + '\\n- Geciken görev başına 8 puan ceza (' + ${insights.overdue.length} + ' * 8)\\n- Kritik açık görev başına 4 puan ceza (' + ${insights.highPriorityOpen.length} + ' * 4)\\n- Sorumlusuz görev başına 2 puan ceza (' + ${insights.unassigned.length} + ' * 2)\\n\\nToplam Sağlık Puanı: ' + ${insights.healthScore} + ' Puan')">
      <div class="insight-head">
        <div class="insight-title" style="text-decoration: underline dashed; text-underline-offset: 4px;">Proje Sağlığı ℹ️</div>
        <span class="risk-pill ${healthClass}">${healthLabel}</span>
      </div>
      <div class="health-score" style="color:${healthColor}">${insights.healthScore}</div>
      <div class="health-label">%${insights.completion} tamamlanma, ${insights.activeTasks.length} aktif görev</div>
      <div class="health-meter"><div class="health-meter-fill" style="width:${insights.healthScore}%;background:${healthColor}"></div></div>
    </div>
    <div class="insight-card" style="cursor:pointer;" onclick="alert('Risk Özeti Kriterleri:\\n\\n- Geciken Görev: Bitiş tarihi geçmiş olan açık görevler.\\n- Kritik Açık Görev: Önceliği Yüksek (Kırmızı) olan ancak henüz tamamlanmamış görevler.\\n- Sorumlusuz Görev: Herhangi bir kişiye atanmamış, sahipsiz görevler.')">
      <div class="insight-head"><div class="insight-title" style="text-decoration: underline dashed; text-underline-offset: 4px;">Risk Özeti ℹ️</div></div>
      <div class="insight-list">
        <div class="insight-row"><span>Geciken görev</span><strong>${insights.overdue.length}</strong></div>
        <div class="insight-row"><span>Kritik açık görev</span><strong>${insights.highPriorityOpen.length}</strong></div>
        <div class="insight-row"><span>Sorumlusuz görev</span><strong>${insights.unassigned.length}</strong></div>
      </div>
    </div>
    <div class="insight-card">
      <div class="insight-head"><div class="insight-title">Yaklaşan İşler</div></div>
      <div class="insight-list">
        ${upcomingItems || '<div class="insight-empty">Yaklaşan deadline bulunmuyor.</div>'}
      </div>
    </div>
  `;
};

window.openEditTask = function(id) {
  const t = (typeof _allTasks !== 'undefined' ? _allTasks : []).find(x => x.id == id);
  if (!t) return;
  _editingTask = parseInt(id);
  document.getElementById('taskModalTitle').textContent = 'Görevi Düzenle';
  document.getElementById('mTitle').value    = t.title;
  document.getElementById('mDesc').value     = t.description || '';
  document.getElementById('mTag').value      = t.tag;
  document.getElementById('mPriority').value = t.priority;
  document.getElementById('mAssignee').value = t.assignee || '';
  document.getElementById('mCol').value      = t.col;
  const dlEl = document.getElementById('mDeadline');
  if (dlEl) {
    dlEl.value = t.deadline ? t.deadline.split('T')[0] : '';
    dlEl.closest('.field-row').style.display = 
      isAdmin() ? '' : 'none';
  }
  document.getElementById('taskModalBg').classList.add('open');
};

// ── Drag state ──
window._dragId = null;
window.dstart  = id => { window._dragId = id; setTimeout(()=>{ const e=document.getElementById('c-'+id); if(e) e.classList.add('dragging'); },0); };
window.dend    = () => {
  if (window._dragId) { const e=document.getElementById('c-'+window._dragId); if(e) e.classList.remove('dragging'); }
  window._dragId = null;
  document.querySelectorAll('.k-col').forEach(c=>c.classList.remove('drag-over'));
};
window.dover  = (e,col) => { e.preventDefault(); document.querySelectorAll('.k-col').forEach(c=>c.classList.remove('drag-over')); const ce=document.getElementById('col-'+col); if(ce)ce.classList.add('drag-over'); };
window.dleave = col => { const ce=document.getElementById('col-'+col); if(ce)ce.classList.remove('drag-over'); };
window.ddrop = async (e, col) => {
  e.preventDefault();
  if (!window._dragId) return;
  await fetch(`${API}/tasks/${window._dragId}/col`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ col })
  });
  notifyDemoSync('task-updated', { id: window._dragId, col });
  window._dragId = null;
  document.querySelectorAll('.k-col').forEach(c => c.classList.remove('drag-over'));
  if (typeof renderKanban === 'function') renderKanban();
};

// ── Topbar highlight active nav ──
window.highlightNav = (page) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('nav-'+page);
  if (el) el.classList.add('active');
};

window.renderUserPill = () => {
  const user = getCurrentUser();
  const username = user.username || 'Kullanıcı';
  const initials = username.slice(0, 2).toUpperCase();

  const nameEl = document.getElementById('userPillName');
  const avEl   = document.getElementById('userPillAv');
  if (nameEl) nameEl.textContent = username;
  if (avEl)   avEl.textContent = initials;
  initUserPill();
};
// ── User Pill Dropdown ──
window.initUserPill = () => {
  const pill = document.querySelector('.user-pill');
  if (!pill) return;
  if (document.getElementById('userDropdown')) return;

  // Dropdown oluştur
  const dropdown = document.createElement('div');
  dropdown.id = 'userDropdown';
  dropdown.style.cssText = `
    display:none; position:absolute; top:calc(100% + 8px); right:0;
    background:var(--surface, #1e1e2e);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
    box-shadow:0 4px 16px rgba(0,0,0,0.15); min-width:180px; z-index:999; overflow:hidden;
  `;

  const user = getCurrentUser();
  const initials = (user.username || 'U').slice(0, 2).toUpperCase();

  dropdown.innerHTML = `
    <div style="padding:0.75rem 1rem; border-bottom:1px solid var(--border);">
      <div style="font-size:0.85rem; font-weight:600; color:var(--fg);">${user.username || 'Kullanıcı'}</div>
      <div style="font-size:0.75rem; color:var(--fg2); margin-top:2px;">${user.role || 'user'}</div>
    </div>
    <div style="padding:0.4rem;">
      <div class="user-dd-item" onclick="window.location.href='profil.html'" style="padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.85rem; color:var(--fg); display:flex; align-items:center; gap:0.5rem;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Profilim
      </div>
      <div class="user-dd-item" onclick="logout()" style="padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.85rem; color:var(--red,#ef4444); display:flex; align-items:center; gap:0.5rem;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Çıkış Yap
      </div>
    </div>
  `;

  // Hover efekti
  dropdown.querySelectorAll('.user-dd-item').forEach(item => {
    item.addEventListener('mouseenter', () => item.style.background = 'var(--hover, rgba(0,0,0,0.05))');
    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
  });

  pill.style.position = 'relative';
  pill.style.cursor = 'pointer';
  pill.appendChild(dropdown);

  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
  });

  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });
};

window.logout = () => {
  clearCurrentUser();
  window.location.href = 'login.html';
};

// ── Theme toggle ──
window.getTheme = () => localStorage.getItem('dct_theme') || 'dark';

window.applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dct_theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
};

window.toggleTheme = () => {
  const current = getTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
};

const ROLE_COLORS = {
  'frontend':  'pill-blue',
  'backend':   'pill-violet',
  'tasarim':   'pill-green',
  'devops':    'pill-amber',
  'admin':     'pill-red',
  'test uzmani': 'pill-green',
  'scrum master': 'pill-amber',
  'raporlama sorumlusu': 'pill-cyan',
  'musteri temsilcisi': 'pill-violet',
  'veri tabani': 'pill-red',
  'user':      'pill-cyan',
};

function normalizeRole(role) {
  return (role || '').toLowerCase()
    .replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u')
    .replace(/ö/g,'o').replace(/ı/g,'i').replace(/ç/g,'c')
    .trim();
}

window.loadTagOptions = async () => {
  try {
    const res = await fetch(`${API}/users/roles/all`);
    const roles = await res.json();
    const options = roles.map(role => {
      const color = ROLE_COLORS[normalizeRole(role)] || 'pill-blue';
      return `<option value="${color}">${role}</option>`;
    });
    document.querySelectorAll('#mTag').forEach(sel => {
      sel.innerHTML = options.join('');
    });
  } catch(e) { console.error('Roller yüklenemedi', e); }
};


