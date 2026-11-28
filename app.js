/*
 * Wolly LIFF画面（GitHub Pagesに置く）。設定は config.js、画面の種類は index.html の data-app で決まります。
 * 同じファイルを GAS のテスト用画面（Form.html）でも使います（tests/sync-gas.js で gas/LiffApp.html に写す）。
 * 呼び名：user＝メンバー、client＝パートナー
 */
const APP = document.body.dataset.app === 'client' ? 'client' : 'user';
const CFG = window.WOLLY || {};
const TEST = !!CFG.test;
const C = { page: '', q: new URLSearchParams() };
let ID_TOKEN = '';
const OPT_TIMES = ['平日AM 9:00〜12:00','平日AM 9:00〜15:00','平日AM 9:00〜18:00','土日AM 9:00〜12:00','土日AM 9:00〜15:00','土日AM 9:00〜18:00','行事に合わせて調整したい','短時間ならいつでも可'];
const OPT_JOBS = ['スーパーなどのレジ','イベントや行事のサポート','子供関連（工作や見守り）','配膳、片付けなどの軽作業','チラシ配り、アンケート','配信のお仕事','塾の補助','トリマー・動物病院のケア','美容師スタイリスト','美容師アシスタント','保育士','保育補助スタッフ'];
const AD_TYPES = ['お店・サービスの紹介','クーポン','イベント・教室の告知'];
const AD_CATEGORIES = ['飲食','美容','習い事・教室','子育て','暮らし・医療','その他'];
const CHECK = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const app = document.getElementById('app');

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function yen(n){return Number(n||0).toLocaleString('ja-JP')+'円'}

/* ---------- 通信：LIFFは GAS の doPost へ fetch、テスト用画面は google.script.run ---------- */
async function call(action,payload){
  if(TEST)return new Promise((ok,ng)=>google.script.run.withSuccessHandler(ok).withFailureHandler(ng).formApi(action,CFG.uid,payload||{}));
  const res=await fetch(CFG.gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({app:APP,idToken:ID_TOKEN,action,payload:payload||{}})});
  const j=await res.json();
  if(!j.ok){if(j.code==='auth'){try{liff.logout()}catch(_){}liff.login({redirectUri:location.href})}throw new Error(j.error||'エラーが発生しました。時間をおいて開き直してください。')}
  return j.data;
}
function url(page,extra){
  const q=new URLSearchParams({page});Object.keys(extra||{}).forEach(k=>q.set(k,extra[k]));
  if(TEST){q.set('uid',CFG.uid);return CFG.baseUrl+'?'+q.toString()}
  return location.pathname+'?'+q.toString();
}
/* 画面を移る（リンクを押したのと同じにする。読み込み中の表示も出る） */
function go(u){const a=document.createElement('a');a.href=u;document.body.appendChild(a);a.click();a.remove()}
function closeApp(){if(TEST)return toast('テスト用画面です（LINEでは閉じます）');try{liff.closeWindow()}catch(_){}}

