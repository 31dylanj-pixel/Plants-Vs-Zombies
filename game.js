(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=480, COLS=9,ROWS=5, GX=20,GY=100,CW=70,CH=68;
const $=id=>document.getElementById(id);
const img={};
const assetNames=['lawn','peashooter','pea','sunflower','sun','wallnut','cherrybomb','snowpea','snowpea-projectile','chomper','repeater','zombie','cone-zombie','bucket-zombie','potato-mine'];
assetNames.forEach(n=>{img[n]=new Image();img[n].src=`assets/${n}.svg`});
const plants={
 peashooter:{name:'Peashooter',cost:100,hp:100,rate:1.45,damage:20,asset:'peashooter',desc:'Shoots peas'},
 sunflower:{name:'Sunflower',cost:50,hp:90,rate:8,asset:'sunflower',desc:'Produces sun'},
 wallnut:{name:'Wall-nut',cost:50,hp:420,asset:'wallnut',desc:'Blocks zombies'},
 cherrybomb:{name:'Cherry Bomb',cost:150,hp:1,asset:'cherrybomb',desc:'Explodes nearby'},
 snowpea:{name:'Snow Pea',cost:175,hp:100,rate:1.55,damage:20,asset:'snowpea',desc:'Slows zombies'},
 potato:{name:'Potato Mine',cost:25,hp:100,asset:'potato-mine',desc:'Explosive trap'},
 chomper:{name:'Chomper',cost:150,hp:150,rate:8,asset:'chomper',desc:'Eats a zombie'},
 repeater:{name:'Repeater',cost:200,hp:100,rate:1.5,damage:20,asset:'repeater',desc:'Fires two peas'}
};
const order=['peashooter','sunflower','wallnut','cherrybomb','snowpea','potato','chomper','repeater'];
let sun=150,selected=null,board=[],zombies=[],shots=[],suns=[],particles=[],mowers=[],running=false,paused=false,gameOver=false;
let elapsed=0,last=0,spawnClock=3,spawned=0,totalZombies=20,wave=1,toastTimer=0,skySunTimer=7;
let mouse={x:0,y:0};
const seedCards=$('seedCards');
order.forEach(k=>{const p=plants[k],el=document.createElement('button');el.className='seed-card';el.dataset.plant=k;el.title=`${p.name} — ${p.cost} sun`;el.innerHTML=`<img src="assets/${p.asset}.svg" alt=""><span class="cost">${p.cost}</span>`;el.addEventListener('click',()=>{if(!running||paused)return;if(sun<p.cost){notify('Not enough sun!');return}selected=selected===k?null:k;updateCards()});seedCards.appendChild(el)});
function updateCards(){document.querySelectorAll('.seed-card').forEach(el=>{el.classList.toggle('selected',el.dataset.plant===selected);el.classList.toggle('disabled',sun<plants[el.dataset.plant].cost)})}
function notify(s){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1400)}
function addSun(x,y,value=25,fall=false){suns.push({x,y,value,life:fall?12:8,vy:fall?18:0,phase:Math.random()*6,fall})}
function start(){sun=150;selected=null;board=Array.from({length:ROWS},()=>Array(COLS).fill(null));zombies=[];shots=[];suns=[];particles=[];mowers=Array.from({length:ROWS},(_,r)=>({x:8,y:GY+r*CH+CH*.55,row:r,used:false,active:false}));elapsed=0;spawnClock=4;spawned=0;wave=1;skySunTimer=5;running=true;paused=false;gameOver=false;$('overlay').classList.add('hidden');$('resultOverlay').classList.add('hidden');$('pauseBtn').textContent='Ⅱ';updateCards();last=performance.now();requestAnimationFrame(loop)}
$('startBtn').onclick=start;$('restartBtn').onclick=start;
$('pauseBtn').onclick=()=>{if(!running||gameOver)return;paused=!paused;$('pauseBtn').textContent=paused?'▶':'Ⅱ';if(!paused){last=performance.now();requestAnimationFrame(loop)}};
$('soundBtn').onclick=()=>notify('Sound effects coming soon');
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointermove',e=>mouse=pointer(e));
canvas.addEventListener('pointerdown',e=>{if(!running||paused||gameOver)return;const p=pointer(e);
 for(let i=suns.length-1;i>=0;i--){const s=suns[i];if(Math.hypot(p.x-s.x,p.y-s.y)<28){sun+=s.value;suns.splice(i,1);updateCards();return}}
 const c=Math.floor((p.x-GX)/CW),r=Math.floor((p.y-GY)/CH);
 if(c<0||c>=COLS||r<0||r>=ROWS)return;
 if(e.button===2){if(board[r][c]){board[r][c]=null;notify('Plant removed')}return}
 if(!selected){notify('Choose a seed packet first');return}
 const def=plants[selected];if(board[r][c]){notify('That tile is occupied');return}if(sun<def.cost){notify('Not enough sun!');return}
 sun-=def.cost;board[r][c]={type:selected,hp:def.hp,maxHp:def.hp,fire:0,age:0,action:0};if(selected==='cherrybomb'){board[r][c].action=.7}selected=null;updateCards();
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function spawnZombie(){const r=Math.floor(Math.random()*ROWS),roll=Math.random();let type='normal';if(spawned>5&&roll>.72)type='cone';if(spawned>12&&roll>.9)type='bucket';const hp=type==='bucket'?650:type==='cone'?350:180;zombies.push({x:W+25,y:GY+r*CH+CH*.55,row:r,type,hp,maxHp:hp,speed:type==='bucket'?7:type==='cone'?9:11,slow:0,eating:false,attack:0,flash:0});spawned++}
function drawImage(name,x,y,w,h,alpha=1){const im=img[name];if(!im||!im.complete||!im.naturalWidth)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,x-w/2,y-h/2,w,h);ctx.restore()}
function draw(){
 ctx.clearRect(0,0,W,H);
 if(img.lawn.complete&&img.lawn.naturalWidth)ctx.drawImage(img.lawn,0,0,W,H);else{ctx.fillStyle='#4e9b35';ctx.fillRect(0,0,W,H)}
 // lawn tile highlights
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){let x=GX+c*CW,y=GY+r*CH;ctx.fillStyle=(r+c)%2?'#ffffff08':'#163d0b08';ctx.fillRect(x,y,CW,CH);ctx.strokeStyle='#d6ed9b20';ctx.lineWidth=1;ctx.strokeRect(x,y,CW,CH)}
 // mowers
 mowers.forEach(m=>{if(!m.used){ctx.save();ctx.translate(m.x,m.y);ctx.fillStyle='#c7d1c3';ctx.fillRect(-9,-10,28,19);ctx.fillStyle='#df3e26';ctx.fillRect(0,-14,16,9);ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-3,10,5,0,7);ctx.arc(17,10,5,0,7);ctx.fill();ctx.restore()}});
 // plants
 board.forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;const x=GX+c*CW+CW*.5,y=GY+r*CH+CH*.55;const wob=Math.sin(elapsed*2+c+r)*1.5;let size=p.type==='chomper'?68: p.type==='cherrybomb'?55: p.type==='wallnut'?48: p.type==='potato'?43:58;drawImage(plants[p.type].asset,x,y+wob,size,size);if(p.hp<p.maxHp*.65){ctx.fillStyle='#271d12aa';ctx.fillRect(x-22,y-38,44,4);ctx.fillStyle='#9ad64d';ctx.fillRect(x-22,y-38,44*Math.max(0,p.hp/p.maxHp),4)}}));
 // shots
 shots.forEach(s=>{if(s.type==='ice'){drawImage('snowpea-projectile',s.x,s.y,21,21)}else{drawImage('pea',s.x,s.y,17,17)}});
 // zombies
 zombies.forEach(z=>{let asset=z.type==='bucket'?'bucket-zombie':z.type==='cone'?'cone-zombie':'zombie';drawImage(asset,z.x,z.y,64,116);if(z.flash>0){ctx.fillStyle='#fff8';ctx.fillRect(z.x-22,z.y-47,42,80)}});
 // suns
 suns.forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(elapsed*.5+s.phase);drawImage('sun',0,0,39,39);ctx.restore();ctx.strokeStyle='#fff5a0aa';ctx.beginPath();ctx.arc(s.x,s.y,24+Math.sin(elapsed*5)*2,0,Math.PI*2);ctx.stroke()});
 // effects
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill();ctx.globalAlpha=1});
 // hover grid
 if(running&&selected){let c=Math.floor((mouse.x-GX)/CW),r=Math.floor((mouse.y-GY)/CH);if(c>=0&&c<COLS&&r>=0&&r<ROWS){ctx.fillStyle=board[r][c]?'#e54c3440':'#e8f5b344';ctx.fillRect(GX+c*CW,GY+r*CH,CW,CH);ctx.strokeStyle='#fff9';ctx.strokeRect(GX+c*CW,GY+r*CH,CW,CH)}}
 $('sunCount').textContent=sun;$('waveProgress').style.width=`${Math.min(100,spawned/totalZombies*100)}%`;
 $('waveText').textContent=spawned>=totalZombies&&zombies.length?'FINAL ZOMBIES':'ZOMBIES APPROACHING';
}
function particle(x,y,color='#f9d45a',n=8){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,v=20+Math.random()*80;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+Math.random()*.4,max:.9,size:2+Math.random()*3,color})}}
function update(dt){
 elapsed+=dt;skySunTimer-=dt;if(skySunTimer<=0){addSun(80+Math.random()*550,25,25,true);skySunTimer=8+Math.random()*5}
 if(spawned<totalZombies){spawnClock-=dt;if(spawnClock<=0){spawnZombie();spawnClock=Math.max(2.5,7-spawned*.16)+Math.random()*2}}
 // plant behavior
 board.forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;p.age+=dt;p.fire-=dt;p.action-=dt;const x=GX+c*CW+CW*.65,y=GY+r*CH+CH*.55;
 if(p.type==='sunflower'&&p.action<=0){addSun(x,y-26,25);particle(x,y-25,'#ffe77a',5);p.action=8+Math.random()*2}
 if(['peashooter','snowpea','repeater'].includes(p.type)&&p.fire<=0&&zombies.some(z=>z.row===r&&z.x>x-5)){shots.push({x:x+15,y:y-12,row:r,speed:245,damage:p.type==='repeater'?20:plants[p.type].damage,type:p.type==='snowpea'?'ice':'pea'});if(p.type==='repeater')shots.push({x:x+25,y:y-18,row:r,speed:245,damage:20,type:'pea'});p.fire=p.type==='repeater'?1.5:p.type==='snowpea'?1.65:1.45}
 if(p.type==='cherrybomb'&&p.action<=0){zombies.forEach(z=>{if(Math.abs(z.row-r)<=1&&Math.abs(z.x-x)<155)z.hp=0});particle(x,y,'#ff8a3d',32);p.hp=0}
 if(p.type==='potato'&&p.age>12){let z=zombies.find(z=>z.row===r&&Math.abs(z.x-x)<50);if(z){z.hp=0;particle(x,y,'#e9b34e',22);p.hp=0}}
 if(p.type==='chomper'&&p.action<=0){let z=zombies.find(z=>z.row===r&&Math.abs(z.x-x)<68);if(z){z.hp=0;p.action=8;particle(x,y,'#83b64c',8)}}
 }));
 // projectiles
 shots.forEach(s=>{s.x+=s.speed*dt;let z=zombies.find(z=>z.row===s.row&&Math.abs(z.x-s.x)<30);if(z){z.hp-=s.damage;z.flash=.09;if(s.type==='ice')z.slow=3;s.dead=true;particle(s.x,s.y,s.type==='ice'?'#a6eaff':'#8bd54a',3)}});shots=shots.filter(s=>!s.dead&&s.x<W+20);
 // zombie movement / eating
 zombies.forEach(z=>{z.flash=Math.max(0,z.flash-dt);z.slow=Math.max(0,z.slow-dt);let c=Math.floor((z.x-GX)/CW),p=c>=0&&c<COLS?board[z.row][c]:null;let plantX=GX+c*CW+CW*.65;
 if(p&&z.x<plantX+20&&z.x>plantX-36){z.eating=true;z.attack-=dt;if(z.attack<=0){p.hp-=18;z.attack=.65;if(p.hp<=0){board[z.row][c]=null;z.eating=false}}}else{z.eating=false;z.x-=z.speed*(z.slow>0?.45:1)*dt}
 if(z.x<45){let m=mowers[z.row];if(m&&!m.used){m.active=true;m.used=true}else if(!m|| (m.used&&!m.active)){endGame(false)}}
 });
 // lawnmowers
 mowers.forEach(m=>{if(m.active){m.x+=520*dt;zombies.forEach(z=>{if(z.row===m.row){if(Math.abs(z.x-m.x)<42)z.hp=0}});if(m.x>W+50)m.active=false}});
 zombies=zombies.filter(z=>z.hp>0);
 suns.forEach(s=>{s.life-=dt;if(s.fall){s.y+=s.vy*dt;s.vy=Math.min(65,s.vy+dt*18)}});
 suns=suns.filter(s=>s.life>0&&s.y<H-12);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=50*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
 if(spawned>=totalZombies&&zombies.length===0){endGame(true)}
}
function endGame(win){if(gameOver)return;gameOver=true;running=false;$('resultTitle').textContent=win?'The zombies are toast!':'The zombies ate your brains!';$('resultText').textContent=win?'Your garden survived the first wave. Great work, Crazy Dave would be proud.':'A zombie made it through your defenses. Try adding more Peashooters and Sunflowers.';$('resultOverlay').classList.remove('hidden')}
function loop(now){if(!running||paused||gameOver)return;const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(loop)}
// Keep the scene visible behind the title screen.
function idle(){draw();if(!running)requestAnimationFrame(idle)}
mowers.forEach(()=>{});mowers=Array.from({length:ROWS},(_,r)=>({x:8,y:GY+r*CH+CH*.55,row:r,used:false,active:false}));
board=Array.from({length:ROWS},()=>Array(COLS).fill(null));draw();idle();updateCards();
})();