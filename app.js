/* Shared Firebase setup and helpers for the learning hub pages */
const firebaseConfig = {
  apiKey: "AIzaSyBRdhNInntNmDUKyGCsSNNKbdYmIWyh5ts",
  authDomain: "queen-of-art.firebaseapp.com",
  projectId: "queen-of-art",
  storageBucket: "queen-of-art.firebasestorage.app",
  messagingSenderId: "681441268668",
  appId: "1:681441268668:web:ef7e01b245bb96995291b9"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// Admin email(s) — matches Firestore rules
const ADMIN_EMAILS = ['almirabagro12@gmail.com'];

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

// ========== AUTH — Use Netlify Identity ==========
async function authReady() {
  return new Promise(resolve => {
    // Return immediately if already logged in
    if (window.netlifyIdentity) {
      const current = window.netlifyIdentity.currentUser();
      if (current) return resolve(current);
      // Wait for login event
      window.netlifyIdentity.on("login", user => resolve(user));
    } else {
      resolve(null);
    }
  });
}

function isAdminUser(user) {
  // Check Netlify Identity roles
  if (!user) return false;
  if (user.roles && user.roles.includes('admin')) return true;
  // Fallback: check email directly (in case roles haven't synced yet)
  const email = user.email || (user.user && user.user.email);
  return ADMIN_EMAILS.includes(email);
}

function say(id, text, ok){ const m = $(id); if(!m) return; m.textContent = text; m.className = 'msg ' + (ok ? 'ok' : 'err'); }

function safeUrl(u){ try{ const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; }catch(e){ return ''; } }

function videoEmbed(url){
  try{
    const u = new URL(url); let id = '';
    if(u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if(u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : '');
    if(id && /^[\w-]{6,20}$/.test(id)) return 'https://www.youtube-nocookie.com/embed/' + id;
    if(u.hostname.includes('drive.google.com')){ 
      const m = u.pathname.match(/\/file\/d\/([^/]+)/); 
      if(m) return 'https://drive.google.com/file/d/' + m[1] + '/preview'; 
    }
  }catch(e){}
  return '';
}

function renderTopbar(){
  $('top').innerHTML =
    '<div class="bar"><a class="logo" href="index.html">Queen of Art</a><nav>' +
    '<a href="index.html">Home</a><a href="courses.html">Learning hub</a><a href="payment.html">How to pay</a>' +
    '<a href="profile.html" id="tbProfile" class="hide">My profile</a>' +
    '<a href="admin.html" id="tbAdmin" class="hide">Admin</a>' +
    '<a href="register.html" id="tbLogin">Log in</a>' +
    '<button type="button" class="linkbtn hide" id="tbOut">Log out</button></nav></div>';

  // Update navigation based on Netlify Identity
  const updateNav = () => {
    const user = window.netlifyIdentity?.currentUser();
    const isLoggedIn = !!user;
    const isAdmin = isLoggedIn && isAdminUser(user);

    $('tbLogin').classList.toggle('hide', isLoggedIn);
    $('tbProfile').classList.toggle('hide', !isLoggedIn);
    $('tbOut').classList.toggle('hide', !isLoggedIn);
    $('tbAdmin').classList.toggle('hide', !isAdmin);
  };

  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", updateNav);
    window.netlifyIdentity.on("login", updateNav);
    window.netlifyIdentity.on("logout", updateNav);
  }

  $('tbOut').onclick = () => {
    window.netlifyIdentity?.logout();
    location.href = 'index.html';
  };
}
