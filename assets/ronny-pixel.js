(() => {
  "use strict";
  const frame = document.querySelector(".hero-full");
  const source = frame.querySelector(".hero-art");
  const canvas = frame.querySelector(".hero-pixel-canvas");
  const control = frame.querySelector(".motion-control");
  const label = control.querySelector(".motion-label");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const ctx = canvas.getContext("2d", { alpha:false });
  if (!ctx || !source) return;
  const W = canvas.width, H = canvas.height;
  const still = document.createElement("canvas");
  still.width = W; still.height = H;
  const sc = still.getContext("2d");
  if (!sc) return;
  // Coordinates and timing are in pixel-scene units, not CSS pixels.
  function seed(n) { const a = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return a - Math.floor(a); }
  function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  const grass = [];
  for(let i=0;i<104;i++){
    const x=4+seed(i+97)*(W-8), y=169+seed(i+227)*51;
    // Keep the laptop, notebook and trunk clear of foreground sprites.
    if ((x>208&&x<399&&y<211)||(x>383&&y<199)) continue;
    grass.push([x,y,seed(i+66),Math.floor(seed(i+18)*5)]);
  }
  const grassInk=["#76a549","#a7c45b","#4c853c","#c2cd60","#43723d"];
  const leaves = [
    [156,4,0],[182,11,1],[200,22,0],[219,4,1],[228,20,1],[247,12,0],
    [263,26,1],[277,29,2],[291,36,2],[302,27,2],[312,31,1],[317,57,2],
    [329,51,1],[340,64,2],[349,49,0],[359,77,2],[369,58,1],
  ];
  function anchorCanopy(){
    // Tie decorative leaf pixels to visible foliage, not to the moving cloud.
    const pixels=sc.getImageData(0,0,W,H).data;
    for(const patch of leaves){
      const [cx,cy]=patch; let best=Infinity;
      for(let y=Math.max(3,cy-11);y<=cy+11;y++)for(let x=cx-10;x<=cx+10;x++){
        const i=(y*W+x)*4; const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        if(g<r*.88||g<b*1.27||g<48)continue;
        const distance=(x-cx)**2+(y-cy)**2;
        if(distance<best){best=distance;patch[0]=x;patch[1]=y;}
      }
    }
  }
  const leavesInk=[["#306a3c","#6b9f32","#9dbb3b"],["#1b5635","#438633","#79aa36"],["#204b38","#3a7740","#719638"]];
  function grassBlade(x,y,height,bend,ink){
    for (let n=0;n<height;n++) {
      const delta=Math.round(bend*n*n/(height*height));
      px(x+delta,y-n,1,n===0?2:1,ink);
    }
  }
  function leaf(x,y,palette,index){
    const c=leavesInk[palette], flip=index%2?1:-1;
    px(x-2,y-1,5,3,c[0]); px(x-1,y-3,3,5,c[1]);
    px(x+flip,y-4,2,2,c[2]); px(x-flip*2,y+2,2,1,c[1]);
    px(x+flip*2,y,2,2,c[0]);
  }
  function cloud(x,y,size,alpha) {
    const units = [[1,5,5,2],[4,4,6,3],[7,2,5,5],[9,1,3,4],[11,2,5,5],[15,3,6,4],[19,4,7,3],[24,5,4,2]];
    ctx.save();ctx.globalAlpha=alpha;
    for(const [u,v,w,h] of units){
      px(x+u*size,y+v*size,Math.max(1,Math.round(w*size)),Math.max(1,Math.round(h*size)),"#d9eff9");
    }
    px(x+4*size,y+5*size,Math.round(19*size),Math.max(1,Math.round(size)),"#9ecfe9");
    px(x+8*size,y+3*size,Math.round(8*size),Math.max(1,Math.round(size)),"#f8fdff");
    ctx.restore();
  }
  function bird(x,y,state,scale){
    const ink="#244f6d", light="#476e83", dy = state%3===1?-2:state%3===2?1:0;
    px(x,y,2*scale,scale,ink);
    px(x-scale,y+dy*scale,scale,scale,ink);
    px(x-2*scale,y+(dy-1)*scale,scale,scale,light);
    px(x+2*scale,y+dy*scale,scale,scale,ink);
    px(x+3*scale,y+(dy-1)*scale,scale,scale,light);
  }
  function draw(t, active){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(still,0,0);
    const wall=Math.floor(t/155);
    // Near and far clouds have separate speeds; distant bird silhouettes flap.
    cloud(183 + ((wall+13)%35),49 + Math.round(Math.sin(t/3250)),0.84,.79);
    cloud(137 + ((Math.floor(t/240)+8)%35),113,0.65,.7);
    cloud(278 + ((Math.floor(t/212)+20)%29),107,0.67,.72);
    const a = 68 + (Math.floor(t/73)%245);
    const flap = Math.floor(t/145);
    bird(a,37+Math.round(Math.sin(t/1320)*3),flap,1);
    bird(a-10,41+Math.round(Math.sin(t/1120)*2),flap+1,1);
    // Different masses of canopy respond to the breeze a few frames apart.
    leaves.forEach(([x,y,p],i)=>{
      const sway=Math.round(Math.sin(t/515+x*.073)*2);
      leaf(x+sway,y+Math.round(sway*.5),p,i);
    });
    grass.forEach(([x,y,k,ink],i)=>{
      const height=2+Math.floor(k*4);
      const gust=Math.round(Math.sin(t/455+x*.057+y*.20)*(1+k*1.6));
      grassBlade(x,y,height,gust,grassInk[ink]);
    });
    // Falling leaves and tiny lit grass tips are deliberately staggered.
    for(let i=0;i<6;i++){
      const stride=(Math.floor(t/(95+i*8))+i*17)%82;
      const x=385-i*14-stride*.92+Math.sin(stride/5+i)*4;
      const y=68+i*7+stride*.86;
      if(y>141)continue;
      px(x,y,2,1,i%2?"#d9c45f":"#81a647");
      px(x+1,y-(stride%4<2?1:0),2,1,"#9cb84f");
    }
    if (active && Math.floor(t/575)%2===0) {
      px(312,178,3,1,"#63aaa3");
      px(312,181,6,1,"#6fb6a6");
      px(320,181,1,2,"#95caba");
    }
  }
  let visible = true, explicit=false, id=0, last=0, time=0;
  function setUi(){
    const stopped=explicit||media.matches;
    frame.classList.toggle("motion-is-paused",stopped);
    document.documentElement.classList.toggle("site-motion-paused",stopped);
    control.setAttribute("aria-pressed",String(stopped));
    const english=document.documentElement.lang==="en";
    control.setAttribute("aria-label",english?(stopped?"Play pixel animation":"Pause pixel animation"):(stopped?"播放像素动效":"暂停像素动效"));
    label.textContent=english?(stopped?"Play":"Pause"):(stopped?"播放":"暂停");
    // OS requests to avoid motion cannot be overridden accidentally.
    control.hidden=media.matches;
  }
  function live(t){
    if(!visible||explicit||media.matches||document.hidden){id=0;return}
    if(!last)last=t;
    if(t-last>=95){time+=Math.min(t-last,160);draw(time,true);last=t}
    id=requestAnimationFrame(live);
  }
  function refresh(){
    if(id){cancelAnimationFrame(id);id=0}
    last=0;
    if(!explicit&&!media.matches&&visible&&!document.hidden)id=requestAnimationFrame(live);
  }
  function init(){
    if(canvas.classList.contains("ready"))return;
    // Modest downsample first, then upscale the rendered grid without smoothing.
    sc.imageSmoothingEnabled=true;
    sc.imageSmoothingQuality="high";
    sc.drawImage(source,0,0,W,H);
    anchorCanopy();
    draw(0,false);
    canvas.classList.add("ready");
    control.removeAttribute("hidden");
    setUi();
    new MutationObserver(setUi).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    control.addEventListener("click",()=>{explicit=!explicit;setUi();refresh()});
    media.addEventListener("change",()=>{if(media.matches)draw(0,false);setUi();refresh()});
    document.addEventListener("visibilitychange",refresh);
    if("IntersectionObserver" in window)new IntersectionObserver(list=>{visible=list[0].isIntersecting;refresh()},{threshold:.05}).observe(frame);
    refresh();
  }
  if(source.complete&&source.naturalWidth)init();
  else source.addEventListener("load",init,{once:true});
})();

(() => {
  "use strict";
  const nav=document.querySelector(".pixel-nav"), hero=document.querySelector(".hero-full"), menu=nav.querySelector(".pixel-menu");
  let queued=false;
  function update(){nav.classList.toggle("scrolled",scrollY>Math.max(80,hero.clientHeight-46));queued=false}
  window.addEventListener("scroll",()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
  window.addEventListener("resize",update,{passive:true});
  update();
  function toggle(open){nav.classList.toggle("menu-open",open);menu.setAttribute("aria-expanded",String(open))}
  menu.addEventListener("click",()=>toggle(menu.getAttribute("aria-expanded")!=="true"));
  nav.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>toggle(false)));
  nav.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("menu-open")){toggle(false);menu.focus()}});
  document.addEventListener("click",e=>{if(!nav.contains(e.target)&&nav.classList.contains("menu-open"))toggle(false)});
})();
