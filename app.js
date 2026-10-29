/* Queen of Art - shared helpers (Firebase Auth version, no Netlify) */

const firebaseConfig = {
  apiKey: "AIzaSyBRdhNInntNmDUKyGCsSNNKbdYmIWyh5ts",
  authDomain: "queen-of-art.firebaseapp.com",
  projectId: "queen-of-art",
  storageBucket: "queen-of-art.firebasestorage.app",
  messagingSenderId: "681441268668",
  appId: "1:681441268668:web:ef7e01b245bb96995291b9"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* Convenience check only. The real protection is your Firestore rules. */
const ADMIN_EMAILS = ['almirabagro12@gmail.com'];

const $ = id => document.getElementById(id);
const esc = t => (t == null ? '' : String(t)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

/* Returns the URL itself when it starts with http(s)://, otherwise an empty string */
const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');

/* Turns a YouTube, Google Drive or Vimeo link into an embeddable address (or '' if unknown) */
function videoEmbed(u) {
  if (!u) return '';
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return 'https://www.youtube.com/embed/' + m[1];
  m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return 'https://player.vimeo.com/video/' + m[1];
  return '';
}

/* Resolves to the logged-in Firebase user, or null, once Firebase knows */
let _ready = null;
function authReady() {
  if (!_ready) {
    _ready = new Promise(res => {
      const off = auth.onAuthStateChanged(u => { off(); res(u || null); });
    });
  }
  return _ready;
}

const isAdminUser = u => !!u && ADMIN_EMAILS.includes((u.email || '').trim().toLowerCase());

/* ---------- Top bar ---------- */
function renderTopbar() {
  if (!document.getElementById('qoaBarCss')) {
    const st = document.createElement('style');
    st.id = 'qoaBarCss';
    st.textContent = `
.hide{display:none!important}
.acct{position:relative;display:inline-block}
#acctBtn{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:4px 14px 4px 4px;font:inherit;font-weight:600;cursor:pointer}
#acctBtn .av{width:30px;height:30px;border-radius:50%;background:var(--marigold,#f5b800);color:#2a1157;display:inline-flex;align-items:center;justify-content:center;font-weight:800}
.acct .menu{position:absolute;right:0;top:calc(100% + 8px);min-width:230px;background:#fff;color:#1b1030;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.25);padding:8px;z-index:50;text-align:left}
.acct .menu .who{display:flex;flex-direction:column;padding:8px 10px;border-bottom:1px solid #eee;margin-bottom:6px}
.acct .menu .who span{font-size:.85rem;color:#666;word-break:break-all}
.acct .menu a,.acct .menu button{display:block;width:100%;text-align:left;padding:8px 10px;border:0;background:none;color:#1b1030;font:inherit;border-radius:8px;cursor:pointer;text-decoration:none}
.acct .menu a:hover,.acct .menu button:hover{background:#f0e9ff}
.nav-login{border:2px solid rgba(255,255,255,.5);border-radius:999px;padding:6px 16px}`;
    document.head.appendChild(st);
  }

  const header = $('top');
  if (!header) return;
  header.innerHTML = `
  <div class="bar">
    <a class="logo" href="index.html">Queen of Art</a>
    <nav aria-label="Main">
      <a href="index.html#courses">Courses</a>
      <a href="index.html#pricing">Pricing</a>
      <a href="index.html#mentors">Mentors</a>
      <a href="index.html#tools">Tools</a>
      <a href="index.html#contact">Contact</a>
      <a href="courses.html">Learning hub</a>
      <a href="admin-dashboard.html" id="navAdmin" class="hide" style="font-weight:bold;color:var(--marigold)">Admin</a>
      <a href="login.html" id="navLogin" class="nav-login hide">Log in</a>
      <div class="acct hide" id="acct">
        <button type="button" id="acctBtn" aria-expanded="false" aria-haspopup="true">
          <span class="av" id="avatar">A</span><span id="acctName"></span>
        </button>
        <div class="menu hide" id="acctMenu">
          <div class="who"><strong id="menuName"></strong><span id="menuEmail"></span></div>
          <a href="profile.html">My profile</a>
          <button type="button" id="navLogout">Log out</button>
        </div>
      </div>
    </nav>
  </div>`;

  const closeMenu = () => { $('acctMenu').classList.add('hide'); $('acctBtn').setAttribute('aria-expanded', 'false'); };
  $('acctBtn').onclick = e => {
    e.stopPropagation();
    const open = $('acctMenu').classList.toggle('hide') === false;
    $('acctBtn').setAttribute('aria-expanded', open);
  };
  document.addEventListener('click', e => { if ($('acct') && !$('acct').contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  $('navLogout').onclick = () => auth.signOut().then(() => { location.href = 'index.html'; });

  auth.onAuthStateChanged(user => {
    $('navLogin').classList.toggle('hide', !!user);
    $('acct').classList.toggle('hide', !user);
    $('navAdmin').classList.toggle('hide', !isAdminUser(user));
    if (user) {
      const name = user.displayName || (user.email || 'Student').split('@')[0];
      $('avatar').textContent = name.trim().charAt(0).toUpperCase();
      $('acctName').textContent = name.trim().split(' ')[0];
      $('menuName').textContent = name;
      $('menuEmail').textContent = user.email || '';
    }
  });
}
