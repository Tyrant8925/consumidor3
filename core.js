/* Motor compartido por navegador y API REST. No requiere internet. */
(function(root, factory){
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.AhorroCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';
const products = [
 {id:1,name:'Protector solar FPS 50',category:'Cuidado personal',price:249,oldPrice:299,icon:'☀️',description:'Protección solar de uso diario.'},
 {id:2,name:'Gel de limpieza facial',category:'Cuidado personal',price:159,icon:'🫧',description:'Limpieza para tu rutina diaria.'},
 {id:3,name:'Termómetro digital',category:'Salud',price:119,icon:'🌡️',description:'Accesorio para el cuidado en casa.'},
 {id:4,name:'Botiquín básico',category:'Salud',price:189,oldPrice:229,icon:'🩹',description:'Artículos básicos de primeros auxilios.'},
 {id:5,name:'Botella reutilizable',category:'Bienestar',price:129,icon:'💧',description:'Acompaña tu hidratación diaria.'},
 {id:6,name:'Kit de cuidado dental',category:'Cuidado personal',price:99,oldPrice:139,icon:'🪥',description:'Complementa tu higiene bucal.'},
 {id:7,name:'Antifaz para dormir',category:'Bienestar',price:89,icon:'🌙',description:'Accesorio para tu rutina de descanso.'},
 {id:8,name:'Jabón líquido para manos',category:'Cuidado personal',price:65,icon:'🧴',description:'Higiene de manos de uso cotidiano.'},
 {id:9,name:'Crema hidratante corporal',category:'Cuidado personal',price:145,oldPrice:179,icon:'🧴',description:'Hidratación para tu rutina diaria.'},
 {id:10,name:'Vendas elásticas',category:'Salud',price:79,icon:'🩹',description:'Artículo de botiquín de uso general.'},
 {id:11,name:'Cepillo dental suave',category:'Cuidado personal',price:49,icon:'🪥',description:'Complemento para la higiene bucal.'},
 {id:12,name:'Bolsa térmica reutilizable',category:'Bienestar',price:139,oldPrice:169,icon:'🧊',description:'Accesorio reutilizable para el hogar.'}
];

const slots = ['09:00','10:30','12:00','13:30','16:00','17:30'];
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const money = n => '$'+Number(n).toLocaleString('es-MX')+' MXN';
const folio = () => Math.random().toString(36).slice(2,10).toUpperCase();
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
function findProducts(q='',category='',promo=false){
  const words=norm(q).split(' ').filter(Boolean);
  return products.filter(p=>words.every(w=>norm(p.name+' '+p.description+' '+p.category).includes(w))&&(!category||norm(p.category)===norm(category))&&(!promo||p.oldPrice));
}
function matches(m){
  const ignored=new Set(['para','cuidado','producto','productos','precio','cuanto','tiene','tienen','quiero','comprar','donde','dime','buscar','sobre','cuesta','cuestan','kit','digital','reutilizable','personal','salud','bienestar','general']);
  const words=m.split(' ').filter(w=>w.length>=4&&!ignored.has(w));
  return products.map(p=>({p,score:words.filter(w=>norm(p.name).includes(w)||norm(p.name).split(' ').some(t=>t.length>=4&&w===t+'s')).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.p);
}
function chat(message,context={}){
  const m=norm(message); const found=matches(m); const previous=typeof context.intent==='string'?context.intent:'';
  const answer=(reply,intent='general',action=null,productId=null)=>({reply,intent,action,productId,mode:'reglas'});
  if(/urgencia|emergencia|no puedo respirar|dolor de pecho|sobredosis|suicid|me quiero morir/.test(m))return answer('No puedo evaluar emergencias. Si existe peligro inmediato, llama al 911 en México o acude a urgencias.');
  if(/dosis|diagnosti|sintoma|recet|que medicamento|que me tomo|que puedo tomar|embaraz|fiebre|enferm|tratamiento|dolor/.test(m))return answer('No puedo diagnosticar ni recomendar medicamentos o dosis. Consulta a un profesional de salud. Puedo mostrarte la sección de citas de demostración.','citas','citas');
  if(/mis puntos|cuantos puntos tengo|saldo de puntos/.test(m))return answer(`Tu saldo en este navegador es de ${Math.max(0,Math.floor(Number(context.points)||0))} puntos de demostración. Ganas 1 punto por cada $10 MXN en productos.`,'puntos','recompensas');
  if(/promo|descuento|oferta|rebaja/.test(m)){
    const list=found.length?found.filter(p=>p.oldPrice):products.filter(p=>p.oldPrice);
    return answer(list.length?'Estas son las ofertas de demostración:\n'+list.map(p=>`• ${p.name}: ${money(p.price)} (antes ${money(p.oldPrice)}).`).join('\n')+'\n¿Quieres verlas en el catálogo?':'Ese producto no tiene descuento en el catálogo demo.','promos','promo');
  }
  if(/cita|doctor|consulta|horario|agendar/.test(m)||(/^(cuando|como|a que hora|que horas|hay horarios)/.test(m)&&previous==='citas'))return answer('Puedes agendar una consulta general simulada. Horarios: '+slots.join(', ')+'. Elige una fecha desde hoy y confirma en la sección Citas. No es una reserva médica real.','citas','citas');
  if(/envio|entrega|domicilio|pedido|cuanto tarda|cuanto tiempo/.test(m)||(/^(cuanto|como)/.test(m)&&previous==='envio'))return answer('El envío demo cuesta $49 MXN y es gratis desde $499 MXN en productos. Puedes simular el pedido desde tu carrito. No hay entregas reales ni plazos garantizados.','envio','carrito');
  if(/punto|recompensa|monedero|fidel/.test(m))return answer('Ganas 1 punto por cada $10 MXN de productos comprados en la demostración. Puedes consultar el saldo en Recompensas.','puntos','recompensas');
  if(found.length){const p=found[0];if(found.length===1)return answer(`${p.name}: ${money(p.price)}.${p.oldPrice?' Antes '+money(p.oldPrice)+'.':''} ${p.description} Precio y disponibilidad ficticios.`,'producto','producto',p.id);return answer('Encontré estas opciones del catálogo demo:\n'+found.slice(0,5).map(p=>`• ${p.name}: ${money(p.price)}`).join('\n'),'producto','catalogo');}
  if(/precio|cuanto cuesta|cuanto vale/.test(m)&&previous==='producto'&&products.some(p=>p.id===context.productId)){const p=products.find(p=>p.id===context.productId);return answer(`${p.name} cuesta ${money(p.price)} en la demostración.`,'producto','producto',p.id);}
  if(/carrito|comprar|pagar|pago/.test(m))return answer('Agrega productos al carrito y selecciona Simular compra. No pedimos tarjeta ni realizamos cobros.','compra','carrito');
  if(/producto|catalogo|precio|medicamento|buscar|disponib|salud|bienestar/.test(m))return answer('Nuestro catálogo demo incluye cuidado personal, salud y bienestar. Puedes buscar por nombre, por ejemplo «protector solar» o «termómetro».','catalogo','catalogo');
  if(/^(si|claro|vale|ok|de acuerdo)$/.test(m)&&previous==='promos')return answer('¡Perfecto! Pulsa Ver promociones para explorar las ofertas.','promos','promo');
  if(/gracias/.test(m))return answer('¡Con gusto! Aquí estoy si necesitas algo más.');
  if(/hola|buen dia|buenas|hey/.test(m))return answer('¡Hola! Soy Ahorri. Puedo ayudarte con ofertas, precios, citas, pedidos y puntos. ¿Qué necesitas hoy?');
  return answer('No encontré una respuesta exacta. Puedo ayudarte con promociones, precios del catálogo, citas, envío y puntos. Prueba «¿Qué ofertas hay?» o «¿Cuánto cuesta el termómetro?».');
}
function route(method,raw,body={},context={}){
  const url=new URL(raw,'http://localhost');const p=url.pathname;
  if(method==='GET'&&p==='/api/health')return {ok:true,service:'Ahorro+',version:'2.0'};
  if(method==='GET'&&p==='/api/products')return findProducts(url.searchParams.get('q')||'',url.searchParams.get('category')||'',url.searchParams.get('promo')==='true');
  if(method==='GET'&&p==='/api/promotions')return findProducts('','',true);
  if(method==='GET'&&p==='/api/appointments/slots')return {slots:[...slots]};
  if(method==='POST'&&p==='/api/chat'){
    if(typeof body.message!=='string'||!body.message.trim()||body.message.length>500)fail('Escribe un mensaje de hasta 500 caracteres.');
    return chat(body.message,body.context||context);
  }
  if(method==='POST'&&p==='/api/orders'){
    if(!Array.isArray(body.items)||!body.items.length||body.items.length>30)fail('Carrito vacío o inválido.');
    let subtotal=0;const seen=new Set();for(const item of body.items){const prod=products.find(p=>p.id===item?.id);if(!prod||seen.has(item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)fail('Producto o cantidad inválidos.');seen.add(item.id);subtotal+=prod.price*item.quantity;}
    const shipping=subtotal>=499?0:49;return {id:folio(),subtotal,shipping,total:subtotal+shipping,points:Math.floor(subtotal/10),demo:true};
  }
  if(method==='POST'&&p==='/api/appointments'){
    const date=body.date,time=body.time;
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!slots.includes(time))fail('Selecciona una fecha y un horario válidos.');
    const d=new Date(date+'T12:00:00');if(isNaN(d)||d.toISOString().slice(0,10)!==date||date<today())fail('La fecha debe ser válida y no anterior a hoy.');
    return {id:folio(),date,time,service:'Consulta general simulada',demo:true};
  }
  fail('Ruta no encontrada.',404);
}
return {route,products,slots,today,chat};
});
