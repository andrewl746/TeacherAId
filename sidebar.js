// sidebar.js — shared teacher sidebar

function buildSidebar(activeId) {
  const navItems = [
    { id: 'dashboard',  icon: '⊞', label: 'Dashboard',        href: 'teacher-dashboard.html' },
    { id: 'questions',  icon: '❓', label: 'Questions',         href: 'teacher-questions.html' },
    { id: 'create',     icon: '✏️', label: 'Create Question',   href: 'teacher-create-question.html' },
    { id: 'generate',   icon: '✨', label: 'Generate Question', href: 'teacher-generate-question.html' },
    { id: 'students',   icon: '👥', label: 'Students',          href: 'teacher-students.html' },
    { id: 'analytics',  icon: '📊', label: 'Class Analytics',   href: 'class-analytics.html' },
  ];

  const navHTML = navItems.map(item => `
    <a href="${item.href}" class="nav-item${item.id === activeId ? ' active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      ${item.label}
    </a>
  `).join('');

  return `
    <nav class="sidebar">
      <a class="sidebar-logo" href="teacher-dashboard.html">
        <div class="sidebar-logo-img">
          <img src="images/logo.png" alt="TeacherAId"/>
        </div>
        <div class="sidebar-logo-text">Teacher<span>AId</span></div>
      </a>
      <div class="sidebar-section">Navigation</div>
      ${navHTML}
      <div class="sidebar-spacer"></div>
      <div class="sidebar-footer">
        <div class="teacher-badge" id="teacherBadge">
          <div class="teacher-avatar" id="teacherAvatar">?</div>
          <div class="teacher-info">
            <div class="t-name" id="teacherBadgeName">Loading…</div>
            <div class="t-role">Teacher</div>
          </div>
        </div>
        <button onclick="sidebarSignOut()" class="nav-item" style="margin-top:8px;color:rgba(255,255,255,.4);width:calc(100% - 16px);font-family:var(--font);">
          <span class="nav-icon">←</span> Sign out
        </button>
      </div>
    </nav>
  `;
}

// Called after render to populate teacher name from Firebase
async function initSidebarProfile() {
  try {
    const { getCurrentUserProfile } = await import('./firebase.js');
    const profile = await getCurrentUserProfile();
    if (profile) {
      const name = profile.name || 'Teacher';
      const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      const el = document.getElementById('teacherBadgeName');
      const av = document.getElementById('teacherAvatar');
      if (el) el.textContent = name;
      if (av) av.textContent = initials;
    }
  } catch(e) { /* silent */ }
}

async function sidebarSignOut() {
  const { logoutUser } = await import('./firebase.js');
  await logoutUser();
}
