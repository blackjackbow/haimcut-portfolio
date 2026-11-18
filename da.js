/* Charte du 04/11/2026, thème Fusion seul (06/11/2026) : texture papier, couches déchirées, éléments de fond. */
(function(){
 // Un type de papier par couleur (demande de Jérôme du 05/11/2026) : relief éclairé en rasant + fibres,
 // rendus une fois ; da.css relie chaque couleur (--l0…--l4, --deep) à son papier.
 const W=420;
 const relief=(id,freq,oct,seed,z,slope,inter,alpha)=>`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" stitchTiles="stitch"/>
  <feDiffuseLighting lighting-color="#fff" surfaceScale="${z}"><feDistantLight azimuth="235" elevation="50"/></feDiffuseLighting>
  <feComponentTransfer><feFuncR type="linear" slope="${slope}" intercept="${inter}"/><feFuncG type="linear" slope="${slope}" intercept="${inter}"/><feFuncB type="linear" slope="${slope}" intercept="${inter}"/><feFuncA type="linear" slope="${alpha}"/></feComponentTransfer></filter>`;
 const fibres=(id,freq,seed)=>`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.25"/></filter>`;
 // taches : petits points d'une couleur r g b là où le bruit est bas (pente et seuil règlent leur nombre)
 const points=(id,freq,seed,rgb,pente,seuil)=>{const [r,g,b]=rgb.split(' ');return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="1" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${pente} 0 0 0 ${seuil}"/></filter>`};
 const papier=(a,b,op)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}">${a}${b}<rect width="100%" height="100%" filter="url(#a)"/><rect width="100%" height="100%" filter="url(#b)" opacity="${op}"/></svg>`;
 const PAPIERS={
  aquarelle:papier(relief('a','.05',4,3,2.4,1.5,-.8,.55),relief('b','1.1 .8',2,5,.6,1.4,-.75,.6),.6), // grosses alvéoles + grain fin
  verge:papier(relief('a','.003 .35',1,11,.6,1.25,-.62,.3),fibres('b','.035 .6',9),.15),               // fines vergeures horizontales, discrètes
  fibre:papier(relief('a','1.1 .8',3,5,.9,1.6,-.86,.6),fibres('b','.035 .6',9),.18),                    // le papier fibré d'origine
  // longues fibres : une bande étroite du bruit donne des traits fins et sinueux
  washi:papier(relief('a','.9 .9',2,7,.5,1.3,-.7,.35),`<filter id="b"><feTurbulence type="fractalNoise" baseFrequency=".018 .05" numOctaves="3" seed="21" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 0 0 0 0 0 0 .8 0 0 0 0 0 0 0 0 0 0"/></feComponentTransfer></filter>`,.3),
  coton:papier(relief('a','.018',3,13,2.4,1.5,-.78,.6),relief('b','1.4',2,17,.4,1.2,-.62,.6),.4),      // marbrure douce, feutrée
  kraft:papier(relief('a','.55 .5',3,19,1.1,1.6,-.84,.55),fibres('b','.08 .45',23),.25),                // grain moyen, fibres courtes
  // Une matière par section (demande du 17/11/2026 : « chaque page doit avoir une matière différente ») : six papiers de plus.
  froisse:papier(relief('a','.012',4,31,5,1.7,-.9,.6).replace('fractalNoise','turbulence'),relief('b','1.2',2,33,.5,1.3,-.7,.5),.4), // pliures cassées d'un papier froissé
  crepon:papier(relief('a','.015 .45',3,41,1.8,1.5,-.8,.55),relief('b','1.3',2,43,.4,1.2,-.62,.4),.35),   // fines fronces horizontales
  journal:papier(relief('a','1.6',2,51,.5,1.2,-.6,.5),points('b','.9',53,'0 0 0',-14,4.4),1),           // grain lisse et petites taches d'encre
  carton:papier(relief('a','.35',3,61,1.4,1.5,-.8,.55),points('b','.6',63,'.9 .8 .6',-12,4.3),.8),       // carton gris : grain et paillettes claires
  calque:papier(relief('a','.005 .02',3,71,2.2,1.5,-.72,.5),relief('b','2.2',1,73,.2,1.1,-.55,.3),.4),       // calque : presque lisse, nuages à peine marqués
  toile:papier(relief('a','.9 .03',2,81,.8,1.4,-.7,.4),relief('b','.03 .9',2,83,.8,1.4,-.7,.4),1)        // papier toilé : trame croisée
 };
 for(const [nom,svg] of Object.entries(PAPIERS))document.documentElement.style.setProperty('--p-'+nom,`url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`);
 document.documentElement.style.setProperty('--tex','var(--p-fibre)');

 // bord déchiré : grandes ondulations + petite irrégularité, reproductible par graine
 function bord(seed){
  let r=seed*9301+49297;const rnd=()=>((r=(r*9301+49297)%233280)/233280);const pts=[];
  for(let x=0;x<=100;x+=1.25){const y=6+Math.sin(x/9+seed)*2.6+Math.cos(x/23+seed*2)*1.7+(rnd()-.5)*1.4;pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`)}
  return `M0,100 L0,6 ${pts.join(' ')} L100,100 Z`;
 }
 const HAUTEURS={'stack-home':[62,72,82,91],'stack-poster':[56,71,86],'stack-booking':[50,63,76,88]};
 // Un élément de fond différent par section, qui bouge à peine (retour du 05/11/2026 : « manque élément discret différent ») ;
 // les mouvements sont dans da.css (classes deco-*).
 const barres=n=>Array.from({length:n},(_,i)=>`<i style="--h:${(.25+.75*Math.abs(Math.sin(i*.7)*Math.cos(i*.23))).toFixed(2)};animation-delay:${(-i*.17).toFixed(2)}s"></i>`).join('');
 // « Tu veux voir le résultat ? » (06/11/2026 : plus de vagues, déjà au début et à la fin) : une timeline de montage
 // en papier déchiré, pistes V2 / V1 / A1 ; la tête de lecture avance et les pistes glissent avec le défilement (--story-progress).
 const dechire=g=>{let r=g*7919;const n=()=>((r=(r*9301+49297)%233280)/233280);const haut=[],bas=[];
  for(let x=0;x<=100;x+=10){haut.push(`${x}% ${(n()*9).toFixed(1)}%`);bas.unshift(`${x}% ${(91+n()*9).toFixed(1)}%`)}
  return `polygon(${haut.concat(bas).join(',')})`};
 const PISTES=[['V2',0,[[6,9],[24,13],[49,7],[64,12],[86,9],[112,11],[133,8]]],
               ['V1',3,[[0,17],[18,11],[30,21],[52,15],[68,19],[88,13],[102,22],[125,16]]],
               ['A1',4,[[0,29],[30,23],[54,27],[82,25],[108,30],[139,12]]]];
 const montage=()=>'<div class="deco-montage"><span class="tete"></span>'+PISTES.map(([nom,k,clips],p)=>
  `<div class="piste"><b>${nom}</b><div class="clips" style="--v:${[.22,.32,.16][p]}">`+clips.map(([x,w],i)=>
  `<i style="left:${x/1.5}%;width:${w/1.5}%;background-color:var(--l${k});background-image:var(--tex-l${k});clip-path:${dechire(p*31+i+1)}"></i>`).join('')+'</div></div>').join('')+'</div>';
 const DECORS={
  '.story-stage':montage(),
  '.work':'<div class="deco-pellicule"></div>',                                     // pellicule qui défile très lentement
  '.comparison':`<div class="deco-onde">${barres(56)}</div>`,                        // forme d'onde du son qui respire
  '#douleurs':'<div class="deco-collure"><i class="bout g"></i><i class="bout d"></i><i class="scotch"></i></div>', // collure de pellicule en papier, recollée au scotch
  '#process':'<svg class="deco-fil" viewBox="0 0 1200 300" preserveAspectRatio="none"><path d="M-20,240 C200,120 380,280 600,170 S1000,60 1220,150"/></svg>', // fil pointillé qui avance
  '.about':'<div class="deco-lune"></div>',                                          // halo de l'heure bleue qui respire
  '.trial .orbit-a':'<div class="deco-satellite"></div>',                            // point qui glisse sur l'orbite
  '.faq':'<div class="deco-papiers"><i></i><i></i><i></i><i></i><i></i></div>',     // petits papiers qui flottent
  'footer':'<div class="deco-bobine"></div>'                                         // bobine de film qui tourne (générique de fin)
 };
 function decors(){
  for(const [sel,html] of Object.entries(DECORS))document.querySelectorAll(sel).forEach(s=>{
   if(s.querySelector(':scope>.deco'))return;
   const d=document.createElement('div');d.className='deco';d.setAttribute('aria-hidden','true');d.innerHTML=html;s.prepend(d);
  });
 }

 function dessiner(){
  let graine=1;
  document.querySelectorAll('.paper-stack').forEach(stack=>{
   const nom=[...stack.classList].find(c=>HAUTEURS[c]),tops=HAUTEURS[nom],layers=stack.querySelectorAll('.paper-layer');
   layers.forEach((layer,i)=>{
    const k=i+(5-layers.length),masque=`url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${bord(graine++*3)}"/></svg>`)}")`;
    layer.style.top=tops[i]+'%';layer.dataset.v=((k+1)/5).toFixed(2);
    const fill=document.createElement('div');fill.className='paper-fill';
    fill.style.backgroundColor=`var(--l${k})`;fill.style.backgroundImage=`var(--tex-l${k})`;
    fill.style.setProperty('-webkit-mask-image',masque);fill.style.setProperty('mask-image',masque);
    layer.replaceChildren(fill);
   });
  });
 }

 // parallaxe à la souris : les couches proches bougent plus (propriété translate, la défilement garde transform)
 function souris(){
  const calme=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion');
  document.querySelectorAll('.vsl-home,.booking').forEach(zone=>{
   zone.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||calme())return;
    const r=zone.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;
    zone.querySelectorAll('.paper-layer').forEach(l=>{const v=+l.dataset.v;l.style.translate=`${(-dx*34*v).toFixed(1)}px ${(-dy*12*v).toFixed(1)}px`});
   });
   zone.addEventListener('pointerleave',()=>zone.querySelectorAll('.paper-layer').forEach(l=>{l.style.translate=''}));
  });
 }
 document.addEventListener('DOMContentLoaded',()=>{
  decors();dessiner();souris();
 });
})();
