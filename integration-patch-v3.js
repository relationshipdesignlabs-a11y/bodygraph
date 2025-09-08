// integration-patch-v3.js
(function(){
  const CYAN = '#00bcd4';
  const BLACK = '#0a0f12';
  const STROKE_WIDTH_FALLBACK = 10; // px

  function gateNum(s){
    const m = String(s||'').match(/(\d{1,2})/);
    return m ? m[1] : null;
  }
  function gateSetFromSide(sideObj){
    const set = new Set();
    if(!sideObj || typeof sideObj!=='object') return set;
    for(const v of Object.values(sideObj)){
      if(typeof v === 'string'){
        const g = gateNum(v);
        if(g) set.add(g);
      }else if(v && typeof v==='object'){
        const g = gateNum(v.value || v.gate_line || v.gate);
        if(g) set.add(g);
      }
    }
    return set;
  }
  function presentGateSet(json){
    const d = gateSetFromSide(json && json.activations && json.activations.design);
    const p = gateSetFromSide(json && json.activations && json.activations.personality);
    const all = new Set([...d, ...p]);
    return { d, p, all };
  }
  function channelSet(json){
    const shorts = (json && json.channels_short) || [];
    const longs  = (json && json.channels_long) || [];
    const names = new Set([
      ...shorts.map(String),
      ...longs.map(s=> {
        const m = String(s).match(/\((\d+\-\d+)\)/);
        return m ? m[1] : String(s);
      })
    ]);
    // fallback using gates (treat as defined channel if both gates present)
    const { all } = presentGateSet(json);
    function hasPair(a,b){
      return names.has(`${a}-${b}`) || names.has(`${b}-${a}`) || (all.has(String(a)) && all.has(String(b)));
    }
    return { has2034: hasPair(20,34), has2057: hasPair(20,57), has1034: hasPair(10,34), has1057: hasPair(10,57) };
  }

  function findABPointsFromDOM(doc){
    const candsA = ['#pointA','#ptA','#A','#a','[data-name="A"]','[data-key="A"]'];
    const candsB = ['#pointB','#ptB','#B','#b','[data-name="B"]','[data-key="B"]'];
    let A=null,B=null;
    for(const sel of candsA){ const el = doc.querySelector(sel); if(el){ A=el; break; } }
    for(const sel of candsB){ const el = doc.querySelector(sel); if(el){ B=el; break; } }
    function xy(el){
      if(!el) return null;
      const bb = el.getBBox ? el.getBBox() : el.getBoundingClientRect();
      const cx = ('cx' in el)? parseFloat(el.getAttribute('cx')) : (bb.x + bb.width/2);
      const cy = ('cy' in el)? parseFloat(el.getAttribute('cy')) : (bb.y + bb.height/2);
      return {x:cx, y:cy};
    }
    const a = xy(A), b=xy(B);
    if(a && b) return {a,b};
    return null;
  }

  async function findABPointsFromLayout(){
    try{
      const r = await fetch('/bodygraph-layout.json', { cache:'no-store' });
      if(!r.ok) return null;
      const j = await r.json();
      const p = j.points || j;
      if(p && p.A && p.B && typeof p.A.x==='number' && typeof p.B.x==='number'){
        return { a:{x:p.A.x, y:p.A.y}, b:{x:p.B.x, y:p.B.y} };
      }
      return null;
    }catch(e){ return null; }
  }

  function pickStrokeWidth(doc){
    const ref = doc.querySelector('.channel, .ch, [data-role="channel"], path[id*="ch"], path[id*="channel"]');
    if(!ref) return STROKE_WIDTH_FALLBACK;
    const cs = getComputedStyle(ref);
    const sw = parseFloat(ref.getAttribute('stroke-width') || cs.strokeWidth || STROKE_WIDTH_FALLBACK);
    return isFinite(sw) ? sw : STROKE_WIDTH_FALLBACK;
  }

  function colorForGate(g, dSet, pSet){
    const d = dSet.has(String(g));
    const p = pSet.has(String(g));
    if(d && !p) return CYAN;
    if(p && !d) return BLACK;
    if(d && p)  return 'both';
    return null;
  }

  function drawAB(doc, a, b, colA, colB, strokeWidth){
    const svg = doc.querySelector('svg#svg') || doc.querySelector('svg');
    if(!svg) return;
    let grp = doc.getElementById('integration_AB_overlay_grp');
    if(grp) grp.remove();
    grp = doc.createElementNS('http://www.w3.org/2000/svg','g');
    grp.setAttribute('id','integration_AB_overlay_grp');
    grp.setAttribute('pointer-events','none');
    svg.appendChild(grp);

    const mid = { x: (a.x + b.x)/2, y: (a.y + b.y)/2 };

    function line(from,to,color,id){
      const path = doc.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('id', id);
      path.setAttribute('d', `M ${from.x},${from.y} L ${to.x},${to.y}`);
      path.setAttribute('fill','none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      path.setAttribute('stroke-opacity','0.95');
      path.setAttribute('vector-effect','non-scaling-stroke');
      path.setAttribute('stroke-width', String(strokeWidth));
      grp.appendChild(path);
    }

    const resolvedA = (colA==='both') ? CYAN : (colA||CYAN);
    const resolvedB = (colB==='both') ? CYAN : (colB||CYAN);

    if(resolvedA === resolvedB){
      line(a, b, resolvedA, 'integration_AB_overlay');
    }else{
      line(a, mid, resolvedA, 'integration_AB_overlay_A');
      line(mid, b, resolvedB, 'integration_AB_overlay_B');
    }
  }

  async function ensureABOverlay(frameWin, json){
    const doc = frameWin.document;
    const {has2034, has2057, has1034, has1057} = channelSet(json);
    const needed = (has2034 || has2057 || has1034 || has1057);
    if(!needed){
      const old = doc.getElementById('integration_AB_overlay_grp');
      if(old) old.remove();
      return;
    }

    let pts = findABPointsFromDOM(doc);
    if(!pts) pts = await findABPointsFromLayout();
    if(!pts) return;

    const {a,b} = pts;
    const sw = pickStrokeWidth(doc);

    const { d:designSet, p:personSet } = presentGateSet(json);

    let ga = null, gb = null;
    if(has2034){ ga = 34; gb = 20; }
    else if(has2057){ ga = 57; gb = 20; }
    else if(has1034){ ga = 34; gb = 10; }
    else if(has1057){ ga = 57; gb = 10; }

    const colA = colorForGate(ga, designSet, personSet) || CYAN;
    const colB = colorForGate(gb, designSet, personSet) || CYAN;

    drawAB(doc, a, b, colA, colB, sw);
  }

  (function patch(){
    const w = window;
    const orig = w.applyBodygraph;
    if(typeof orig === 'function'){
      w.applyBodygraph = async function(json){
        const r = orig.apply(this, arguments);
        try{ await ensureABOverlay(w, json); }catch(e){}
        return r;
      }
    }else{
      let tries = 0;
      const t = setInterval(()=>{
        if(typeof w.applyBodygraph === 'function'){
          clearInterval(t);
          patch();
        } else if(++tries > 40){ clearInterval(t); }
      }, 100);
    }
  })();
})();