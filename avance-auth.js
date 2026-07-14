/* Avance Care — shared access-code gate (convenience gate, not strong security).
   Pages wrap content in <div id="appShell" style="display:none">…</div> and may
   define window.startDashboard() to run after unlock.
   To change the code: set a new code, recompute its SHA-256 (lowercased, trimmed),
   and replace CODE_HASH below.  Current code: "AvanceVBC2026" (case-insensitive). */
(function(){
  const CODE_HASH="9d436c40a7f7d415ef4cfe7a2632339cce896441c7fb254a75b66567f3864a9d";
  const KEY="avanceAccessV1";
  const $=id=>document.getElementById(id);

  async function sha(s){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function msg(t,c){const e=$('loginMsg');if(e){e.textContent=t;e.style.color=c||'#6B7A80';}}

  function injectLogin(){
    const ex=$('login-screen'); if(ex) ex.remove();   // replace any legacy login UI
    const d=document.createElement('div'); d.id='login-screen';
    d.style.cssText="position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:linear-gradient(120deg,#232456,#2B2C6B 55%,#5C6CB8);padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    d.innerHTML="<div style=\"background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.35);max-width:420px;width:100%;padding:32px 32px 26px;text-align:center\">"+
      "<svg width=\"54\" height=\"43\" viewBox=\"0 0 120 96\"><polygon points=\"34,14 56,90 8,90\" fill=\"#5FBE57\"/><polygon points=\"64,8 98,90 38,90\" fill=\"#4A5BA8\"/></svg>"+
      "<div style=\"font-size:21px;font-weight:300;color:#6D6E71\"><b style=\"font-weight:700;color:#4A5BA8\">Avance</b>Care</div>"+
      "<div style=\"font-size:16px;font-weight:800;color:#2B2C6B;margin-top:10px\">Leadership Dashboards</div>"+
      "<div style=\"font-size:12.5px;color:#6B7A80;margin:8px 0 18px;line-height:1.5\">Enter the access code to continue.</div>"+
      "<input id=\"loginCode\" type=\"password\" autocomplete=\"off\" placeholder=\"Access code\" style=\"width:100%;padding:12px 13px;border:1px solid #CBD2EC;border-radius:9px;font-size:14px;margin-bottom:10px;outline:none;text-align:center;letter-spacing:.5px\">"+
      "<button id=\"loginBtn\" style=\"width:100%;padding:12px;border:none;border-radius:9px;background:#2B2C6B;color:#fff;font-size:14px;font-weight:700;cursor:pointer\">Enter</button>"+
      "<div id=\"loginMsg\" style=\"font-size:12.5px;margin-top:13px;min-height:18px;line-height:1.45\"></div>"+
      "<div style=\"font-size:10.5px;color:#9aa6ad;margin-top:16px;line-height:1.5\">Authorized users only · illustrative / synthetic data — no patient information.</div></div>";
    document.body.appendChild(d);
  }

  function reveal(){
    const ls=$('login-screen'); if(ls) ls.style.display='none';
    const shell=$('appShell'); if(shell) shell.style.display='block';
    const w=$('whoami'); if(w) w.textContent='authorized';
    if(window.startDashboard) window.startDashboard();
  }
  function lock(){
    const shell=$('appShell'); if(shell) shell.style.display='none';
    const ls=$('login-screen'); if(ls) ls.style.display='flex';
    const c=$('loginCode'); if(c){c.value='';c.focus();}
  }

  async function tryCode(v){
    const h=await sha((v||'').trim().toLowerCase());
    if(h===CODE_HASH){ try{localStorage.setItem(KEY,'ok');}catch(e){} reveal(); }
    else { msg('Incorrect access code.','#C0392B'); }
  }

  function start(){
    injectLogin();
    const btn=$('loginBtn'), inp=$('loginCode');
    if(btn) btn.onclick=()=>tryCode(inp.value);
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter')tryCode(inp.value);});
    window.avanceSignOut=()=>{ try{localStorage.removeItem(KEY);}catch(e){} lock(); };
    let ok=false; try{ok=localStorage.getItem(KEY)==='ok';}catch(e){}
    if(ok) reveal(); else lock();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
