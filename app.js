'use strict';
const dialog=document.querySelector('#player-dialog'),player=document.querySelector('#player');
// Vidéos hébergées sur Wistia (compte haimcut, 18/11/2026) ; une clé absente est lue en local dans media/.
const WISTIA={vsl:'oaa8u4zxtp',H1:'cbvtvckrz2',H2:'jz6ie62xnu',H3:'bu55ofczwf',H4:'mkdvo2854o',enfants:'5wu0xexz62','90jours':'i6okussc03',habitudes:'xepav750km'};
const wistiaFrame=id=>{const f=document.createElement('iframe');f.src=`https://fast.wistia.net/embed/iframe/${id}?autoPlay=true&doNotTrack=true`;f.allow='autoplay; fullscreen';f.allowFullscreen=true;f.title='Lecteur vidéo';return f};
let opener;
document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
 opener=button;compareStop();
 document.querySelector('#player-title').textContent=button.dataset.title;
 document.querySelector('#player-error').textContent='';
 const id=WISTIA[button.dataset.video],img=button.querySelector('img');
 dialog.querySelectorAll('iframe').forEach(f=>f.remove());
 if(id){const frame=wistiaFrame(id);frame.id='player-frame';frame.className=img&&+img.getAttribute('height')>+img.getAttribute('width')?'vertical':'paysage';player.hidden=true;player.after(frame)}
 else player.src='media/'+button.dataset.video+'.mp4';
 dialog.showModal();
 document.body.style.overflow='hidden';if(!id)player.play().catch(()=>{});
}));
function closePlayer(){dialog.close()}
document.querySelector('#close-player').addEventListener('click',closePlayer);
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePlayer()}});
dialog.addEventListener('close',()=>{if(dialog.open)return;dialog.querySelectorAll('iframe').forEach(f=>f.remove());player.hidden=false;player.pause();player.removeAttribute('src');player.load();document.body.style.overflow='';opener?.focus();if(!comparePausedByUser&&!manualReduced&&compareInView())compareStart(false)});
player.addEventListener('error',()=>{document.querySelector('#player-error').textContent='La vidéo n’a pas pu être chargée. Ferme le lecteur puis réessaie.'});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
 document.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);
 document.querySelector('.projects').classList.toggle('filtered',button.dataset.filter!=='all');
}));
const before=document.querySelector('#before'),after=document.querySelector('#after'),compareButton=document.querySelector('.compare-play');
const compareFrame=document.querySelector('.compare-frame'),compareRange=document.querySelector('#compare-range');
const setSplit=v=>{v=Math.min(100,Math.max(0,v));compareRange.value=v;compareFrame.style.setProperty('--split',v+'%');sonCote()};
compareRange.addEventListener('input',()=>setSplit(Number(compareRange.value)));
// La ligne se tire aussi sur la vidéo ; pan-y garde le défilement vertical au doigt.
compareFrame.style.touchAction='pan-y';compareFrame.style.cursor='ew-resize';
const splitFromPointer=e=>{const b=compareFrame.getBoundingClientRect();setSplit((e.clientX-b.left)/b.width*100)};
compareFrame.addEventListener('pointerdown',e=>{compareFrame.setPointerCapture(e.pointerId);splitFromPointer(e)});
compareFrame.addEventListener('pointermove',e=>{if(compareFrame.hasPointerCapture(e.pointerId))splitFromPointer(e)});
// Comparateur brut / monté (06/11/2026 : « jamais de bug sur la synchro ») : un seul pilote pour les deux vidéos.
// Le brut mène, le monté suit. Une seule boucle pour les deux (chaque vidéo rebouclait seule et elles se décalaient).
// À chaque image : petit écart rattrapé par la vitesse du monté (±6 %), gros écart par un saut ;
// si l'une manque de données ou se cale, les deux s'arrêtent et repartent ensemble.
before.loop=after.loop=false;
const compareError=document.querySelector('#compare-error');
let compareWanted=false,comparePausedByUser=false,compareTick=0;
const compareInView=()=>{const r=compareFrame.getBoundingClientRect();return !document.hidden&&r.bottom>innerHeight*.2&&r.top<innerHeight*.8};
function compareShow(){compareButton.textContent=compareWanted?'Mettre en pause Ⅱ':'Lire la comparaison ▶'}
function compareStart(fromZero){
 if(fromZero)before.currentTime=after.currentTime=0;
 compareError.textContent='';compareWanted=true;compareShow();
 cancelAnimationFrame(compareTick);compareTick=requestAnimationFrame(compareFollow);
}
function compareStop(){compareWanted=false;cancelAnimationFrame(compareTick);before.pause();after.pause();after.playbackRate=1;compareShow()}
function compareFollow(){
 if(!compareWanted)return;
 compareTick=requestAnimationFrame(compareFollow);
 if(before.ended){before.currentTime=after.currentTime=0;return}       // fin du brut : les deux repartent du début
 if(after.ended)return;                                                   // le monté a fini une image plus tôt : il attend le brut
 if(before.readyState<3||after.readyState<3||before.seeking||after.seeking){before.pause();after.pause();return}
 if(before.paused||after.paused){
  Promise.all([before.play(),after.play()]).catch(()=>{if(compareWanted){compareStop();compareError.textContent='Lecture indisponible. Réessaie dans quelques instants.'}});
  return;
 }
 const gap=after.currentTime-before.currentTime;
 if(Math.abs(gap)>.25){after.playbackRate=1;after.currentTime=before.currentTime}
 else after.playbackRate=Math.abs(gap)>.03?(gap>0?.94:1.06):1;
}
compareButton.addEventListener('click',()=>{
 if(compareWanted){comparePausedByUser=true;compareStop()}
 else{comparePausedByUser=false;compareStart(true)}
});
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motionButton=document.querySelector('#motion-toggle');let manualReduced=false;
const layers=[...document.querySelectorAll('[data-parallax]')];let pending=false;
const driftLayers=[...document.querySelectorAll('[data-drift]')];
const story=document.querySelector('.scroll-story'),stage=document.querySelector('.story-stage');
const scene={heading:document.querySelector('.story-heading'),sea:document.querySelector('.story-sea'),word:document.querySelector('.back-word'),counter:document.querySelector('.story-counter')};
const flights={youtube:{x:-.32,y:.23,scale:.55,angle:-28,start:0,end:.55},enfants:{x:.23,y:-.20,scale:.60,angle:24,start:.06,end:.61},ads:{x:.21,y:.35,scale:.45,angle:-19,start:.12,end:.67}};
const clamp=x=>Math.max(0,Math.min(1,x));
function smooth(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t)}
function updateParallax(){
 pending=false;const stop=reduced.matches||manualReduced;
 layers.forEach(el=>{const box=el.closest('section').getBoundingClientRect();const distance=box.top+box.height/2-innerHeight/2;el.style.transform=stop?'':`translate3d(0,${Math.max(-65,Math.min(65,-distance*Number(el.dataset.parallax)))}px,0)`});
 driftLayers.forEach(el=>{const box=el.closest('section').getBoundingClientRect();const distance=box.top+box.height/2-innerHeight/2;const shift=Math.max(-210,Math.min(210,-distance*Number(el.dataset.drift)));el.style.transform=stop?'':`translate3d(0,${shift}px,0)`});
 const box=story.getBoundingClientRect(),p=stop?1:clamp(-box.top/Math.max(1,story.offsetHeight-stage.offsetHeight));
 stage.style.setProperty('--story-progress',p.toFixed(5));stage.dataset.progress=p.toFixed(3);
 const travel=stop?1:smooth(0,.67,p);
 scene.sea.style.transform=`translate3d(${(1-travel)*90}px,${-(1-travel)*120}px,0) scale(${1.28-.28*travel})`;
 scene.word.style.transform=`translate3d(${(1-travel)*innerWidth*.35}px,${(1-travel)*100}px,0)`;
 scene.heading.style.transform=`translate3d(0,${(1-travel)*-30}px,0)`;
 scene.heading.style.opacity=String(.85+.15*travel);scene.heading.style.visibility='visible';
 document.querySelectorAll('[data-flight]').forEach(el=>{const f=flights[el.dataset.flight],arrival=stop?1:smooth(f.start,f.end,p),remaining=1-arrival;el.style.transform=`translate3d(${remaining*f.x*innerWidth}px,${remaining*f.y*innerHeight}px,0) rotate(${remaining*f.angle}deg) scale(${f.scale+(1-f.scale)*arrival})`;el.style.opacity=String(Math.min(1,arrival*1.6));el.style.visibility=arrival>0?'visible':'hidden';el.style.pointerEvents=arrival===1?'auto':'none';el.inert=arrival!==1});
 scene.counter.textContent=(p<.24?'01':p<.67?'02':'03')+' / 03';
}
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateParallax)}},{passive:true});addEventListener('resize',updateParallax);reduced.addEventListener('change',updateParallax);
motionButton.addEventListener('click',()=>{manualReduced=!manualReduced;document.body.classList.toggle('reduce-motion',manualReduced);motionButton.setAttribute('aria-pressed',String(manualReduced));motionButton.textContent=manualReduced?'Rétablir les mouvements':'Réduire les mouvements';updateParallax()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)compareStop();else if(!comparePausedByUser&&!manualReduced&&compareInView())compareStart(false)});
// Comparateur en vidéo de fond : il tourne seul dès qu'il est à l'écran, sauf pause demandée ou mouvements réduits.
new IntersectionObserver(([e])=>{
 if(e.isIntersecting&&!comparePausedByUser&&!manualReduced){if(!compareWanted)compareStart(false)}
 else if(!e.isIntersecting&&compareWanted)compareStop();
},{threshold:.4}).observe(compareFrame);
updateParallax();

