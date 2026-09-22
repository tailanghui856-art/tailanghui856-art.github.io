const canvas=document.getElementById('particle-canvas');
const ctx=canvas.getContext('2d');
let w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2),mouse={x:w/2,y:h/2,active:false},particles=[];
function resize(){
  w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  particles=Array.from({length:innerWidth<700?26:48},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.7+.5}));
}
addEventListener('resize',resize);
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true});
addEventListener('pointerleave',()=>mouse.active=false);
function draw(){
  ctx.clearRect(0,0,w,h);
  particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
    const dx=mouse.x-p.x,dy=mouse.y-p.y,dist=Math.hypot(dx,dy);
    if(mouse.active&&dist<150){p.x-=dx/dist*(150-dist)*.006;p.y-=dy/dist*(150-dist)*.006}
    ctx.globalAlpha=.35;ctx.fillStyle='#ff5148';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  });
  if(mouse.active){
    ctx.globalAlpha=.28;ctx.strokeStyle='#ff5148';ctx.lineWidth=.6;
    particles.forEach(p=>{const dist=Math.hypot(mouse.x-p.x,mouse.y-p.y);if(dist<125){ctx.beginPath();ctx.moveTo(mouse.x,mouse.y);ctx.lineTo(p.x,p.y);ctx.stroke()}});
    ctx.globalAlpha=.8;ctx.fillStyle='#ff5148';ctx.beginPath();ctx.arc(mouse.x,mouse.y,2.5,0,Math.PI*2);ctx.fill();
  }
  requestAnimationFrame(draw);
}
resize();draw();
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=document.querySelector(a.getAttribute('href'));if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'})}
}));
document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.nav nav')?.classList.toggle('mobile-open'));