/* ---------- 画面の部品 ---------- */
let tt;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3000)}
const LOGOS=Object.assign({user:'../img/member_logo.png',client:'../img/partner_logo.jpg'},window.WOLLY_LOGOS||{});
const SURVEY_URL=CFG.surveyUrl||'https://mosa0131.my.canva.site/dahp5myj7vg';
function header(title){
  if(APP==='user')return `<header class="hero"><img class="logo" src="${esc(LOGOS.user)}" alt="Wolly spot"><b>${esc(title)}</b></header>`;
  return `<header class="bar pbar"><img class="plogo" src="${esc(LOGOS.client)}" alt="Wolly spot"><div><b>${esc(title)}</b><span>Wolly パートナー</span></div></header>`;
}
function shell(title,body){document.title=title+'｜Wolly';app.innerHTML=header(title)+`<main class="liff">${body}</main>`;window.scrollTo(0,0)}
function loading(title){shell(title,'<div class="loading" role="status"><span class="spin" aria-hidden="true"></span>読み込み中…</div>')}
/* 送信中は画面全体を覆い、くるくると「送信しています」を出す（二重送信も防ぐ） */
function busy(on,text){
  let o=document.getElementById('busy');
  if(!on){if(o)o.remove();return}
  if(!o){o=document.createElement('div');o.id='busy';o.className='busy';o.setAttribute('role','status');o.setAttribute('aria-live','assertive');document.body.appendChild(o)}
  o.innerHTML=`<div class="busy-in"><span class="spin" aria-hidden="true"></span><b>${esc(text||'送信しています…')}</b><small>画面を閉じずに、そのままお待ちください</small></div>`;
}
function fail(title,e){shell(title,`<div class="ngbox">${esc(e&&e.message?e.message:e)}</div>`)}
function done(title,html,noBack){shell(title,`<div class="center"><div class="done-ic">${CHECK}</div>${html}${noBack?'':'<p><button class="btn-sub" type="button" onclick="closeApp()">LINEに戻る</button></p>'}</div>`)}
function chips(name,opts,sel,type){type=type||'checkbox';return `<div class="chips">${opts.map(o=>`<label><input type="${type}" name="${name}" value="${esc(o)}" ${(sel||[]).indexOf(o)>=0?'checked':''}>${esc(o)}</label>`).join('')}</div>`}
function link(u,t){return u?`<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`:t}
function ymd(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function age(b,on){if(!b)return null;const d=b.split('-').map(Number),n=on?on.split('-').map(Number):[new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate()];let a=n[0]-d[0];if(n[1]<d[1]||(n[1]===d[1]&&n[2]<d[2]))a--;return a}
function toLocal(v){const m=String(v||'').match(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`:''}
function isNight(s,e){const m=t=>{const x=String(t||'').match(/(\d{1,2}):(\d{2})/);return x?+x[1]*60+ +x[2]:NaN};const a=m(s),b=m(e);if(isNaN(a)||isNaN(b))return false;return a<300||b>1320||b<=a}
/* ---------- 入力の不備：該当する項目を赤で示し、その位置までスクロールする ---------- */
function fieldLabel(f){const l=f.querySelector(':scope>label,:scope>.lbl');return l?l.textContent.replace(/必須/g,'').replace(/[（(][^）)]*[）)]/g,'').trim():''}
function clearErrors(form){form.querySelectorAll('.err').forEach(f=>f.classList.remove('err'));form.querySelectorAll('.errmsg,.formerr').forEach(x=>x.remove())}
function markError(box,msg){if(box.classList.contains('err'))return;box.classList.add('err');const p=document.createElement('p');p.className='errmsg';p.setAttribute('role','alert');p.textContent=msg;box.appendChild(p)}
function goTo(box){box.scrollIntoView({block:'center',behavior:'smooth'});const el=box.querySelector('input:not([type=hidden]),textarea,select');if(el)setTimeout(()=>{try{el.focus({preventScroll:true})}catch(_){}},300)}
/* 画面での確認（必須・形式・下限など）。不備があれば最初の項目を返す */
function checkForm(form){
  let first=null;
  Array.from(form.elements).forEach(el=>{
    if(!el.willValidate||el.checkValidity())return;
    const box=el.closest('.fld')||el.closest('.agree');if(!box||box.classList.contains('err'))return;
    const v=el.validity,lbl=box.classList.contains('agree')?'':fieldLabel(box);
    const msg=box.classList.contains('agree')?'同意が必要です（チェックを入れてください）。'
      :v.valueMissing?(el.type==='radio'||el.type==='checkbox'?lbl+'を選んでください。':lbl+'を入力してください。')
      :v.rangeUnderflow&&el.dataset.minmsg?el.dataset.minmsg
      :v.rangeUnderflow?lbl+'は'+(el.type==='date'||el.type==='datetime-local'?el.min.replace('T',' ')+'以降':el.min+'以上')+'にしてください。'
      :v.typeMismatch?lbl+'の形式を確認してください。':v.tooLong?lbl+'が長すぎます。':el.validationMessage;
    markError(box,msg);first=first||box;
  });
  return first;
}
/* サーバーからのエラー文を、文中に先に出てくる項目名の項目に付ける。どれにも当たらなければフォームの先頭に出す */
function showError(form,msg){
  let hit=null,at=1e9;
  if(/同意/.test(msg)){const r=form.querySelector('.agree input[required]');hit=r?r.closest('.agree'):form.querySelector('.agree')}
  if(!hit)form.querySelectorAll('.fld').forEach(f=>{const l=fieldLabel(f);if(!l)return;const i=msg.indexOf(l);if(i>=0&&i<at){at=i;hit=f}});
  if(hit){markError(hit,msg);goTo(hit);return}
  const top=document.createElement('div');top.className='ngbox formerr';top.setAttribute('role','alert');top.textContent=msg;form.prepend(top);goTo(top);
}
function bindSubmit(form,title,fn){
  form.noValidate=true;
  form.addEventListener('input',e=>{const b=e.target.closest('.err');if(b){b.classList.remove('err');const m=b.querySelector('.errmsg');if(m)m.remove()}});
  form.addEventListener('change',e=>{const b=e.target.closest('.err');if(b){b.classList.remove('err');const m=b.querySelector('.errmsg');if(m)m.remove()}});
  form.addEventListener('submit',async e=>{
    e.preventDefault();clearErrors(form);
    const bad=checkForm(form);
    if(bad){goTo(bad);toast('入力内容を確認してください（赤字の項目）');return}
    const btn=form.querySelector('[type=submit]'),label=btn.textContent;btn.disabled=true;btn.textContent='送信中…';
    busy(true,form.dataset.img?'画像と一緒に送信しています…':'送信しています…');
    try{await fn(new FormData(form))}
    catch(err){const m=err&&err.message?err.message:'エラーが発生しました';showError(form,m);toast('入力内容を確認してください');btn.disabled=false;btn.textContent=label}
    finally{busy(false)}
  });
}
/* ---------- カレンダー（月ごと）。複数の日を選ぶ・その日の予定を見るのに使う ----------
 * o.month 'yyyy-MM'、o.marks {'yyyy-MM-dd':{cls,txt}}、o.sel 選んだ日の Set、o.min/o.max 選べる範囲、o.only marks のある日だけ押せる、o.onTap(日付) */
const WD=['日','月','火','水','木','金','土'];
const CAL_IC='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
function mdw(k){const p=String(k||'').split('-').map(Number);if(p.length<3)return '';const d=new Date(p[0],p[1]-1,p[2]);return (p[1])+'/'+p[2]+'('+WD[d.getDay()]+')'}
function datesText(ks){ks=ks.slice().sort();return ks.length<=3?ks.map(mdw).join('・'):mdw(ks[0])+'〜'+mdw(ks[ks.length-1])+'のうち'+ks.length+'日'}
function addMonth(m,n){const p=m.split('-').map(Number),d=new Date(p[0],p[1]-1+n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function calendar(box,o){
  const today=ymd(new Date());let m=o.month||today.slice(0,7);
  const draw=()=>{
    const p=m.split('-').map(Number),lead=new Date(p[0],p[1]-1,1).getDay(),days=new Date(p[0],p[1],0).getDate();
    let cells='';for(let i=0;i<lead;i++)cells+='<span class="cd empty" aria-hidden="true"></span>';
    for(let d=1;d<=days;d++){
      const k=m+'-'+String(d).padStart(2,'0'),wd=(lead+d-1)%7,mk=(o.marks||{})[k],on=o.sel&&o.sel.has(k);
      const dis=(o.min&&k<o.min)||(o.max&&k>o.max)||(o.only&&!mk);
      cells+=`<button type="button" class="cd${wd===0?' sun':wd===6?' sat':''}${on?' on':''}${mk?' '+mk.cls:''}${k===today?' today':''}" data-d="${k}" ${dis?'disabled':''} ${o.sel?`aria-pressed="${on?'true':'false'}"`:''} aria-label="${p[1]}月${d}日（${WD[wd]}）${mk&&mk.txt?' '+esc(mk.txt):''}"><b>${d}</b>${mk&&mk.txt?`<small>${esc(mk.txt)}</small>`:''}</button>`;
    }
    box.innerHTML=`<div class="cal"><div class="cal-h"><button type="button" class="cal-nav" data-nav="-1" aria-label="前の月">‹</button><b>${CAL_IC}${p[0]}年${p[1]}月</b><button type="button" class="cal-nav" data-nav="1" aria-label="次の月">›</button></div>
      <div class="cal-w" aria-hidden="true">${WD.map((w,i)=>`<span class="${i===0?'sun':i===6?'sat':''}">${w}</span>`).join('')}</div><div class="cal-g">${cells}</div></div>`;
  };
  box.addEventListener('click',e=>{
    const n=e.target.closest('[data-nav]');if(n){m=addMonth(m,+n.dataset.nav);draw();return}
    const c=e.target.closest('[data-d]');if(c&&!c.disabled&&o.onTap){o.onTap(c.dataset.d);draw()}
  });
  draw();
  return {redraw:draw,month:()=>m,days:()=>{const p=m.split('-').map(Number),n=new Date(p[0],p[1],0).getDate(),out=[];for(let d=1;d<=n;d++)out.push(m+'-'+String(d).padStart(2,'0'));return out}};
}
/* 応募締切の決め方（gas/Service.gs の DEADLINE_RULES と同じ） */
const DEADLINE_RULES=[['prev18','前日の18時'],['prev12','前日の12時'],['prev2d18','2日前の18時'],['before24h','勤務開始の24時間前'],['before5h','勤務開始の5時間前'],['before3h','勤務開始の3時間前'],['before2h','勤務開始の2時間前']];
function deadlineFor(date,start,rule){
  const x=String(start||'').match(/(\d{1,2}):(\d{2})/);if(!x)return '';
  const s=+x[1]*60+ +x[2],p=date.split('-').map(Number);
  const at=(back,min)=>{const d=new Date(p[0],p[1]-1,p[2]-back);while(min<0){min+=1440;d.setDate(d.getDate()-1)}return (d.getMonth()+1)+'/'+d.getDate()+'('+WD[d.getDay()]+') '+String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0')};
  return {prev18:at(1,1080),prev12:at(1,720),prev2d18:at(2,1080),before24h:at(1,s),before5h:at(0,s-300),before3h:at(0,s-180),before2h:at(0,s-120)}[rule]||'';
}

function statusBadge(s){const c={採用:'ok',就業済み:'ok',不採用:'ng',選考中:'warn',キャンセル:'',欠勤:'ng',中止:'ng',完了:'ok',掲載中:'ac',審査中:'warn',差し戻し:'ng',掲載準備中:'warn',募集終了:'',掲載終了:'',承認済み:'ok'}[s]||'';return `<span class="badge ${c}">${esc(s)}</span>`}
function jobBox(j){return `<div class="box jobbox">${j.thumb?`<img class="jthumb" src="${esc(j.thumb)}" alt="">`:''}<b>${esc(j.dateLabel)} ${esc(j.start)}〜${esc(j.end)}</b>${esc(j.title)}<br>時給 ${yen(j.wage)}${j.fare&&j.fare!=='なし'?'｜交通費 '+esc(j.fare):''}<br><span class="note">${esc(j.clientName)}｜${esc(j.place)}<br>応募締切 ${esc(j.deadline||'—')}｜求人番号 ${esc(j.id)}${j.license==='あり'?'<br>免許・資格が必要なお仕事です':''}</span>${j.belong?`<span class="note" style="display:block;margin-top:6px">持ち物・服装：${esc(j.belong)}</span>`:''}</div>`}

/* 画像をスマホの中で縮小して JPEG（base64）にする（長い辺 1280px まで） */
function loadImg(file){return new Promise((ok,ng)=>{const r=new FileReader();r.onerror=()=>ng(new Error('画像を読み込めませんでした。'));r.onload=()=>{const img=new Image();img.onerror=()=>ng(new Error('この画像は使えません（JPEGかPNGを選んでください）。'));img.onload=()=>ok(img);img.src=r.result};r.readAsDataURL(file)})}
function toJpeg(img,max,limit){const s=Math.min(1,max/Math.max(img.width,img.height));const cv=document.createElement('canvas');cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(img,0,0,cv.width,cv.height);let q=0.8,d=cv.toDataURL('image/jpeg',q);while(d.length>limit&&q>0.3){q-=0.1;d=cv.toDataURL('image/jpeg',q)}return d}
/* 保存用（長い辺1280px）と、求人一覧用の小さい画像（長い辺360px）を作る */
async function shrink(file){const img=await loadImg(file);return {data:toJpeg(img,1280,1.6e6),thumb:toJpeg(img,360,40000)}}

/* 画像の欄（1枚）：選んだら縮小してプレビューを出し、set(縮小した画像の配列) を呼ぶ。
 * 選ぶたびに input を空にするので、何回でも選びなおせる（同じ input のままだと、スマホで2回目の change が来ないことがある）。「外す」で取り消し */
function bindImages(form,set){
  const inp=document.getElementById('images'),box=document.getElementById('thumbs'),pick=document.getElementById('imgPick'),del=document.getElementById('imgDel');
  const show=v=>{set(v);form.dataset.img=v.length?'1':'';box.innerHTML=v.map(s=>`<img src="${s.thumb}" alt="選んだ画像">`).join('');pick.textContent=v.length?'別の画像にえらびなおす':pick.dataset.label;del.hidden=!v.length};
  pick.dataset.label=pick.textContent;
  inp.addEventListener('change',async e=>{
    e.stopPropagation();
    const files=Array.from(inp.files||[]);inp.value='';
    if(!files.length)return;
    busy(true,'画像を準備しています…');
    try{show([await shrink(files[0])])}catch(err){toast(err.message)}finally{busy(false)}
  });
  del.addEventListener('click',()=>show([]));
}

/* ===================== メンバー ===================== */

/* ---------- U-00 マイページ登録 ---------- */
async function u00(){
  const T='マイページ登録';loading(T);
  let d;try{d=await call('getUser')}catch(e){return fail(T,e)}
  const minor=age(d.birth)!=null&&age(d.birth)<18;
  shell(T,`<form id="f">
  ${d.registered?`<div class="okbox">登録済みです（会員ID：${esc(d.memberId)}）。内容を変更できます。</div>`:''}
  <div class="fld"><label for="name">氏名<span class="req">必須</span></label><input id="name" name="name" value="${esc(d.name)}" autocomplete="name" required></div>
  <div class="fld"><label for="kana">ふりがな<span class="req">必須</span></label><input id="kana" name="kana" value="${esc(d.kana)}" required></div>
  <div class="fld"><label for="birth">生年月日<span class="req">必須</span></label><input id="birth" name="birth" type="date" value="${esc(d.birth)}" required></div>
  <div class="guardian" id="guardian" ${minor?'':'hidden'}><p class="note">18歳未満のため、保護者の情報と同意が必要です。</p>
    <div class="fld"><label for="gName">保護者の氏名<span class="req">必須</span></label><input id="gName" name="gName" value="${esc(d.gName)}"></div>
    <div class="fld"><label for="gTel">保護者の連絡先<span class="req">必須</span></label><input id="gTel" name="gTel" type="tel" value="${esc(d.gTel)}"></div>
    <label class="agree"><input type="checkbox" name="gAgree">保護者の同意を得たうえで登録します</label></div>
  <div class="fld"><span class="lbl">性別<span class="req">必須</span></span>${chips('sex',['女性','男性'],[d.sex],'radio')}</div>
  <div class="fld"><label for="addr">住所（市区町村まで）<span class="req">必須</span></label><input id="addr" name="addr" value="${esc(d.addr)}" required></div>
  <div class="fld"><label for="tel">電話番号<span class="req">必須</span></label><input id="tel" name="tel" type="tel" value="${esc(d.tel)}" required></div>
  <div class="fld"><label for="mail">メールアドレス<span class="req">必須</span></label><input id="mail" name="mail" type="email" value="${esc(d.mail)}" required></div>
  <div class="fld"><span class="lbl">活動できる曜日・時間帯<span class="req">必須</span></span>${chips('times',OPT_TIMES,d.times)}</div>
  <div class="fld"><span class="lbl">希望する仕事<span class="req">必須</span></span>${chips('jobs',OPT_JOBS,d.jobs)}</div>
  <div class="fld"><span class="lbl">お持ちの免許・資格（任意・写真は5枚まで）</span>
    ${(d.licenses||[]).length?`<div class="lic-now">${d.licenses.map((n,i)=>`<label class="agree"><input type="checkbox" name="licKeep" value="${i}" checked>${esc(n)}（登録済み。外すと削除）</label>`).join('')}</div>`:''}
    <div id="licNew" class="lic-new"></div>
    <label class="btn-sub filebtn" for="licFile">免許・資格の写真を追加</label><input id="licFile" type="file" accept="image/&#42;" multiple class="sr">
    <p class="note">保育士証・美容師免許などの写真です。運営だけが確認し、お仕事先には免許・資格の名前だけを伝えます。</p></div>
  <div class="fld"><span class="lbl">ZOOMでの説明（約15分）</span>${chips('zoomWish',['希望する','希望しない'],[d.zoomWish||'希望する'],'radio')}</div>
  <p class="note">入力した情報は運営のスプレッドシート（メンバー台帳）に保存されます。お仕事先へは、応募時に年代・性別・住所（市区町村）・ひとことを、採用が決まったときに会員ID・氏名・電話番号・住所・年齢を伝えます。</p>
  <label class="agree"><input type="checkbox" name="agree" required>${link(CFG.termsUrl,'利用規約')}・${link(CFG.privacyUrl,'プライバシーポリシー')}と、採用時に会員ID・氏名・電話番号・住所・年齢をお仕事先へ伝えることに同意します</label>
  <button class="btn-main" type="submit">${d.registered?'登録内容を更新する':'登録する'}</button></form>`);
  const f=document.getElementById('f');let lic=[];
  const drawLic=()=>{document.getElementById('licNew').innerHTML=lic.map((x,i)=>`<div class="lic-row"><img src="${x.thumb}" alt=""><div class="fld"><label for="licName${i}">免許・資格の名前<span class="req">必須</span></label><input id="licName${i}" data-lic="${i}" value="${esc(x.name)}" placeholder="例：保育士" maxlength="30"></div><button type="button" class="btn-sub" data-licdel="${i}">外す</button></div>`).join('')};
  f.addEventListener('input',e=>{if(e.target.dataset.lic!=null)lic[+e.target.dataset.lic].name=e.target.value});
  f.addEventListener('click',e=>{const b=e.target.closest('[data-licdel]');if(b){lic.splice(+b.dataset.licdel,1);drawLic()}});
  document.getElementById('licFile').addEventListener('change',async e=>{
    const files=Array.from(e.target.files||[]);e.target.value='';
    busy(true,'画像を準備しています…');
    try{const v=await Promise.all(files.map(shrink));lic=lic.concat(v.map(x=>({data:x.data,thumb:x.thumb,name:''})));drawLic()}catch(err){toast(err.message)}finally{busy(false)}
  });
  const fb=f.elements.namedItem('birth');fb.addEventListener('change',()=>{const a=age(fb.value);document.getElementById('guardian').hidden=!(a!=null&&a<18)});
  bindSubmit(f,T,async fd=>{
    if(!fd.get('sex'))throw new Error('性別を選んでください。');
    if(!fd.getAll('times').length)throw new Error('活動できる曜日・時間帯を選んでください。');
    if(!fd.getAll('jobs').length)throw new Error('希望する仕事を選んでください。');
    if(lic.some(x=>!String(x.name).trim()))throw new Error('免許・資格の名前を入力してください。');
    if(fd.getAll('licKeep').length+lic.length>5)throw new Error('免許・資格の写真は5枚までです。');
    const p={name:fd.get('name'),kana:fd.get('kana'),birth:fd.get('birth'),sex:fd.get('sex')||'',addr:fd.get('addr'),tel:fd.get('tel'),mail:fd.get('mail'),
      licenses:{keep:fd.getAll('licKeep'),add:lic.map(x=>({name:x.name,data:x.data}))},
      times:fd.getAll('times'),jobs:fd.getAll('jobs'),zoomWish:fd.get('zoomWish'),gName:fd.get('gName'),gTel:fd.get('gTel'),gAgree:fd.has('gAgree'),agree:fd.has('agree')};
    const r=await call('saveUser',p);
    done(T,`<b style="font-size:17px">${r.first?'登録が完了しました':'登録内容を更新しました'}</b><p>会員ID：${esc(r.memberId)}</p>
      <div class="survey"><p>Worklistをご覧いただき、希望するお仕事についてのアンケートにもご協力ください。</p><a class="btn-main linkbtn" href="${esc(SURVEY_URL)}" target="_blank" rel="noopener">アンケートに回答する</a></div>`,true);
  });
}

/* ---------- U-01 求人一覧（リッチメニュー「Wolly spot worklist」）
 * 上にカレンダー（お仕事のある日に件数）。希望の日をタップすると、その日のお仕事だけが出る。
 * 同じ内容で何日もある求人（まとめ依頼）は1枚のカードにまとめ、日にちを選んでエントリーする */
async function u01(){
  const T='求人一覧';loading(T);
  let l,mine=[];try{[l,mine]=await Promise.all([call('jobList'),call('myApps').catch(()=>[])])}catch(e){return fail(T,e)}
  if(!l.length)return shell(T,'<p class="note">いま募集中のお仕事はありません。新着はLINEでお知らせします。</p>');
  /* 自分が応募している求人（選考中・採用・就業済み）。カレンダーとカードに「応募済」を出す */
  const myJob={};(mine||[]).forEach(a=>{if(['選考中','採用','就業済み'].indexOf(a.status)>=0)myJob[a.jobId]=a});
  const groups=[],at={};
  l.forEach(j=>{const k=j.groupId||j.id;if(!(k in at)){at[k]=groups.length;groups.push({key:k,jobs:[]})}groups[at[k]].jobs.push(j)});
  const marks={};l.forEach(j=>{const m=marks[j.date]||(marks[j.date]={cls:'has',n:0});m.n++;m.txt=m.n+'件'});
  Object.keys(myJob).forEach(id=>{const a=myJob[id];if(!a.date)return;const m=marks[a.date]||(marks[a.date]={cls:'has',n:0});m.cls='has mine';m.txt=a.status==='選考中'?'応募済':a.status==='採用'?'採用':'済'});
  const pick=new Set(),focus=C.q.get('group')||'';
  shell(T,`<section class="card calcard"><h2 class="sec">${CAL_IC}お仕事のある日</h2>
    <p class="note">数字の下の「○件」がお仕事のある日です。希望の日をタップすると、その日のお仕事だけが出ます（いくつでも選べます）。</p>
    <div id="cal"></div>${Object.keys(myJob).length?'<p class="legend"><span class="lg has">○件＝お仕事のある日</span><span class="lg mine">✓ 応募済・採用＝あなたが応募した日</span></p>':''}<p class="datesum" id="pickSum" aria-live="polite"></p></section><div id="list"></div>`);
  const card=g=>{
    const j=g.jobs[0],many=g.jobs.length>1;
    const days=many?`<div class="fld"><span class="lbl">${CAL_IC}エントリーする日（いくつでも）</span><div class="chips daychips">${g.jobs.map(x=>`${myJob[x.id]?`<label class="applied"><input type="checkbox" disabled>${esc(mdw(x.date))} 応募済</label>`:`<label><input type="checkbox" name="d-${esc(g.key)}" value="${esc(x.id)}" ${pick.has(x.date)||(!pick.size&&focus===g.key)?'checked':''}>${esc(mdw(x.date))}</label>`}`).join('')}</div></div>`:'';
    return `<article class="card jobcard" id="g-${esc(g.key)}">${j.thumb?`<img class="jthumb" src="${esc(j.thumb)}" alt="">`:''}
    <b class="jdate">${esc(many?datesText(g.jobs.map(x=>x.date)):j.dateLabel)} ${esc(j.start)}〜${esc(j.end)}</b>
    <h2 class="jtitle">${esc(j.title)}</h2>
    ${(()=>{const n=g.jobs.filter(x=>myJob[x.id]).length;return n?`<p class="mybadge">✓ ${many?n+'日分 応募済':'応募済み（'+esc(myJob[j.id].status)+'）'}</p>`:''})()}
    <p class="note">${esc(j.clientName)}｜${esc(j.place)}</p>
    <p class="jpay">時給 ${yen(j.wage)}${j.fare&&j.fare!=='なし'?`<span class="note">交通費 ${esc(j.fare)}</span>`:''}</p>
    <p class="note">募集 ${esc(j.need)}名${many?'（各日）':''}｜応募締切 ${many?'日ごと（はじめの日は '+esc(j.deadline)+'）':esc(j.deadline)}${j.cond==='18歳以上'||j.night?'｜18歳以上':''}${j.license==='あり'?'｜免許・資格が必要':''}</p>
    ${j.belong?`<p class="note">持ち物・服装：${esc(j.belong)}</p>`:''}
    ${days}
    ${many?(g.jobs.every(x=>myJob[x.id])?'<p class="note">すべての日に応募済みです。</p>':`<button class="btn-main" type="button" data-entry="${esc(g.key)}">選んだ日でエントリーする</button>`):myJob[j.id]?`<a class="btn-sub linkbtn" href="${esc(url('u05'))}">応募状況を見る</a>`:`<a class="btn-main linkbtn" href="${esc(url('u03',{job:j.id}))}">エントリーする</a>`}</article>`;
  };
  const drawList=()=>{
    const show=pick.size?groups.filter(g=>g.jobs.some(x=>pick.has(x.date))):groups;
    const ks=Array.from(pick).sort();
    document.getElementById('pickSum').innerHTML=ks.length?`<b>選んだ日：${esc(ks.map(mdw).join('、'))}</b><button type="button" class="linkish" data-clear="1">すべての日を見る</button>`:'';
    document.getElementById('list').innerHTML=show.map(card).join('')||'<p class="note">選んだ日のお仕事はありません。</p>';
  };
  const first=focus&&groups[at[focus]]?groups[at[focus]].jobs[0].date:l[0].date;
  const cal=calendar(document.getElementById('cal'),{month:first.slice(0,7),marks,sel:pick,only:true,onTap:k=>{if(pick.has(k))pick.delete(k);else pick.add(k);drawList()}});
  app.addEventListener('click',e=>{
    if(e.target.closest('[data-clear]')){pick.clear();cal.redraw();drawList();return}
    const b=e.target.closest('[data-entry]');if(!b)return;
    const ids=Array.from(app.querySelectorAll(`input[name="d-${b.dataset.entry}"]:checked`)).map(x=>x.value);
    if(!ids.length){toast('エントリーする日にちを選んでください');return}
    go(url('u03',{jobs:ids.join(',')}));
  });
  drawList();
  if(focus&&document.getElementById('g-'+focus))document.getElementById('g-'+focus).scrollIntoView({block:'start'});
}

/* ---------- U-03 応募確認（?job=1件、または ?jobs=いくつかの日をまとめて） ---------- */
async function u03(){
  const T='応募確認';loading(T);
  const ids=(C.q.get('jobs')||C.q.get('job')||'').split(',').filter(Boolean);
  let d;try{d=await call('getJobs',{jobIds:ids})}catch(e){return fail(T,e)}
  const items=d.items,j=items[0].job,many=items.length>1;
  if(!many&&items[0].closed)return fail(T,new Error(items[0].closed));
  const head=many?`<div class="box jobbox">${j.thumb?`<img class="jthumb" src="${esc(j.thumb)}" alt="">`:''}<b>${esc(j.title)}</b>${esc(j.start)}〜${esc(j.end)}（休憩${esc(j.rest)}分）<br>時給 ${yen(j.wage)}${j.fare&&j.fare!=='なし'?'｜交通費 '+esc(j.fare):''}<br><span class="note">${esc(j.clientName)}｜${esc(j.place)}${j.license==='あり'?'<br>免許・資格が必要なお仕事です':''}</span>${j.belong?`<span class="note" style="display:block;margin-top:6px">持ち物・服装：${esc(j.belong)}</span>`:''}</div>`:jobBox(j);
  if(!d.registered){return shell(T,`${head}<div class="warnbox">応募の前に、マイページ登録をお願いします（1回だけ）。</div><a class="btn-sub" href="${esc(url('u00'))}">マイページ登録へ</a>`)}
  const why=it=>it.closed||(it.check&&!it.check.ok?it.check.msg:'')||(it.dup?'応募済みです':'');
  const okN=items.filter(it=>!why(it)).length;
  const dayList=many?`<div class="fld"><span class="lbl">${CAL_IC}応募する日<span class="req">必須</span></span><div class="daylist">${items.map(it=>{const w=why(it);return `<label class="dayrow${w?' off':''}"><input type="checkbox" name="job" value="${esc(it.id)}" ${w?'disabled':'checked'}><b>${esc(it.job.dateLabel)}</b><small>${w?`<span class="ng-t">${esc(w)}</span>`:'締切 '+esc(it.job.deadline)}</small></label>`}).join('')}</div><p class="note">行けない日はチェックを外してください。採否は日ごとにお知らせします。</p></div>`
    :`<div class="${items[0].check.ok?'okbox':'ngbox'}">${esc(items[0].check.msg)}</div>${items[0].dup?'<div class="warnbox">この求人にはすでに応募済みです。</div>':''}`;
  shell(T,`<form id="f">${head}
  ${j.night?'<p class="note">22時〜翌5時を含むお仕事です（18歳未満の方は応募できません）。</p>':''}
  <div class="fld"><span class="lbl">応募者（登録情報）</span><div class="box">氏名：${esc(d.user.name)}<br>住所：${esc(d.user.addr)}<br>電話：登録済み</div><a href="${esc(url('u00'))}" class="note">登録内容を変更する</a></div>
  ${dayList}
  <div class="fld"><label for="comment">お仕事先へのひとこと（任意）</label><textarea id="comment" name="comment" maxlength="200" placeholder="例：飲食店でのアルバイト経験があります"></textarea></div>
  <p class="note">応募の時点でお仕事先に伝わるのは、年代・性別・住所（市区町村）・ひとことです。会員ID・氏名・電話番号・住所・年齢は、採用が決まったときに伝わります。メールアドレスは伝わりません。給与は勤務日の翌月5日にWollyからお支払いします。</p>
  <label class="agree"><input type="checkbox" name="agree" required>採用時に会員ID・氏名・電話番号・住所・年齢をお仕事先へ伝えることに同意します</label>
  <button class="btn-main" type="submit" ${okN?'':'disabled'}>${many?'選んだ日でエントリーする':'エントリーする'}</button></form>`);
  bindSubmit(document.getElementById('f'),T,async fd=>{
    const pick=many?fd.getAll('job'):[items[0].id];
    if(!pick.length)throw new Error('応募する日を選んでください。');
    const r=await call('applyMany',{jobIds:pick,comment:fd.get('comment')});
    const js=r.apps.map(x=>x.job);
    done('応募完了',`<b style="font-size:17px">応募を受け付けました${js.length>1?'（'+js.length+'日）':''}</b><p class="note">結果はLINEでお知らせします。</p><div class="box" style="text-align:left">${esc(js[0].title)}<br>${esc(js[0].clientName)}｜${esc(js[0].place)}<br>${js.map(x=>`${esc(x.dateLabel)} ${esc(x.start)}〜${esc(x.end)}（求人番号 ${esc(x.id)}）`).join('<br>')}</div>${r.skipped.length?`<div class="warnbox" style="text-align:left">応募できなかった日：<br>${r.skipped.map(x=>esc(x.msg)).join('<br>')}</div>`:''}<p><a class="btn-sub" href="${esc(url('u05'))}">応募状況・出退勤を見る</a></p>`);
  });
}

/* ---------- U-05 応募状況・出退勤（U-06 も同じ画面）
 * 上に今日のお仕事と大きな出退勤ボタン、まんなかに予定のカレンダー（勤務・選考中・出退勤の記録）、下に応募の一覧 ---------- */
const CAL_STATE={採用:['work','勤務'],就業済み:['done','済'],選考中:['wait','選考中']};
async function u05(){
  const T='応募状況・出退勤';loading(T);
  let l,shifts;try{[l,shifts]=await Promise.all([call('myApps'),call('myShifts')])}catch(e){return fail(T,e)}
  const hm=v=>String(v||'').slice(-5);
  const today=shifts.length?'<h2 class="sec">今日のお仕事</h2>'+shifts.map(a=>`<section class="card shift"><b class="jdate">${esc(a.dateLabel)} ${esc(a.start)}〜${esc(a.end)}</b><h3 class="jtitle">${esc(a.title)}</h3><p class="note">${esc(a.clientName)}｜${esc(a.place||'')}</p>
    <div class="punch"><div><span>出勤</span><b>${a.checkin?esc(hm(a.checkin)):'—'}</b></div><div><span>退勤</span><b>${a.checkout?esc(hm(a.checkout)):'—'}</b></div></div>
    <button class="punch-btn in" type="button" data-app="${esc(a.id)}" data-kind="in" ${a.checkin?'disabled':''}><span class="pb-en">CHECK-IN</span>チェックイン（出勤）</button>
    <button class="punch-btn out" type="button" data-app="${esc(a.id)}" data-kind="out" ${!a.checkin||a.checkout?'disabled':''}><span class="pb-en">CHECK-OUT</span>チェックアウト（退勤）</button>
    ${a.checkout?'<p class="okbox">今日の記録は完了しています。お疲れさまでした。</p>':a.checkin?'<p class="note">お仕事が終わったら、チェックアウトを押してください。</p>':'<p class="note">お仕事を始めるときに、チェックインを押してください。</p>'}</section>`).join('')
    :'<div class="box today-none">今日の勤務予定はありません。<span class="note">採用が決まったお仕事の当日に、ここに出勤・退勤のボタンが出ます。</span></div>';
  /* 予定のカレンダー：採用＝勤務、出退勤を記録した日＝済（出勤だけなら出勤中）、選考中 */
  const marks={},rank={in:4,work:3,done:2,wait:1};   // 同じ日に何件かあれば、まだ終わっていないほうを出す
  l.forEach(a=>{
    if(!a.date)return;
    let st=CAL_STATE[a.status];if(!st)return;
    if(a.checkout)st=['done','済'];else if(a.checkin)st=['in','出勤中'];
    const m=marks[a.date];if(!m||rank[st[0]]>rank[m.cls])marks[a.date]={cls:st[0],txt:st[1]};
  });
  const ks=Object.keys(marks).sort(),now=ymd(new Date());
  const firstM=(ks.find(k=>k>=now)||ks[ks.length-1]||now).slice(0,7);
  const row=a=>`<div class="row"><div><b>${esc(a.dateLabel)} ${esc(a.title)}</b><small>${esc(a.clientName)}｜${esc(a.place)}<br>${esc(a.start||'')}${a.start?'〜':''}${esc(a.end||'')}｜${esc(a.jobId)}${a.checkin?'｜出勤 '+esc(hm(a.checkin)):''}${a.checkout?'｜退勤 '+esc(hm(a.checkout)):''}</small></div>${statusBadge(a.status)}</div>`;
  const list=l.length?l.map(row).join(''):'<p class="note">まだ応募はありません。</p>';
  shell(T,today+`<section class="card calcard"><h2 class="sec">${CAL_IC}わたしの予定</h2><div id="cal"></div>
    <p class="legend"><span class="lg work">勤務</span><span class="lg in">出勤中</span><span class="lg done">済（出退勤の記録あり）</span><span class="lg wait">選考中</span></p>
    <div id="dayInfo" aria-live="polite"><p class="note">日にちをタップすると、その日のお仕事と出退勤の時刻が出ます。</p></div></section>`
    +'<h2 class="sec">応募したお仕事</h2>'+list+'<p class="note">押した時刻がそのまま記録されます。押し忘れ・遅刻・キャンセル・欠勤は、Wollyのトークで連絡してください。</p>');
  const sel=new Set();
  calendar(document.getElementById('cal'),{month:firstM,marks,sel,only:true,onTap:k=>{sel.clear();sel.add(k);
    const xs=l.filter(a=>a.date===k&&CAL_STATE[a.status]);
    document.getElementById('dayInfo').innerHTML=`<h3 class="sub">${esc(mdw(k))}のお仕事</h3>`+xs.map(row).join('')+(k===now&&shifts.length?'<p class="note">出勤・退勤は、いちばん上のボタンで記録します。</p>':'');
  }});
  app.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',async()=>{
    if(b.dataset.kind==='out'&&!confirm('チェックアウト（退勤）を記録しますか？'))return;
    b.disabled=true;busy(true,'記録しています…');
    try{const r=await call('checkin',{appId:b.dataset.app});toast(r.message);await u05()}catch(e){toast(e.message);b.disabled=false}finally{busy(false)}}));
}

/* ===================== パートナー ===================== */

const TYPE_NAME={job:'求人',ad:'広告'};

/* 依頼の画面を、登録前・承認前に開いたときの案内（未登録なら登録へのボタン、承認待ちなら今の状態） */
function notReady(d,what,type){
  if(!d.registered)return `<div class="warnbox"><b>${what}には、パートナー登録が必要です</b>はじめに会社・お店の情報を登録してください（約3分）。運営が確認して承認すると、ご依頼いただけるようになります。</div>
    <a class="btn-main linkbtn" href="${esc(url('c01',type?{type}:{}))}">パートナー登録へ進む</a>`;
  return `<div class="warnbox"><b>ただいま登録内容を確認しています（状態：${esc(d.status)}）</b>${d.zoomWish==='希望する'?'ZOOM面談のあと、':''}運営が承認すると、メニューが切り替わり、ご依頼いただけるようになります。承認のお知らせはこのトークに届きます。</div>
    <a class="btn-sub" href="${esc(url('c01'))}">登録内容を見る</a>`;
}

/* ---------- C-01 パートナー登録（求人／広告を選んでから入力） ---------- */
async function c01(){
  const T='パートナー登録';loading(T);
  let d;try{d=await call('getClient')}catch(e){return fail(T,e)}
  const type=TYPE_NAME[C.q.get('type')]||'';
  const has=t=>d.registered&&d.types.indexOf(t)>=0;
  if(!type||has(type)){
    if(!d.registered)return shell(T,`<p class="note">ご利用の目的を選んでください。あとからもう一方を追加することもできます。</p>
      <a class="choice" href="${esc(url('c01',{type:'job'}))}"><b>求人で登録</b><span>お仕事の募集を依頼する</span></a>
      <a class="choice" href="${esc(url('c01',{type:'ad'}))}"><b>広告で登録</b><span>街ナビ・クーポンにお店やイベントを載せる</span></a>`);
    const other=['求人','広告'].filter(t=>!has(t));
    return shell(T,`<div class="okbox">パートナー登録済みです（${esc(d.types.join('・'))}／状態：${esc(d.status)}）。</div><div class="box"><b>${esc(d.name)}</b>${esc(d.person)}｜${esc(d.contact)}<br>${esc(d.addr)}</div>
      ${d.status==='承認済み'?'<p class="note">メニューの「依頼する」からご依頼いただけます。</p>':`<p class="note">${d.zoomWish==='希望する'?'ZOOM面談のあと、':''}運営が承認するとメニューが切り替わります。</p>`}
      ${other.map(t=>`<a class="choice" href="${esc(url('c01',{type:t==='求人'?'job':'ad'}))}"><b>${t}でも利用する</b><span>${t==='求人'?'お仕事の募集を依頼する':'街ナビ・クーポンにお店やイベントを載せる'}</span></a>`).join('')}`);
  }
  const ad=type==='広告';
  const adFields=`<div class="fld"><label for="industry">業種（例：美容室・飲食店・学習塾）<span class="req">必須</span></label><input id="industry" name="industry" value="${esc(d.industry||'')}" required></div>
  <div class="fld"><label for="url">お店のURL・SNS（任意）</label><input id="url" name="url" type="url" value="${esc(d.url||'')}" placeholder="https://"></div>`;
  const agree=`<label class="agree"><input type="checkbox" name="agree" required>${link(CFG.termsUrl,'利用規約')}に同意します</label>`;
  if(d.registered){
    shell(T,`<form id="f"><div class="box"><b>${esc(d.name)}</b>${esc(d.person)}｜${esc(d.addr)}</div><p class="note">${type}でのご利用を追加します。</p>${ad?adFields:''}${agree}<button class="btn-main" type="submit">${type}でのご利用を追加する</button></form>`);
  }else{
    shell(T+'（'+type+'）',`<form id="f">
    <div class="fld"><label for="name">会社名・店舗名<span class="req">必須</span></label><input id="name" name="name" required></div>
    <div class="fld"><label for="person">担当者名<span class="req">必須</span></label><input id="person" name="person" required></div>
    <div class="fld"><label for="contact">連絡先（メールまたは電話）<span class="req">必須</span></label><input id="contact" name="contact" required></div>
    <div class="fld"><label for="addr">所在地<span class="req">必須</span></label><input id="addr" name="addr" required></div>
    ${ad?adFields:''}
    <div class="fld"><span class="lbl">ご希望の時期</span>${chips('when',['いつでも大丈夫（すぐにでも）','少し先で調整したい'],['いつでも大丈夫（すぐにでも）'],'radio')}</div>
    <div class="fld"><span class="lbl">ZOOMでの面談</span>${chips('zoomWish',['希望する','希望しない'],['希望する'],'radio')}<p class="note">${ad?'掲載内容やお店の雰囲気':'業務内容や現場の雰囲気'}を、事前にオンラインでうかがいます。</p></div>
    <div class="fld"><label for="note">特記事項（任意）</label><textarea id="note" name="note"></textarea></div>
    ${agree}<button class="btn-main" type="submit">登録を申請する</button></form>`);
  }
  bindSubmit(document.getElementById('f'),T,async fd=>{
    const p={type};['name','person','contact','addr','industry','url','when','zoomWish','note'].forEach(k=>p[k]=fd.get(k));p.agree=fd.has('agree');
    const r=await call('saveClient',p);
    done(T,r.added?`<b style="font-size:17px">${type}でのご利用を追加しました</b>`:`<b style="font-size:17px">登録を申請しました</b><p class="note">${p.zoomWish==='希望する'?'担当者からZOOM面談の日程をご連絡します。':'内容を確認のうえ、承認のご連絡をします。'}</p>`);
  });
}

/* ---------- C-02 依頼する（求人／広告を選ぶ）→ 求人依頼フォーム ---------- */
async function c02(){
  const T='求人依頼';loading(T);
  let d;try{d=await call('getClient')}catch(e){return fail(T,e)}
  if(!d.registered||d.status!=='承認済み')return shell('依頼する',notReady(d,'ご依頼'));
  const job=d.types.indexOf('求人')>=0,ad=d.types.indexOf('広告')>=0;
  if(!job)return c07();
  if(ad&&C.q.get('type')!=='job')return shell('依頼する',`<p class="note">依頼の種類を選んでください。</p>
    <a class="choice" href="${esc(url('c02',{type:'job'}))}"><b>求人を依頼</b><span>お仕事の募集</span></a>
    <a class="choice" href="${esc(url('c07'))}"><b>広告を依頼</b><span>街ナビ・クーポンへの掲載</span></a>`);
  const editId=C.q.get('edit');let j={};
  if(editId){try{j=await call('myJob',{jobId:editId})}catch(e){return fail(T,e)}}
  const tm=new Date();tm.setDate(tm.getDate()+1);
  const fareOn=j.fare&&j.fare!=='なし',fareNum=(String(j.fare||'').match(/([\d,]+)円/)||[])[1];
  shell(editId?'求人依頼の修正':T,`<form id="f">
  ${editId?`<div class="warnbox"><b>運営からの確認事項</b>${esc(j.reason)}</div>`:''}
  <div class="fld"><label for="title">職種・仕事内容<span class="req">必須</span></label><input id="title" name="title" value="${esc(j.title)}" required></div>
  ${editId?`<div class="fld"><label for="date">勤務日<span class="req">必須</span></label><input id="date" name="date" type="date" min="${ymd(tm)}" value="${esc(j.date)}" required></div>`
  :`<div class="fld" id="datesFld"><span class="lbl">勤務日（いくつでも選べます）<span class="req">必須</span></span>
    <p class="note">カレンダーの日にちをタップして選びます。もう一度タップすると外れます。</p>
    <div id="cal"></div>
    <div class="calquick"><button type="button" class="btn-sub" data-q="wd">この月の平日をぜんぶ</button><button type="button" class="btn-sub" data-q="we">この月の土日をぜんぶ</button><button type="button" class="btn-sub" data-q="clr">選んだ日を外す</button></div>
    <p class="datesum" id="datesSum" aria-live="polite"></p></div>`}
  <div class="grid3"><div class="fld"><label for="start">開始<span class="req">必須</span></label><input id="start" name="start" type="time" value="${esc(j.start||'10:00')}" required></div>
  <div class="fld"><label for="end">終了<span class="req">必須</span></label><input id="end" name="end" type="time" value="${esc(j.end||'15:00')}" required></div>
  <div class="fld"><label for="rest">休憩（分）<span class="req">必須</span></label><input id="rest" name="rest" type="number" inputmode="numeric" min="0" step="1" value="${esc(j.rest!=null?j.rest:60)}" required></div></div>
  <p class="note">休憩がない場合は 0 を入れてください。</p>
  <p class="note" id="night" hidden>22時〜翌5時を含むため、18歳未満の方は応募できなくなります。</p>
  <div class="fld"><label for="wage">時給（円）<span class="req">必須</span></label><input id="wage" name="wage" type="number" inputmode="numeric" min="${esc(d.minWage||1)}" value="${esc(j.wage||d.minWage||'')}" data-minmsg="時給は最低賃金（${esc(Number(d.minWage||0).toLocaleString('ja-JP'))}円）以上にしてください。" required><p class="note">最低賃金（${esc(Number(d.minWage||0).toLocaleString('ja-JP'))}円）以上で入力します。</p></div>
  <div class="fld"><label for="need">募集人数（1日あたり）<span class="req">必須</span></label><input id="need" name="need" type="number" inputmode="numeric" min="1" value="${esc(j.need)}" required><p class="note">${editId?'この日に来てほしい人数を入れてください。':'1日に来てほしい人数を入れてください。何日か選んだときも、各日の人数です（合計ではありません）。'}</p></div>
  ${editId?`<div class="fld"><label for="deadline">応募締切<span class="req">必須</span></label><input id="deadline" name="deadline" type="datetime-local" value="${esc(toLocal(j.deadline))}" required><p class="note">勤務開始の2時間前までの日時にしてください。</p></div>`
  :`<div class="fld"><label for="deadlineRule">応募締切（日ごとに自動で決まります）<span class="req">必須</span></label><select id="deadlineRule" name="deadlineRule">${DEADLINE_RULES.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><p class="note" id="dlEx">勤務開始の2時間前より前にしてください。</p></div>`}
  <div class="fld"><label for="place">勤務地（空欄なら所在地）</label><input id="place" name="place" value="${esc(j.place)}" placeholder="${esc(d.addr)}"></div>
  <div class="fld"><span class="lbl">応募条件</span>${chips('cond',['条件なし','18歳以上'],[j.cond||'条件なし'],'radio')}</div>
  <div class="fld"><span class="lbl">免許・資格が必要なお仕事<span class="req">必須</span></span>${chips('license',['なし','あり'],[j.license||'なし'],'radio')}<p class="note">例：保育士・美容師・調理師など。「あり」の求人は手数料が25%、「なし」は15%です。</p></div>
  <div class="fld"><span class="lbl">交通費</span>${chips('fareKind',['なし','あり'],[fareOn?'あり':'なし'],'radio')}<div id="fareBox" ${fareOn?'':'hidden'}><label class="sr" for="fareAmount">交通費の上限（円）</label><input id="fareAmount" name="fareAmount" type="number" min="0" placeholder="上限の金額（円）" value="${esc(fareNum?fareNum.replace(/,/g,''):'')}"></div></div>
  <div class="fld"><label for="belong">持ち物・服装・注意事項</label><textarea id="belong" name="belong">${esc(j.belong)}</textarea></div>
  <div class="fld"><span class="lbl">画像（1枚・任意）</span>
    <p class="note">${editId&&j.imageCount?`画像が付いています。えらびなおすと置き換わります。`:'職場の写真など。求人一覧で、求人の右上に表示されます。自動で小さくしてから送ります。'}</p>
    <div class="thumbs" id="thumbs"></div>
    <div class="imgbtns"><label class="btn-sub filebtn" for="images" id="imgPick">画像をえらぶ</label><button type="button" class="btn-sub" id="imgDel" hidden>外す</button></div>
    <input id="images" type="file" accept="image/&#42;" class="sr"></div>
  <div class="fld"><label for="remarks">備考（任意）</label><textarea id="remarks" name="remarks">${esc(j.remarks)}</textarea></div>
  <button class="btn-main" type="submit">内容を確認する</button></form>`);
  const f=document.getElementById('f');let imgs=[];
  bindImages(f,v=>{imgs=v});
  /* 勤務日のカレンダー（新しい依頼のとき） */
  const sel=new Set(),MAXD=31,minD=ymd(tm);
  const sumUp=()=>{
    const ks=Array.from(sel).sort(),s=document.getElementById('datesSum'),ex=document.getElementById('dlEx');if(!s)return;
    s.innerHTML=ks.length?`<b>${CAL_IC}選んだ日：${ks.length}日</b><span>${esc(ks.map(mdw).join('、'))}</span>`:'<span class="note">まだ選んでいません。</span>';
    const r=f.elements.namedItem('deadlineRule').value,st=f.elements.namedItem('start').value;
    ex.textContent=ks.length?`例：${mdw(ks[0])}の締切は ${deadlineFor(ks[0],st,r)}（日ごとに同じ決め方です）`:'勤務日を選ぶと、締切の例が出ます。';
  };
  let cal=null;
  if(!editId){
    cal=calendar(document.getElementById('cal'),{month:minD.slice(0,7),sel,min:minD,onTap:k=>{if(sel.has(k))sel.delete(k);else if(sel.size>=MAXD)toast('勤務日は1回の依頼で'+MAXD+'日までです');else sel.add(k);sumUp();const b=document.getElementById('datesFld');b.classList.remove('err');const m=b.querySelector('.errmsg');if(m)m.remove()}});
    f.addEventListener('click',e=>{const q=e.target.closest('[data-q]');if(!q)return;
      if(q.dataset.q==='clr')sel.clear();
      else cal.days().forEach(k=>{if(k<minD||sel.size>=MAXD)return;const w=new Date(k.split('-')[0],k.split('-')[1]-1,k.split('-')[2]).getDay(),we=w===0||w===6;if((q.dataset.q==='we')===we)sel.add(k)});
      cal.redraw();sumUp()});
    f.addEventListener('change',e=>{if(e.target.name==='deadlineRule'||e.target.name==='start')sumUp()});
    sumUp();
  }
  const nightChk=()=>{document.getElementById('night').hidden=!isNight(f.elements.namedItem('start').value,f.elements.namedItem('end').value)};
  f.elements.namedItem('start').addEventListener('change',nightChk);f.elements.namedItem('end').addEventListener('change',nightChk);nightChk();
  f.addEventListener('change',e=>{if(e.target.name==='fareKind')document.getElementById('fareBox').hidden=e.target.value!=='あり'});
  bindSubmit(f,T,async fd=>{
    const p={jobId:editId||''};['title','start','end','rest','wage','need','place','cond','license','fareKind','fareAmount','belong','remarks'].forEach(k=>p[k]=fd.get(k));
    if(editId){p.date=fd.get('date');p.deadline=fd.get('deadline')}
    else{if(!sel.size)throw new Error('勤務日を選んでください（カレンダーの日にちをタップ）。');p.dates=Array.from(sel).sort();p.deadlineRule=fd.get('deadlineRule')}
    p.images=imgs;
    if(!await confirmJob(f,p,{editId,j,d,imgs}))return;
    let r;try{r=await call('requestJob',p)}catch(err){backToForm(f);throw err}
    const ids=r.ids||[r.id];
    done(T,`<b style="font-size:17px">${editId?'修正した依頼を送信しました':'依頼を送信しました'}</b><p>求人番号 ${esc(ids.length>1?ids[0]+'〜'+ids[ids.length-1]+'（'+ids.length+'日分）':ids[0])}</p>${ids.length>1?`<p class="note">${esc(datesText(p.dates))}</p>`:''}<p class="note">内容を確認のうえ、掲載のご連絡をします。</p><p><a class="btn-sub" href="${esc(url('c03'))}">依頼状況を見る</a></p>`);
  });
}

/* 求人依頼の確認画面：入力した内容を見せて「この内容で送る」→ true、「もどって直す」→ false（入力画面にもどる） */
function backToForm(f){const c=document.getElementById('cfm');if(c)c.remove();f.hidden=false}
function confirmJob(f,p,o){
  return new Promise(ok=>{
    busy(false);
    const row=(k,v)=>v?`<div class="cfm-row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`:'';
    const many=!o.editId&&p.dates.length>1;
    const dl=DEADLINE_RULES.find(x=>x[0]===p.deadlineRule);
    const img=o.imgs.length?`<img class="cfm-img" src="${o.imgs[0].thumb}" alt="えらんだ画像">`:esc(o.editId&&o.j.imageCount?'今の画像のまま':'なし');
    const box=document.createElement('div');box.id='cfm';box.className='cfm';
    box.innerHTML=`<p class="warnbox"><b>まだ送っていません。</b>内容を確かめて、下の「この内容で送る」を押してください。</p>
    <dl class="cfm-list">
    ${row('職種・仕事内容',esc(p.title))}
    ${row('勤務日',o.editId?esc(mdw(p.date)):`${CAL_IC}<b>${p.dates.length}日</b><br>${esc(p.dates.map(mdw).join('、'))}`)}
    ${row('時間',esc(p.start+'〜'+p.end+'（休憩'+p.rest+'分）'))}
    ${row('時給',esc(yen(p.wage)))}
    ${row('募集人数',`<b>${many?'各日 ':''}${esc(p.need)}名</b>`+(many?`<br><span class="note">${p.dates.length}日で のべ${esc(String(p.need*p.dates.length))}名</span>`:''))}
    ${row('応募締切',esc(o.editId?String(p.deadline).replace('T',' '):(dl?dl[1]:'')+(p.dates.length?'（例：'+mdw(p.dates[0])+'は '+deadlineFor(p.dates[0],p.start,p.deadlineRule)+'）':'')))}
    ${row('勤務地',esc(p.place||o.d.addr||''))}
    ${row('応募条件',esc(p.cond))}
    ${row('免許・資格',esc(p.license==='あり'?'必要（手数料25%）':'いらない（手数料15%）'))}
    ${row('交通費',esc(p.fareKind==='あり'?(p.fareAmount?'あり（上限'+yen(p.fareAmount)+'）':'あり'):'なし'))}
    ${row('持ち物・服装',esc(p.belong))}
    ${row('画像',img)}
    ${row('備考',esc(p.remarks))}
    </dl>
    <button type="button" class="btn-main" data-cfm="send">${o.editId?'この内容で再送信する':'この内容で送る'}</button>
    <button type="button" class="btn-sub" data-cfm="back">もどって直す</button>`;
    f.before(box);f.hidden=true;window.scrollTo(0,0);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-cfm]');if(!b)return;
      if(b.dataset.cfm==='back'){backToForm(f);const sb=f.querySelector('[type=submit]');sb.disabled=false;sb.textContent='内容を確認する';ok(false)}
      else{box.querySelectorAll('button').forEach(x=>x.disabled=true);b.textContent='送信中…';busy(true,o.imgs.length?'画像と一緒に送信しています…':'送信しています…');ok(true)}});
  });
}

