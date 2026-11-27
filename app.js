'use strict';
const $=id=>document.getElementById(id);
const mxn=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
const store={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let catalog=[...AhorroCore.products],cart=store.get('ahorro-v2-cart',{}),points=Number(store.get('ahorro-v2-points',0))||0,category='',requestNumber=0,toastTimer,searchTimer;
if(!cart||typeof cart!=='object'||Array.isArray(cart))cart={};
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
// API REST si el servidor está activo; motor local si se abre HTML o Live Server.
let connected=false;
function connection(active){connected=active;$('connection').textContent=active?'API REST conectada':'Modo demo local';}
async function detect(){
 if(location.protocol==='file:')return connection(false);
 try{const r=await fetch('/api/health',{signal:AbortSignal.timeout(1500)});const d=await r.json();connection(r.ok&&d.service==='Ahorro+'&&d.version==='2.0');}catch{connection(false);}
}
async function api(path,options={}){
 const method=options.method||'GET';const body=options.body?JSON.parse(options.body):{};
 if(connected){
  try{const r=await fetch('/api'+path,{...options,signal:AbortSignal.timeout(3500),headers:{'Content-Type':'application/json'}});const d=await r.json();if(!r.ok){const err=new Error(d.error||'Solicitud inválida');err.validation=true;throw err;}return d;}
  catch(e){if(e.validation)throw e;connection(false);if(method==='POST'&&path!=='/chat')throw Error('La conexión se interrumpió. Revisa el modo local y confirma de nuevo si deseas repetir la simulación.');}
 }
 return AhorroCore.route(method,'/api'+path,body);
}
const post=(path,data)=>api(path,{method:'POST',body:JSON.stringify(data)});
function notify(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function result(id,msg,error=false){$(id).textContent=msg;$(id).classList.toggle('error',error);}
function sync(){for(const k of Object.keys(cart))if(!Number.isInteger(cart[k])||cart[k]<1||cart[k]>20||!catalog.some(p=>p.id===Number(k)))delete cart[k];store.set('ahorro-v2-cart',cart);store.set('ahorro-v2-points',points);$('cart-count').textContent=Object.values(cart).reduce((a,b)=>a+b,0);$('points').textContent=points.toLocaleString('es-MX');}
function renderProducts(items){const root=$('products');root.replaceChildren();result('catalog-status',`${items.length} productos disponibles`);for(const p of items){const card=el('article','product'),art=el('div','product-art',p.icon);art.setAttribute('aria-hidden','true');if(p.oldPrice)art.append(el('span','sale',`-${Math.round((1-p.price/p.oldPrice)*100)}%`));card.append(art,el('div','category',p.category),el('h3','',p.name),el('p','',p.description));const price=el('div','price');price.append(el('strong','',mxn(p.price)));if(p.oldPrice)price.append(el('del','',mxn(p.oldPrice)));const b=el('button','btn primary','+ Agregar al carrito');b.addEventListener('click',()=>{if((cart[p.id]||0)>=20)return notify('Máximo 20 unidades por producto.');cart[p.id]=(cart[p.id]||0)+1;sync();notify(`${p.name} agregado`);});card.append(price,b);root.append(card);}if(!items.length)root.append(el('p','','No encontramos productos. Prueba otra búsqueda.'));}
async function filter(){const id=++requestNumber;const q=new URLSearchParams({q:$('search').value});if(category==='promo')q.set('promo','true');else if(category)q.set('category',category);try{const items=await api('/products?'+q);if(id===requestNumber)renderProducts(items);}catch(e){if(id===requestNumber)result('catalog-status','No se pudo cargar el catálogo. Comprueba el servidor.',true);}}
function setFilter(value){category=value;for(const b of $('filters').querySelectorAll('button')){const active=b.dataset.category===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}filter();}
$('filters').addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(b)setFilter(b.dataset.category);});$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(filter,180);});$('promo-link').addEventListener('click',()=>{$('search').value='';setFilter('promo');});
function cartData(){return Object.entries(cart).map(([id,quantity])=>({p:catalog.find(x=>x.id===Number(id)),quantity})).filter(x=>x.p);}
function renderCart(){const root=$('cart-items');root.replaceChildren();let subtotal=0;const items=cartData();for(const {p,quantity} of items){subtotal+=p.price*quantity;const row=el('div','cart-line'),label=el('div'),qty=el('div','qty');label.append(el('strong','',p.name),el('div','',mxn(p.price*quantity)));for(const delta of [-1,1]){const b=el('button','',delta===-1?'−':'+');b.setAttribute('aria-label',(delta===-1?'Quitar ':'Agregar ')+p.name);b.disabled=delta===1&&quantity>=20;b.addEventListener('click',()=>{cart[p.id]=quantity+delta;if(cart[p.id]<=0)delete cart[p.id];sync();renderCart();});qty.append(b);if(delta===-1)qty.append(el('span','',quantity));}row.append(label,qty);root.append(row);}if(!items.length)root.append(el('p','','Tu carrito está vacío.'));const shipping=subtotal===0||subtotal>=499?0:49;const sum=$('cart-summary');sum.replaceChildren();for(const [k,v] of [['Subtotal',subtotal],['Envío demo',shipping],['Total',subtotal+shipping]]){const line=el('div','summary-line'+(k==='Total'?' total':''));line.append(el('span','',k),el('span','',mxn(v)));sum.append(line);}$('checkout').disabled=!items.length;}
$('cart-open').addEventListener('click',()=>{result('cart-result','');renderCart();$('cart-dialog').showModal();});$('cart-close').addEventListener('click',()=>$('cart-dialog').close());
$('checkout').addEventListener('click',async()=>{const btn=$('checkout');btn.disabled=true;try{const order=await post('/orders',{items:cartData().map(({p,quantity})=>({id:p.id,quantity}))});points+=order.points;cart={};sync();renderCart();result('cart-result',`Pedido demo ${order.id} confirmado. Total: ${mxn(order.total)}. Ganaste ${order.points} puntos. No se realizó ningún cobro.`);notify('¡Compra simulada completada!');}catch(e){result('cart-result',e.message,true);btn.disabled=false;}});
const d=new Date();$('date').min=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
$('appointment-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;try{const a=await post('/appointments',{date:$('date').value,time:$('time').value});result('appointment-result',`Cita demo confirmada: ${a.date} a las ${a.time}. Folio ${a.id}. No es una reserva real.`);}catch(err){result('appointment-result',err.message,true);}finally{b.disabled=false;}});
function openChat(open=true){$('chat-panel').hidden=!open;$('chat-toggle').setAttribute('aria-expanded',String(open));if(open)$('chat-input').focus();}
$('chat-toggle').addEventListener('click',()=>openChat($('chat-panel').hidden));$('chat-close').addEventListener('click',()=>openChat(false));$('hero-chat').addEventListener('click',()=>openChat());$('bottom-chat').addEventListener('click',()=>openChat());
function message(text,role){const n=el('div','bubble '+role,text);$('messages').append(n);$('messages').scrollTop=$('messages').scrollHeight;return n;}
let chatting=false,chatContext={};
function chatAction(data){
 const labels={promo:'Ver promociones',catalogo:'Abrir catálogo',producto:'Ver producto',citas:'Agendar cita demo',carrito:'Abrir carrito',recompensas:'Ver mis recompensas'};
 if(!labels[data.action])return;
 const b=el('button','chat-action',labels[data.action]+' →');b.type='button';
 b.addEventListener('click',()=>{openChat(false);if(data.action==='carrito')return $('cart-open').click();if(['promo','catalogo','producto'].includes(data.action)){$('search').value=data.action==='producto'?(catalog.find(p=>p.id===data.productId)?.name||''):'';setFilter(data.action==='promo'?'promo':'');$('catalogo').scrollIntoView();}else $(data.action).scrollIntoView();});
 $('messages').append(b);
}
async function send(text){
 text=text.trim();if(!text||chatting)return;chatting=true;const input=$('chat-input');input.value='';message(text,'user');const loading=message('Escribiendo…','bot');$('chat-form').querySelector('button').disabled=true;
 try{const data=await post('/chat',{message:text,context:{...chatContext,points}});loading.textContent=data.reply;chatContext={intent:data.intent,productId:data.productId};chatAction(data);}
 catch(e){loading.textContent=e.message||'Escribe otra pregunta.';}
 finally{chatting=false;$('chat-form').querySelector('button').disabled=false;$('messages').scrollTop=$('messages').scrollHeight;input.focus();}
}
$('chat-form').addEventListener('submit',e=>{e.preventDefault();send($('chat-input').value);});$('quick').addEventListener('click',e=>{const b=e.target.closest('button[data-question]');if(b)send(b.dataset.question);});
async function init(){
 // Render inmediato: los datos locales no dependen de la red.
 sync();renderProducts(catalog);for(const s of AhorroCore.slots){const o=el('option','',s);o.value=s;$('time').append(o);}
 $('date').min=AhorroCore.today();$('date').value=AhorroCore.today();
 await detect();
 if(connected){try{catalog=await api('/products');sync();await filter();}catch{connection(false);}}
}
init();
