/* Avance Care — shared email-link auth gate (Firebase passwordless).
   Used by every /avance dashboard. Edit ALLOW to change who has access.
   Pages must wrap their content in <div id="appShell" style="display:none">…</div>.
   Optional: define window.startDashboard() to run after sign-in (chart sizing). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig={apiKey:"AIzaSyC5mOkljbkSMCMhRf-jrJ7TIpkESMTcxHY",authDomain:"mikedulinmd-cf65b.firebaseapp.com",projectId:"mikedulinmd-cf65b",storageBucket:"mikedulinmd-cf65b.firebasestorage.app",messagingSenderId:"714928483011",appId:"1:714928483011:web:dd1b266d77c6042c6f5076",measurementId:"G-TCW130CK2R"};
const app=initializeApp(firebaseConfig); const auth=getAuth(app);

const ALLOW=['mdulin@gmail.com','asteventon@avancecare.com','cdauer@avancecare.com','jhutchings@avancecare.com'];
const PAGE=window.location.origin+window.location.pathname;
const $=id=>document.getElementById(id);
function msg(t,c){const e=$('loginMsg');if(e){e.textContent=t;e.style.color=c||'#6B7A80';}}

function ensureLogin(){
  if($('login-screen'))return;
  const d=document.createElement('div'); d.id='login-screen';
  d.style.cssText="position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:linear-gradient(120deg,#232456,#2B2C6B 55%,#5C6CB8);padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  d.innerHTML="<div style=\"background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.35);max-width:430px;width:100%;padding:32px 32px 26px;text-align:center\">"+
    "<svg width=\"54\" height=\"43\" viewBox=\"0 0 120 96\"><polygon points=\"34,14 56,90 8,90\" fill=\"#5FBE57\"/><polygon points=\"64,8 98,90 38,90\" fill=\"#4A5BA8\"/></svg>"+
    "<div style=\"font-size:21px;font-weight:300;color:#6D6E71\"><b style=\"font-weight:700;color:#4A5BA8\">Avance</b>Care</div>"+
    "<div style=\"font-size:16px;font-weight:800;color:#2B2C6B;margin-top:10px\">Leadership Dashboards</div>"+
    "<div style=\"font-size:12.5px;color:#6B7A80;margin:8px 0 18px;line-height:1.5\">Restricted access. Enter your authorized email to receive a one-time sign-in link.</div>"+
    "<input id=\"loginEmail\" type=\"email\" autocomplete=\"email\" placeholder=\"you@avancecare.com\" style=\"width:100%;padding:12px 13px;border:1px solid #CBD2EC;border-radius:9px;font-size:14px;margin-bottom:10px;outline:none\">"+
    "<button id=\"loginBtn\" style=\"width:100%;padding:12px;border:none;border-radius:9px;background:#2B2C6B;color:#fff;font-size:14px;font-weight:700;cursor:pointer\">Email me a sign-in link</button>"+
    "<div id=\"loginMsg\" style=\"font-size:12.5px;margin-top:13px;min-height:18px;line-height:1.45\"></div>"+
    "<div style=\"font-size:10.5px;color:#9aa6ad;margin-top:16px;line-height:1.5\">Authorized users only · illustrative / synthetic data — no patient information.</div></div>";
  document.body.appendChild(d);
}

function start(){
  ensureLogin();
  const btn=$('loginBtn');
  if(btn){
    btn.onclick=()=>{
      const email=(($('loginEmail').value)||'').trim().toLowerCase();
      if(!ALLOW.includes(email)){msg('That email is not authorized for these dashboards.','#C0392B');return;}
      msg('Sending link…');
      sendSignInLinkToEmail(auth,email,{url:PAGE,handleCodeInApp:true})
        .then(()=>{localStorage.setItem('avanceEmailForSignIn',email);msg('Check your inbox — a one-time sign-in link was sent to '+email+'.','#2F9E45');})
        .catch(e=>msg('Could not send link: '+e.message,'#C0392B'));
    };
    $('loginEmail').addEventListener('keydown',e=>{if(e.key==='Enter')btn.click();});
  }
  if(isSignInWithEmailLink(auth,window.location.href)){
    let email=localStorage.getItem('avanceEmailForSignIn')||window.prompt('Confirm your email to finish signing in');
    if(email){signInWithEmailLink(auth,email,window.location.href)
      .then(()=>{localStorage.removeItem('avanceEmailForSignIn');history.replaceState(null,'',PAGE);})
      .catch(()=>msg('That sign-in link is invalid or expired — request a new one.','#C0392B'));}
  }
  window.avanceSignOut=()=>signOut(auth);
  onAuthStateChanged(auth,user=>{
    const shell=$('appShell');
    if(user&&ALLOW.includes((user.email||'').toLowerCase())){
      if($('login-screen'))$('login-screen').style.display='none';
      if(shell)shell.style.display='block';
      const w=$('whoami'); if(w)w.textContent=user.email;
      if(window.startDashboard)window.startDashboard();
    }else{
      if(user){signOut(auth);msg('Access denied for '+user.email+'. These dashboards are restricted.','#C0392B');}
      if($('login-screen'))$('login-screen').style.display='flex';
      if(shell)shell.style.display='none';
    }
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start); else start();
