import {blank,parseLength,formatLength as f} from './model.mjs';import {example} from './example.mjs';import {edit,history} from './edit.mjs';import {calculate} from './pack.mjs';import {esc,layoutSVG} from './export.mjs';import {attachHandoff} from './handoff.mjs';
export function createApp(doc,win=doc.defaultView){
 const $=s=>doc.querySelector(s),forms={settings:$('#settings-form'),stocks:$('#stocks-form'),parts:$('#parts-form')},h=history(example()),dirty=new Set(),editing={stocks:null,parts:null};let revision=0,onChange=()=>{};
 const field=(kind,n)=>forms[kind].elements.namedItem(n),status=m=>{$('#status').textContent=m;};
 const check=except=>{if([...dirty].some(k=>k!==except))throw Error('Save or clear the other form drafts first.');};
 function reset(kind){forms[kind].reset();dirty.delete(kind);if(kind==='settings')syncSettings();else{editing[kind]=null;$('#'+kind+'-heading').textContent=kind==='stocks'?'Add stock row':'Add part row';}revision++;}
 function syncSettings(){const p=h.value;for(const k of ['title','notes','unit'])field('settings',k).value=p[k];for(const k of ['kerf','trimStart','trimEnd'])field('settings',k).value=f(p[k]);}
 function commit(p){h.commit(p);revision++;}
 const u=(n,p)=>f(n)+' '+p.unit;
 function render(){
  const p=h.value,a=calculate(p);$('#job-title').textContent=p.title;$('#placed-count').textContent=a.placed+' / '+a.requested;$('#stock-count').textContent=a.usedStock+' / '+a.availableStock;$('#leftover-count').textContent=u(a.leftover,p);
  $('#conservation').textContent=u(a.stockLength,p)+' stock = '+f(a.partLength)+' parts + '+f(a.kerfLoss)+' kerf + '+f(a.trimLoss)+' trim + '+f(a.leftover)+' remaining';
  $('#plot').innerHTML=layoutSVG(p);
  $('#bar-details').innerHTML=a.bars.map(b=>'<details><summary>'+esc(b.stock+' · '+b.label+' · '+u(b.length,p)+' · remainder '+u(b.leftover,p))+'</summary><p class="hint">Offsets from original stock start. Allocation order is not a machining sequence.</p><div class="table-scroll"><table><thead><tr><th>ID / label</th><th>Length</th><th>Start</th><th>End</th><th>Kerf after</th></tr></thead><tbody>'+b.cuts.map(c=>'<tr>'+[c.piece+' · '+c.label,u(c.length,p),u(c.start,p),u(c.end,p),u(c.kerfAfter,p)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>').join('')||'<p class="hint">No stock allocated yet. Add stock and required pieces.</p>';
  $('#missing-count').textContent=a.unplaced.length;$('#missing').innerHTML=a.unplaced.map(c=>'<li>'+esc(c.id+' · '+c.label+' · '+u(c.length,p))+'</li>').join('')||'<li>No unplaced demand in this suggested allocation.</li>';
  $('#unused-count').textContent=a.unused.length;$('#unused').innerHTML=a.unused.map(s=>'<li>'+esc(s.id+' · '+s.label+' · '+u(s.length,p))+'</li>').join('')||'<li>No unused stock in the current input.</li>';
  for(const kind of ['stocks','parts'])$('#'+kind).innerHTML=p[kind].map(r=>'<div class="row-item"><strong>'+esc(r.id.toUpperCase()+' · '+r.label)+'</strong>'+esc(u(r.length,p)+' × '+r.qty)+'<div class="toolbar"><button type="button" data-action="edit" data-kind="'+kind+'" data-id="'+r.id+'">Edit</button><button type="button" data-action="remove" data-kind="'+kind+'" data-id="'+r.id+'">Delete</button></div></div>').join('')||'<p class="hint">No rows yet.</p>';
  for(const e of doc.querySelectorAll('.unit'))e.textContent='('+p.unit+')';
  if(!dirty.has('settings'))syncSettings();
  $('#undo').disabled=!h.canUndo;$('#redo').disabled=!h.canRedo;onChange();
 }
 const run=fn=>{try{fn();}catch(e){status(e.message);}};
 for(const [kind,form] of Object.entries(forms)){
  const change=()=>{dirty.add(kind);revision++;status('Unsaved '+kind+' draft. Save or clear it before other edits or downloads.');onChange();};form.addEventListener('input',change);form.addEventListener('change',change);
  $('#'+kind+'-clear').addEventListener('click',()=>{reset(kind);render();status('Draft cleared.');});
  form.addEventListener('submit',e=>{e.preventDefault();run(()=>{check(kind);const get=n=>field(kind,n).value;let action;
   if(kind==='settings')action={type:'settings',title:get('title'),notes:get('notes'),unit:get('unit'),kerf:parseLength(get('kerf')),trimStart:parseLength(get('trimStart')),trimEnd:parseLength(get('trimEnd'))};
   else{if(get('qty')==='')throw Error('Quantity is required.');action={type:'row',kind,id:editing[kind],value:{label:get('label'),length:parseLength(get('length'),true),qty:Number(get('qty'))}};}
   commit(edit(h.value,action));reset(kind);render();status('Saved. Layout recalculated; review unplaced pieces and save project JSON before closing.');});});
 }
 for(const kind of ['stocks','parts'])$('#'+kind).addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;run(()=>{check();const id=b.dataset.id;if(b.dataset.action==='remove'){commit(edit(h.value,{type:'remove',kind,id}));reset(kind);render();status('Row removed. Undo is available.');}
  else{reset(kind);editing[kind]=id;const r=h.value[kind].find(r=>r.id===id);field(kind,'label').value=r.label;field(kind,'length').value=f(r.length);field(kind,'qty').value=r.qty;$('#'+kind+'-heading').textContent='Edit '+id.toUpperCase();field(kind,'label').focus();}});});
 for(const [id,maker] of [['demo',example],['new',blank]])$('#'+id).addEventListener('click',()=>run(()=>{check();commit(maker());reset('stocks');reset('parts');render();status(id==='new'?'Blank job ready. Choose units before adding length rows. Undo restores the previous job.':'Invented example loaded. Undo restores the previous job.');}));
 for(const dir of ['undo','redo'])$('#'+dir).addEventListener('click',()=>run(()=>{check();h[dir]();revision++;reset('stocks');reset('parts');render();status(dir==='undo'?'Undone.':'Redone.');}));
 win.addEventListener('beforeunload',e=>{e.preventDefault();e.returnValue='';});render();
 return {get value(){return h.value},get revision(){return revision},get dirty(){return dirty.size>0},status,
 load(p){check();commit(p);reset('stocks');reset('parts');render();status('Project opened. Undo restores the previous job.');},subscribe(fn){onChange=fn;fn();}};
}
if(typeof document!=='undefined')attachHandoff(createApp(document),document);
