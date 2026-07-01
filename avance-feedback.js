/* Avance Care — shared feedback widget.
   Floating "Feedback" button on every dashboard → rating + category + note.
   Saves to localStorage ("avanceFeedback") and opens a pre-filled email.
   Change FEEDBACK_EMAIL to route feedback elsewhere. */
(function(){
  var FEEDBACK_EMAIL="mdulin@gmail.com";
  var KEY="avanceFeedback";
  if(document.getElementById("avance-fb-css")) return;

  var css=document.createElement("style"); css.id="avance-fb-css";
  css.textContent=""
    +".fb-btn{position:fixed;right:22px;bottom:22px;z-index:45;display:flex;align-items:center;gap:8px;background:#2B2C6B;color:#fff;border:none;border-radius:24px;padding:11px 16px;font:600 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;box-shadow:0 6px 20px rgba(30,40,60,.28);cursor:pointer}"
    +".fb-btn:hover{background:#232456}"
    +".fb-overlay{position:fixed;inset:0;z-index:70;background:rgba(20,25,45,.45);display:flex;align-items:flex-end;justify-content:flex-end;padding:20px}"
    +".fb-overlay[hidden]{display:none}"
    +".fb-card{background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(20,25,45,.35);width:380px;max-width:100%;padding:18px 20px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;animation:fbpop .14s ease}"
    +"@keyframes fbpop{from{transform:translateY(8px);opacity:.6}to{transform:none;opacity:1}}"
    +".fb-head{display:flex;align-items:center;justify-content:space-between}"
    +".fb-t{font-size:16px;font-weight:800;color:#2B2C6B}"
    +".fb-x{border:none;background:#F0F2F6;border-radius:8px;width:28px;height:28px;font-size:16px;cursor:pointer;color:#6B7A80}"
    +".fb-sub{font-size:11.5px;color:#6B7A80;margin:3px 0 12px}"
    +".fb-rate{display:flex;gap:8px;margin-bottom:10px}"
    +".fb-r{flex:1;border:1px solid #CBD2EC;background:#fff;border-radius:9px;padding:8px;font-size:12.5px;font-weight:700;color:#2B2C6B;cursor:pointer}"
    +".fb-r.on[data-r='up']{background:#E6F2E6;border-color:#4CB749;color:#2F9E45}"
    +".fb-r.on[data-r='down']{background:#FBE7E7;border-color:#C0392B;color:#C0392B}"
    +".fb-card select,.fb-card textarea{width:100%;border:1px solid #CBD2EC;border-radius:9px;padding:9px 10px;font:inherit;font-size:13px;margin-bottom:10px;color:#26303A;background:#fff}"
    +".fb-card textarea{min-height:88px;resize:vertical}"
    +".fb-actions{display:flex;gap:8px}"
    +".fb-send{flex:1;border:none;border-radius:9px;background:#2B2C6B;color:#fff;font-weight:700;font-size:13px;padding:10px;cursor:pointer}"
    +".fb-send:hover{background:#232456}"
    +".fb-ghost{border:1px solid #CBD2EC;background:#fff;border-radius:9px;color:#6B7A80;font-weight:600;font-size:13px;padding:10px 14px;cursor:pointer}"
    +".fb-msg{font-size:12px;margin-top:9px;min-height:16px;font-weight:600}"
    +".fb-note{font-size:10.5px;color:#9aa6ad;margin-top:8px;line-height:1.4}";
  document.head.appendChild(css);

  function mount(){
    if(document.getElementById("fbBtn")) return;
    var host=document.getElementById("appShell")||document.body; // inside appShell → hidden until unlock
    var btn=document.createElement("button"); btn.id="fbBtn"; btn.className="fb-btn";
    btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Feedback';
    var ov=document.createElement("div"); ov.id="fbModal"; ov.className="fb-overlay"; ov.hidden=true;
    ov.innerHTML=''
      +'<div class="fb-card">'
      +'<div class="fb-head"><div class="fb-t">Share feedback</div><button class="fb-x" id="fbClose" aria-label="Close">&times;</button></div>'
      +'<div class="fb-sub" id="fbCtx"></div>'
      +'<div class="fb-rate"><button class="fb-r" data-r="up" type="button">Helpful</button><button class="fb-r" data-r="down" type="button">Needs work</button></div>'
      +'<select id="fbCat"><option>General</option><option>Bug / not working</option><option>Data looks wrong</option><option>New metric / idea</option><option>Design / layout</option></select>'
      +'<textarea id="fbText" placeholder="What is working, what is confusing, what you would change…"></textarea>'
      +'<div class="fb-actions"><button class="fb-ghost" id="fbCopy" type="button">Copy</button><button class="fb-send" id="fbSend" type="button">Send feedback</button></div>'
      +'<div class="fb-msg" id="fbMsg"></div>'
      +'<div class="fb-note">Saved on this device and opens a pre-filled email to the team. Please don\'t include patient information.</div>'
      +'</div>';
    host.appendChild(btn); host.appendChild(ov);

    var rating="";
    var $=function(id){return document.getElementById(id);};
    function msg(t,c){var m=$("fbMsg");m.innerHTML=t;m.style.color=c||"#6B7A80";}
    function reset(){$("fbText").value="";rating="";ov.querySelectorAll(".fb-r").forEach(function(x){x.classList.remove("on");});msg("");}
    function ctx(){return (document.title||"Dashboard").replace("Avance Care — ","");}
    function payload(){return {dashboard:document.title,url:location.href,rating:rating||"—",category:$("fbCat").value,text:($("fbText").value||"").trim(),at:new Date().toISOString()};}
    function store(p){try{var a=JSON.parse(localStorage.getItem(KEY)||"[]");a.push(p);localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
    function body(p){return "Dashboard: "+ctx()+"\nURL: "+p.url+"\nRating: "+p.rating+"\nCategory: "+p.category+"\nDate: "+new Date(p.at).toLocaleString()+"\n\nFeedback:\n"+p.text;}

    btn.onclick=function(){$("fbCtx").textContent=ctx()+" · "+new Date().toLocaleDateString();ov.hidden=false;$("fbText").focus();};
    $("fbClose").onclick=function(){ov.hidden=true;};
    ov.onclick=function(e){if(e.target===ov)ov.hidden=true;};
    ov.querySelectorAll(".fb-r").forEach(function(b){b.onclick=function(){rating=b.dataset.r;ov.querySelectorAll(".fb-r").forEach(function(x){x.classList.remove("on");});b.classList.add("on");};});
    $("fbSend").onclick=function(){var p=payload();if(!p.text&&!rating){msg("Add a rating or a note first.","#C0392B");return;}store(p);
      window.location.href="mailto:"+FEEDBACK_EMAIL+"?subject="+encodeURIComponent("Avance dashboard feedback — "+ctx())+"&body="+encodeURIComponent(body(p));
      msg("Thanks! Saved — your email draft is open to send.","#2F9E45");setTimeout(function(){ov.hidden=true;reset();},1600);};
    $("fbCopy").onclick=function(){var p=payload();try{navigator.clipboard&&navigator.clipboard.writeText(body(p));}catch(e){}store(p);msg("Copied to clipboard & saved.","#2F9E45");};
    document.addEventListener("keydown",function(e){if(e.key==="Escape")ov.hidden=true;});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