/* ---------- C-07 広告依頼（掲載先：街ナビ・クーポン） ---------- */
async function c07(){
  const T='広告依頼';loading(T);
  let d;try{d=await call('getClient')}catch(e){return fail(T,e)}
  if(!d.registered||d.status!=='承認済み')return shell(T,notReady(d,'広告のご依頼','ad'));
  if(d.types.indexOf('広告')<0)return shell(T,`<div class="warnbox">広告のご依頼は、広告でのご利用を追加するとお使いいただけます。</div><a class="btn-main linkbtn" href="${esc(url('c01',{type:'ad'}))}">広告でも利用する</a>`);
  const editId=C.q.get('edit');let a={};
  if(editId){try{a=await call('myAd',{adId:editId})}catch(e){return fail(T,e)}}
  const today=ymd(new Date()),kind=a.adType||AD_TYPES[0];
  shell(editId?'広告依頼の修正':T,`<form id="f">
  ${editId?`<div class="warnbox"><b>運営からの確認事項</b>${esc(a.reason)}</div>`:''}
  <p class="note">メンバー向けの「街ナビ・クーポン」ページに掲載します。運営が内容を確認してからの掲載です。</p>
  <div class="fld"><span class="lbl">掲載の種類<span class="req">必須</span></span>${chips('adType',AD_TYPES,[kind],'radio')}</div>
  <div class="fld"><span class="lbl">カテゴリ<span class="req">必須</span></span>${chips('category',AD_CATEGORIES,[a.category||''],'radio')}</div>
  <div class="fld"><label for="title">掲載タイトル（30字まで）<span class="req">必須</span></label><input id="title" name="title" maxlength="30" value="${esc(a.title)}" required></div>
  <div class="fld"><label for="body">紹介文（400字まで）<span class="req">必須</span></label><textarea id="body" name="body" maxlength="400" required>${esc(a.body)}</textarea></div>
  <div class="fld"><label for="addr">店舗の住所</label><input id="addr" name="addr" value="${esc(a.addr||d.addr)}"></div>
  <div class="fld"><label for="hours">営業時間・定休日（任意）</label><input id="hours" name="hours" value="${esc(a.hours)}"></div>
  <div class="fld"><label for="contact">掲載する連絡先（任意）</label><input id="contact" name="contact" value="${esc(a.contact)}" placeholder="電話番号・URL・Instagramなど（メンバーに見えます）"></div>
  <div class="sub-box" id="couponBox" ${kind==='クーポン'?'':'hidden'}>
    <div class="fld"><label for="coupon">クーポンの内容<span class="req">必須</span></label><input id="coupon" name="coupon" value="${esc(a.coupon)}" placeholder="例：初回カット20％オフ"></div>
    <div class="fld"><label for="couponTerms">利用条件（任意）</label><input id="couponTerms" name="couponTerms" value="${esc(a.couponTerms)}" placeholder="例：「Wollyを見た」とお伝えください"></div>
    <div class="fld"><label for="couponUntil">有効期限<span class="req">必須</span></label><input id="couponUntil" name="couponUntil" type="date" min="${today}" value="${esc(a.couponUntil)}"></div></div>
  <div class="sub-box" id="eventBox" ${kind==='イベント・教室の告知'?'':'hidden'}>
    <div class="fld"><label for="eventAt">イベントの日時<span class="req">必須</span></label><input id="eventAt" name="eventAt" type="datetime-local" value="${esc(toLocal(a.eventAt))}"></div>
    <div class="fld"><label for="eventPlace">場所（任意）</label><input id="eventPlace" name="eventPlace" value="${esc(a.eventPlace)}"></div></div>
  <div class="grid2"><div class="fld"><label for="from">掲載開始日<span class="req">必須</span></label><input id="from" name="from" type="date" min="${today}" value="${esc(a.from)}" required></div>
  <div class="fld"><label for="to">掲載終了日<span class="req">必須</span></label><input id="to" name="to" type="date" min="${today}" value="${esc(a.to)}" required></div></div>
  <div class="fld"><label for="remarks">備考（任意）</label><textarea id="remarks" name="remarks">${esc(a.remarks)}</textarea></div>
  <button class="btn-main" type="submit">${editId?'直して再送信':'依頼を送信'}</button></form>`);
  const f=document.getElementById('f');
  f.addEventListener('change',e=>{
    if(e.target.name==='adType'){document.getElementById('couponBox').hidden=e.target.value!=='クーポン';document.getElementById('eventBox').hidden=e.target.value!=='イベント・教室の告知'}
  });
  bindSubmit(f,T,async fd=>{
    const p={adId:editId||''};['adType','category','title','body','addr','hours','contact','coupon','couponTerms','couponUntil','eventAt','eventPlace','from','to','remarks'].forEach(k=>p[k]=fd.get(k));
    const r=await call('requestAd',p);
    done(T,`<b style="font-size:17px">${editId?'修正した依頼を送信しました':'広告の依頼を送信しました'}</b><p>広告番号 ${esc(r.id)}</p><p class="note">内容を確認のうえ、掲載のご連絡をします。</p><p><a class="btn-sub" href="${esc(url('c03'))}">依頼状況を見る</a></p>`);
  });
}

