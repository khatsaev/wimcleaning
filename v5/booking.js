'use strict';
/* Local prototype booking flow. No network upload or automatic photo valuation. */
const bookingItems = () => draft.repeatItems || cartItems();
const bookingTotal = () => itemsTotal(bookingItems());
function bookingBrief() {
 if (!draft.repeatItems) return cartBrief();
 return '<div class="card stack"><h3>Те же вещи</h3>'+groupsOf(draft.repeatItems).map(([k,items])=>'<div><b>'+SERV[k].chipLabel+'</b><ul class="lines">'+items.map((it,i)=>'<li>'+esc(itemLine(k,it,i))+'</li>').join('')+'</ul></div>').join('')+'<p class="help">Состав скопирован из заказа №'+draft.repeatOf+'. Ваш текущий сбор услуг сохранён.</p></div>';
}
function bookingIntro() {
 return (draft.repeatOf?'<p class="notice">Повтор заказа №'+draft.repeatOf+'. Адрес, телефон и параметры заполнены.'+(draft.date?' Предлагаем '+fmtDate(draft.date)+', '+draft.time+'.':' Выберите дату и время.')+' Проверьте и подтвердите заявку.</p>':'')+
 (Object.keys(errs).length?'<div class="notice booking-errors" role="alert" tabindex="-1"><b>Проверьте заявку</b><ul>'+Object.values(errs).map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>':'');
}
function validBookingDate(value) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const parsed = new Date(value+'T12:00:00');
 return !isNaN(parsed) && iso(parsed) === value && value >= addDays(0);
}
function slotReason(date, slot) {
 if (!validBookingDate(date)) return 'Сначала выберите дату';
 if (!SLOTS.includes(slot)) return 'Выберите время';
 const now = new Date();
 const start = Number(slot.slice(0,2))*60+Number(slot.slice(3,5));
 if (date === addDays(0) && start <= now.getHours()*60+now.getMinutes()) return 'Время прошло';
 const count = S.orders.filter(o=>o.date===date && o.time===slot && o.status!=='cancelled').length;
 if (count >= limitOf(slot)) return 'Нет мест';
 return '';
}
const slotAvailable = (date,slot) => !slotReason(date,slot);
function bookingSlotsHTML() {
 return SLOTS.map(slot=>{const reason=slotReason(draft.date,slot);return '<button type="button" class="pick booking-slot" data-act="pickTime" data-v="'+slot+'" aria-pressed="'+(draft.time===slot)+'"'+(reason?' disabled':'')+'><span>'+slot+'</span><span class="xs">'+(reason||'Доступно')+'</span></button>'}).join('');
}
function bookingScheduleHTML() {
 return '<div class="field"><label for="f_date">Дата '+(draft.service==='facade'?'выезда':'забора')+'</label><input class="inp" type="date" id="f_date" data-bind="date" min="'+addDays(0)+'" value="'+esc(draft.date)+'" required aria-describedby="e_date">'+(fieldErr('date')||'<span id="e_date" class="help">Выберите удобный день.</span>')+'</div>'+
 '<div class="field"><span class="lbl" id="lbltime">Время '+(draft.service==='facade'?'выезда':'забора')+'</span><div class="grid2" id="bookingSlots" role="group" aria-labelledby="lbltime">'+bookingSlotsHTML()+'</div><span id="e_time" class="error" role="alert">'+esc(errs.time||'')+'</span><p class="help">Доступность — по локальному расписанию прототипа.</p></div>';
}
function scheduleChanged() {
 if (!slotAvailable(draft.date,draft.time)) draft.time='';
 const slots=$('#bookingSlots');if(slots)slots.innerHTML=bookingSlotsHTML();
}
function validateSchedule(d,errors) {
 if (!validBookingDate(d.date)) errors.date='Выберите дату не раньше сегодняшней.';
 if (!d.time) errors.time='Выберите удобное время.';
 else if (!slotAvailable(d.date,d.time)) errors.time='Это окно недоступно. Выберите другое время.';
}
function startBooking(service) {
 if(draft.repeatOf || draft.service!==service){
  const previous=draft;releasePhotos(previous);
  const latest=S.user&&S.orders.filter(o=>o.mine).sort((a,b)=>b.created-a.created)[0];
  draft=Object.assign(newDraft(),{service,address:previous.address||(latest&&latest.address)||'',name:previous.name||(latest&&latest.name)||'',phone:previous.phone||(latest&&latest.phone)||''});
 }
 errs={};go('form');
}
function repeatOrder(id) {
 const o=byId(id);if(!o||!o.mine)return;
 releasePhotos(draft);
 draft=Object.assign(newDraft(),{repeatOf:id,service:o.service,qty:o.qty==null?'':String(o.qty),address:o.address,name:o.name,phone:o.phone,comment:o.comment||'',photos:(o.photos||[]).map((url,i)=>({name:'Фото '+(i+1),url,thumb:url}))});
 if(o.service==='pickup')draft.repeatItems=JSON.parse(JSON.stringify(o.items||[]));
 // Pick a new available appointment; never reuse the past appointment silently.
 for(let day=1;day<=30;day++){
  const date=addDays(day),slot=SLOTS.find(time=>slotAvailable(date,time));
  if(slot){draft.date=date;draft.time=slot;break}
 }
 errs={};go('form');
}
function releasePhotos(d) {
 for(const p of d.photos||[])if(p.url.startsWith('blob:'))URL.revokeObjectURL(p.url);
}
function decodePhoto(file) {
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  let finished=false;
  const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);URL.revokeObjectURL(url);error?reject(error):resolve(value)};
  const timer=setTimeout(()=>finish(new Error('Не удалось прочитать фото. Попробуйте JPEG или PNG.')),15000);
  img.onerror=()=>finish(new Error('Файл повреждён или формат не поддерживается. Попробуйте JPEG или PNG.'));
  img.onload=()=>{try{
   if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>50000000)throw new Error('Слишком большое разрешение. Выберите фото до 50 мегапикселей.');
   const canvas=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL('image/jpeg',.76);finish(null,{name:file.name,url:data,thumb:data});
  }catch(error){finish(error)}};
  img.src=url;
 });
}
async function addFiles(files) {
 const target=draft;if(target.processingPhotos)return;
 target.processingPhotos=true;delete errs.photos;
 photoBox();
 const errors=[];
 if(files.length>5-target.photos.length)errors.push('Можно добавить не больше 5 фото.');
 const selected=files.slice(0,Math.max(0,5-target.photos.length));
 for(const file of selected){
  if(!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)){errors.push('Поддерживаются JPEG, PNG, WebP и HEIC.');continue}
  if(file.size>12*1024*1024){errors.push('Фото «'+file.name+'» больше 12 МБ.');continue}
  try{const photo=await decodePhoto(file);if(draft===target)target.photos.push(photo)}catch(error){errors.push(error.message)}
 }
 target.processingPhotos=false;
 if(draft!==target)return;
 if(errors.length)errs.photos=[...new Set(errors)].join(' ');else delete errs.photos;
 if(view.name==='form'){
  photoBox();const old=$('#photoBox').parentElement.querySelector('.error');if(old)old.remove();
  if(errs.photos)setErr('photos');
 }
}
let submitting=false;
function send() {
 if(submitting)return;
 if(!validate()){render();const summary=$('.booking-errors');if(summary)summary.focus();return}
 if(!S.user){go('login');return}
 submitting=true;
 const before=JSON.parse(JSON.stringify(S)),d=draft;
 const id=Math.max(1040,...S.orders.map(o=>o.id))+1,q=num(d.qty);
 const o={id,mine:true,name:d.name.trim(),phone:d.phone.trim(),service:d.service,qty:Number.isFinite(q)?q:null,address:d.address.trim(),date:d.date,time:d.time,comment:[d.desc&&('Здание: '+d.desc),d.comment].filter(Boolean).join('. '),photos:d.photos.map(p=>p.thumb),price:d.service==='facade'||!Number.isFinite(q)?null:priceOf(d.service,q),status:'accepted',history:[{s:'accepted',t:Date.now()}],staff:'',note:'',created:Date.now()};
 if(d.repeatOf)o.repeatOf=d.repeatOf;
 if(d.service==='pickup'){
  o.items=JSON.parse(JSON.stringify(bookingItems()));o.price=itemsTotal(o.items);o.qty=null;
  if(d.useBonus){const bonus=bonusCan(o.price);if(bonus)o.bonusUse=bonus}
  if(!d.repeatItems)S.cart={};
 }
 S.orders.unshift(o);notifyOrder(o,'accepted');
 if(!save()){S=before;submitting=false;return}
 releasePhotos(d);draft=newDraft();errs={};stack=[];view={name:'done',id};submitting=false;render();
}
function saveAdminOrder(id) {
 const o=byId(id);if(!o||mode!=='admin')return;
 const before=JSON.parse(JSON.stringify(S)),price=$('#aprice'),ready=$('#aready');
 const readyDate=ready?ready.value.trim():o.readyDate||'';
 if(!validCompletionDate(readyDate,o)){toast('Укажите корректную дату готовности не раньше даты заказа.');if(ready)ready.focus();return}
 const previous=o.price;
 const previousReady=o.readyDate||'';
 if(price){const raw=price.value.trim(),amount=Number(raw.replace(',','.'));
  if(raw&&(!Number.isFinite(amount)||amount<=0)){toast('Укажите цену больше нуля.');price.focus();return}
  o.price=raw?amount:null;
 }
 o.staff=$('#astaff').value;o.note=$('#anote').value;o.readyDate=readyDate;
 if(price&&o.price!=null&&o.price!==previous)notifyOrder(o,'estimate');
 if(readyDate!==previousReady)notifyOrder(o,'schedule');
 if(!save()){S=before;return}toast('Сохранено в прототипе');
}
