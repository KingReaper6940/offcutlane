import {clone} from './model.mjs';
export function edit(p,a){
 const q=clone(p);
 if(a.type==='settings'){
  if(a.unit!==q.unit&&(q.stocks.length||q.parts.length))throw Error('Units are locked while length rows exist. Start a blank job to use another unit.');
  for(const k of ['title','notes','unit','kerf','trimStart','trimEnd'])q[k]=a[k];
 }else if(a.type==='row'){
  if(!['stocks','parts'].includes(a.kind))throw Error('Unsupported row type.');const rows=q[a.kind],prefix=a.kind==='stocks'?'s':'p';
  if(a.id){const i=rows.findIndex(r=>r.id===a.id);if(i<0)throw Error('Row no longer exists.');rows[i]={...a.value,id:a.id};}
  else{let n=1;while(rows.some(r=>r.id===prefix+n))n++;rows.push({...a.value,id:prefix+n});}
 }else if(a.type==='remove'){
  if(!['stocks','parts'].includes(a.kind)||!q[a.kind].some(r=>r.id===a.id))throw Error('Row no longer exists.');q[a.kind]=q[a.kind].filter(r=>r.id!==a.id);
 }else throw Error('Unsupported edit.');
 return clone(q);
}
export function history(initial){
 let current=clone(initial),past=[],future=[];
 return {get value(){return clone(current)},get canUndo(){return past.length>0},get canRedo(){return future.length>0},
 commit(p){const next=clone(p);if(JSON.stringify(next)===JSON.stringify(current))return false;past.push(current);past=past.slice(-25);current=next;future=[];return true;},
 undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},
 redo(){if(!future.length)return false;past.push(current);past=past.slice(-25);current=future.pop();return true;}};
}