/* ---------- C-03 依頼状況（求人・広告） ---------- */
async function c03(){
  const T='依頼状況';loading(T);
  let jobs,ads;try{[jobs,ads]=await Promise.all([call('clientJobs'),call('clientAds')])}catch(e){return fail(T,e)}
  const gN={};jobs.forEach(j=>{if(j.groupId)gN[j.groupId]=(gN[j.groupId]||0)+1});const gSeen={};
  const jr=jobs.map(j=>(j.groupId&&!gSeen[j.groupId]&&(gSeen[j.groupId]=1)?`<h3 class="sub">${CAL_IC}まとめ依頼（${gN[j.groupId]}日分）：${esc(j.title)}<a href="${esc(url('c04',{group:j.groupId}))}" class="note">応募者を日ごとにまとめて見る</a></h3>`:'')+`<div class="row"><div><b>${esc(j.dateLabel)} ${esc(j.title)}</b><small>${esc(j.id)}｜応募 ${j.applied}名・採用 ${j.hired}名／募集 ${j.need}名</small>
    ${j.status==='差し戻し'?`<small class="ng-t">確認事項：${esc(j.reason)}</small><a href="${esc(url('c02',{type:'job',edit:j.id}))}" class="note">直して再送信する</a>`:''}
    ${j.applied?`<a href="${esc(url('c04',{job:j.id}))}" class="note">応募者を見る</a>`:''}</div>${statusBadge(j.status)}</div>`).join('');
  const ar=ads.map(a=>`<div class="row"><div><b>${esc(a.title)}</b><small>${esc(a.id)}｜${esc(a.adType)}｜${esc(a.from)}〜${esc(a.to)}</small>
    ${a.status==='差し戻し'?`<small class="ng-t">確認事項：${esc(a.reason)}</small><a href="${esc(url('c07',{edit:a.id}))}" class="note">直して再送信する</a>`:''}
    ${a.canvaUrl?link(a.canvaUrl,'<span class="note">掲載ページを見る</span>'):''}</div>${statusBadge(a.status)}</div>`).join('');
  shell(T,(jr?'<h2 class="sec">求人</h2>'+jr:'')+(ar?'<h2 class="sec">広告</h2>'+ar:'')||'<p class="note">まだ依頼はありません。</p>');
}