// VSL de l'accueil : l'affiche reste tant qu'on ne clique pas (rien n'est chargé avant), puis la vidéo joue dans son cadre.
const vslBouton=document.querySelector('.vsl-lancer'),vsl=document.querySelector('.vsl-video');
vslBouton?.addEventListener('click',()=>{compareStop();if(WISTIA.vsl){const f=wistiaFrame(WISTIA.vsl);f.className='vsl-video';f.title='Présentation de Jérôme Haim, monteur vidéo';vsl.replaceWith(f);f.closest('.vsl-placeholder').classList.add('en-lecture');f.focus();return}vsl.src='media/vsl.mp4';vsl.hidden=false;vsl.closest('.vsl-placeholder').classList.add('en-lecture');vsl.focus();vsl.play().catch(()=>{})});
// Son du comparateur : coupé au départ (la lecture automatique l'exige), puis on entend le côté qui occupe le plus le cadre.
function sonCote(){const on=document.querySelector('.compare-son')?.getAttribute('aria-pressed')==='true',brut=Number(compareRange.value)>50;before.muted=!on||!brut;after.muted=!on||brut}
const compareSon=document.querySelector('.compare-son');
compareSon?.addEventListener('click',()=>{const on=compareSon.getAttribute('aria-pressed')!=='true';compareSon.setAttribute('aria-pressed',on);compareSon.textContent=on?'Couper le son':'Activer le son';sonCote();if(on&&!compareWanted){comparePausedByUser=false;compareStart(false)}});
