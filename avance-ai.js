/* Avance Care — shared AI bar component.
   A page opts in by:  (1) including <div id="aiBar"></div> near the top,
   (2) defining window.AVANCE_AI = { insight():htmlString, chips:[...], answer(q):htmlString },
   (3) calling window.renderAvanceAI() after each render (so it tracks filter changes),
   (4) including <script src="/avance-ai.js"></script>.
   Visual style matches the Provider Performance AI bar. */
(function(){
  if(!document.getElementById('avance-ai-css')){
    const s=document.createElement('style'); s.id='avance-ai-css';
    s.textContent=`
    #aiBar .aibar{background:linear-gradient(120deg,#fff,#F3F5FC);border:1px solid #D9DEF2;border-left:4px solid #5C6CB8;border-radius:14px;box-shadow:0 1px 3px rgba(30,40,60,.08);padding:14px 18px;margin-bottom:18px}
    #aiBar .ai-top{display:flex;align-items:flex-start;gap:12px}
    #aiBar .ai-badge{flex:none;font-size:12px;font-weight:800;color:#fff;background:linear-gradient(120deg,#2B2C6B,#5C6CB8);padding:5px 11px;border-radius:20px;letter-spacing:.3px}
    #aiBar .ai-insight{font-size:13.5px;line-height:1.5;color:#26303A}
    #aiBar .ai-insight b{color:#2B2C6B}
    #aiBar .ai-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}
    #aiBar .ai-chip{font-size:12px;font-weight:600;padding:6px 11px;border-radius:18px;border:1px solid #CBD2EC;background:#fff;color:#2B2C6B;cursor:pointer}
    #aiBar .ai-chip:hover{background:#2B2C6B;color:#fff;border-color:#2B2C6B}
    #aiBar .ai-ask{display:flex;gap:8px;margin-top:11px}
    #aiBar .ai-ask input{flex:1;font-size:13px;padding:9px 12px;border:1px solid #CBD2EC;border-radius:9px}
    #aiBar .ai-ask button{font-size:13px;font-weight:700;padding:9px 18px;border:none;border-radius:9px;background:#5C6CB8;color:#fff;cursor:pointer}
    #aiBar .ai-ask button:hover{background:#2B2C6B}
    #aiBar .ai-resp{margin-top:12px;background:#fff;border:1px solid #E2E7F5;border-radius:10px;padding:13px 15px;font-size:13px;line-height:1.55}
    #aiBar .ai-resp[hidden]{display:none}
    #aiBar .ai-resp h5{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#5C6CB8;margin:0 0 6px}
    #aiBar .ai-resp ul{margin:6px 0 0;padding-left:18px}
    #aiBar .ai-disc{font-size:10.5px;color:#6B7A80;margin-top:9px;font-style:italic}
    @media(max-width:760px){#aiBar .ai-chips{display:none}}`;
    document.head.appendChild(s);
  }
  function ask(q){
    const cfg=window.AVANCE_AI, bar=document.getElementById('aiBar'); if(!cfg||!bar) return;
    if(!q||!q.trim()) return;
    const r=bar.querySelector('#aiResp'); if(!r) return;
    r.hidden=false;
    r.innerHTML=cfg.answer(q)+'<div class="ai-disc">Avance AI is an illustrative assistant in this mockup — wire to your approved LLM + live data to make it live.</div>';
  }
  window.renderAvanceAI=function(){
    const cfg=window.AVANCE_AI, bar=document.getElementById('aiBar'); if(!cfg||!bar) return;
    bar.innerHTML='<div class="aibar">'+
      '<div class="ai-top"><span class="ai-badge">✦ Avance AI</span><div class="ai-insight">'+cfg.insight()+'</div></div>'+
      '<div class="ai-chips">'+(cfg.chips||[]).map(c=>'<span class="ai-chip">'+c+'</span>').join('')+'</div>'+
      '<div class="ai-ask"><input id="aiInput" type="text" placeholder="Ask Avance AI about this view…"><button id="aiSend" type="button">Ask</button></div>'+
      '<div class="ai-resp" id="aiResp" hidden></div>'+
    '</div>';
    bar.querySelectorAll('.ai-chip').forEach(ch=>ch.onclick=()=>{const i=bar.querySelector('#aiInput');i.value=ch.textContent;ask(ch.textContent);});
    bar.querySelector('#aiSend').onclick=()=>ask(bar.querySelector('#aiInput').value);
    bar.querySelector('#aiInput').addEventListener('keydown',e=>{if(e.key==='Enter')ask(e.target.value);});
  };
})();