/* ---------- C-04 応募者確認・採否回答（?job=1日分、または ?group=まとめ依頼を日ごとに） ---------- */
function c04Section(d,many){
  const j=d.job,rest=Math.max(0,j.need-d.hired);
  return `<div${many?' class="daysec"':''}><b>${esc(j.dateLabel)} ${esc(j.title)}</b><p class="note">${many?esc(j.id)+'｜':''}採用 ${d.hired}名／募集 ${j.need}名${rest?`（あと${rest}名で充足）`:'（充足）'}</p></div>
  ${d.list.map(a=>`<div class="card"><b>${esc(a.id)}　${esc(a.age)}・${esc(a.sex)}${a.minor?'（18歳未満）':''}</b><span class="note" style="display:block">住所：${esc(a.addr)}｜お仕事 ${a.count}回・面談${a.zoom?'済み':'未'}${a.licenses&&a.licenses.length?'<br>免許・資格：'+a.licenses.map(esc).join('、'):''}</span>${a.comment?`<div class="cmt">${esc(a.comment)}</div>`:''}
   ${a.name?`<div class="okbox" style="margin-top:8px"><b>採用確定${a.status!=='採用'?'（'+esc(a.status)+'）':''}</b>会員ID：${esc(a.memberId)}<br>氏名：${esc(a.name)}<br>電話番号：${esc(a.tel)}<br>住所：${esc(a.addr)}<br>年齢：${esc(a.ageNum)}歳</div>`:
     a.status!=='パートナー確認中'?`<p class="note" style="margin-top:6px">${statusBadge(a.status)}</p>`:
     a.answer?`<p class="note" style="margin-top:6px">回答済み：${esc(a.answer)}（運営から本人へ連絡します）</p>`:
     `<div class="chips" style="margin-top:8px">${['採用','不採用'].map(o=>`<label><input type="radio" name="${esc(a.id)}" value="${o}">${o}</label>`).join('')}</div>`}</div>`).join('')||'<p class="note">応募者はまだいません。</p>'}`;
}
async function c04(){
  const T='応募者の確認';loading(T);const job=C.q.get('job')||'',group=C.q.get('group')||'';
  let ds;try{ds=group?await call('groupApplicants',{groupId:group}):[await call('applicants',{jobId:job})]}catch(e){return fail(T,e)}
  const many=!!group;
  const shown=many?ds.filter(d=>d.list.length):ds;
  const pending=[].concat.apply([],ds.map(d=>d.list.filter(a=>a.status==='パートナー確認中'&&!a.answer).map(a=>({a,jobId:d.job.id}))));
  shell(T,`<form id="f">${many?`<p class="note">${CAL_IC} まとめ依頼（${ds.length}日分）の応募者を、日ごとに出しています。応募のない日は出していません。</p>`:''}
  ${shown.map(d=>c04Section(d,many)).join('')||'<p class="note">応募者はまだいません。</p>'}
  <p class="note">採用が確定すると、会員ID・氏名・電話番号・住所・年齢が表示されます。メールアドレスは表示されません。</p>
  <button class="btn-main" type="submit" ${pending.length?'':'disabled'}>回答を送信</button></form>`);
  bindSubmit(document.getElementById('f'),T,async fd=>{
    const by={};pending.forEach(x=>{const v=fd.get(x.a.id);if(v)(by[x.jobId]=by[x.jobId]||{})[x.a.id]=v});
    const keys=Object.keys(by);
    if(!keys.length)throw new Error('採用か不採用を選んでください。');
    for(const k of keys)await call('answer',{jobId:k,answers:by[k]});
    done(T,'<b style="font-size:17px">回答を受け付けました</b><p class="note">運営から応募者へ連絡します。</p>');
  });
}

/* ---------- C-05 無料相談 ---------- */
async function c05(){
  const T='無料相談';loading(T);
  let d;try{d=await call('getClient')}catch(e){return fail(T,e)}
  const reg=d.registered;
  shell(T,`<form id="f">${reg?'<div class="okbox">登録済みの情報を自動で入力しました。</div>':''}
  <div class="fld"><label for="name">会社名・店舗名<span class="req">必須</span></label><input id="name" name="name" value="${esc(reg?d.name:'')}" ${reg?'readonly':''} required></div>
  <div class="fld"><label for="person">担当者名<span class="req">必須</span></label><input id="person" name="person" value="${esc(reg?d.person:'')}" ${reg?'readonly':''} required></div>
  ${reg?'':'<div class="fld"><label for="industry">業種（例：美容室・保育園・飲食店）</label><input id="industry" name="industry"></div>'}
  <div class="fld"><span class="lbl">ご相談内容</span>${chips('kind',['求人','広告（街ナビ・クーポン）','その他'],['求人'],'radio')}</div>
  <div class="fld"><label for="text">ご質問内容<span class="req">必須</span></label><textarea id="text" name="text" required></textarea></div>
  <div class="fld"><label for="wish">ご希望（任意）</label><input id="wish" name="wish"></div>
  <button class="btn-main" type="submit">送信する</button></form>`);
  bindSubmit(document.getElementById('f'),T,async fd=>{
    const p={};['name','person','industry','kind','text','wish'].forEach(k=>p[k]=fd.get(k));
    await call('consult',p);
    done(T,'<b style="font-size:17px">ご相談を受け付けました</b><p class="note">営業時間内に、担当者からLINEのトークで返信します。</p>');
  });
}

/* ===================== 起動 ===================== */
const PAGES = APP === 'client' ? { c01, c02, c03, c04, c05, c07 } : { u01, u00, u03, u05, u06: u05, checkin: u05 };
/* 画面を移るリンク（メニュー・「応募者を見る」など）を押したら、次の画面が出るまで「読み込み中」を出す */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  if ((a.getAttribute('href') || '').charAt(0) === '#' || !/^https?:$/.test(a.protocol)) return;
  busy(true, '読み込み中…');
});
window.addEventListener('pageshow', () => busy(false));
(async () => {
  try {
    if (TEST) {
      C.q = new URLSearchParams(CFG.query || ''); C.page = CFG.page || '';
      /* テスト用画面の上に、LINEのリッチメニューの代わりになるボタンを出す（URLを打たずに画面を行き来できる） */
      const menu = APP === 'client'
        ? [['c01', 'パートナー登録'], ['c02', '依頼する'], ['c03', '依頼状況'], ['c05', '無料相談']]
        : [['u01', '求人一覧'], ['u00', 'マイページ登録'], ['u05', '応募状況・出退勤']];
      /* 誰として操作するかを切り替える（別の会社・別の人として試すため） */
      const who = APP === 'client' ? 'パートナー' : 'メンバー', pre = APP === 'client' ? 'TEST-CLIENT-' : 'TEST-USER-';
      const swap = n => { const q = new URLSearchParams(CFG.query || ''); q.set('page', C.page || Object.keys(PAGES)[0]); q.set('uid', pre + n); q.delete('edit'); return CFG.baseUrl + '?' + q.toString(); };
      document.getElementById('test').innerHTML = `<div class="test">テスト用画面（LINE接続前）｜いまの${who}：<b>${esc(CFG.uid)}</b></div>`
        + `<nav class="testwho" aria-label="${who}を切り替え"><span>${who}を切り替え：</span>${[1, 2, 3, 4, 5].map(n => `<a href="${esc(swap(n))}" ${CFG.uid === pre + n ? 'aria-current="true"' : ''}>${who}${n}</a>`).join('')}</nav>`
        + `<nav class="testmenu" aria-label="テスト用メニュー">${menu.map(([pg, label]) => `<a href="${esc(url(pg))}" ${pg === C.page ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
    } else {
      if (!CFG.gasUrl || !CFG.liff || !CFG.liff[APP]) { app.innerHTML = '<main class="liff"><div class="ngbox">config.js の gasUrl と LIFF ID が設定されていません。</div></main>'; return; }
      await liff.init({ liffId: CFG.liff[APP] });
      if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
      ID_TOKEN = liff.getIDToken();
      if (!ID_TOKEN) throw new Error('LINEの情報を取得できませんでした。LIFFアプリのスコープに openid を設定してください。');
      C.q = new URLSearchParams(location.search); C.page = C.q.get('page') || '';
    }
    (PAGES[C.page] || Object.values(PAGES)[0])();
  } catch (e) {
    app.innerHTML = `<main class="liff"><div class="ngbox">${esc(e.message || e)}</div></main>`;
  }
})();
