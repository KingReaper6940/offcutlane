export const SCHEMA='offcutlane-project-v1',MAX_LENGTH=100000000;
const fail=m=>{throw Error(m);};
function keys(o,names){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==[...names].sort().join('|'))fail('Unsupported project fields.');}
function text(v,max,name,multi=false){if(typeof v!=='string'||v.length>max||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)||(!multi&&/[\r\n]/.test(v)))fail(name+' has unsupported text or exceeds '+max+' characters.');}
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function parseLength(source,positive=false){
 if(typeof source!=='string')fail('Enter a decimal length.');const m=/^(\d{1,6})(?:\.(\d{1,3}))?$/.exec(source.trim());if(!m)fail('Use a decimal with at most three places; no fractions or exponents.');
 const n=Number(m[1])*1000+Number((m[2]??'').padEnd(3,'0'));if(!int(n,positive?1:0,MAX_LENGTH))fail('Length must be '+(positive?'greater than zero and ':'')+'at most 100,000 units.');return n;
}
export function formatLength(n){if(!Number.isSafeInteger(n)||n<0)fail('Invalid length.');const fraction=String(n%1000).padStart(3,'0').replace(/0+$/,'');return Math.floor(n/1000)+(fraction?'.'+fraction:'');}
export function validate(p){
 keys(p,['schema','title','notes','unit','kerf','trimStart','trimEnd','stocks','parts']);if(p.schema!==SCHEMA)fail('Unsupported project version.');text(p.title,80,'Title');if(!p.title.trim())fail('Give this job a title.');text(p.notes,1000,'Notes',true);if(!['mm','in'].includes(p.unit))fail('Unit must be mm or in.');
 for(const k of ['kerf','trimStart','trimEnd'])if(!int(p[k],0,MAX_LENGTH))fail('Invalid kerf or trim allowance.');
 for(const [key,prefix,maxRows,maxTotal] of [['stocks','s',12,50],['parts','p',20,80]]){
  if(!Array.isArray(p[key])||p[key].length>maxRows)fail('Too many '+key+' rows.');let total=0;const ids=new Set();
  for(const r of p[key]){keys(r,['id','label','length','qty']);if(typeof r.id!=='string'||!new RegExp('^'+prefix+'[1-9]\\d{0,5}$').test(r.id)||ids.has(r.id))fail('Invalid or duplicate row ID.');ids.add(r.id);text(r.label,48,'Label');if(!r.label.trim()||!int(r.length,1,MAX_LENGTH)||!int(r.qty,1,maxTotal))fail('Rows need a label, positive length and valid quantity.');if(key==='stocks'&&r.length<=p.trimStart+p.trimEnd)fail('Every stock length must exceed the combined trim allowances.');total+=r.qty;}
  if(total>maxTotal)fail('Limit: '+maxTotal+' total '+key+'.');
 }
 return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled job',notes:'',unit:'mm',kerf:0,trimStart:0,trimEnd:0,stocks:[],parts:[]});
export function parseProject(source){if(typeof source!=='string'||source.length>60000)fail('Project exceeds 60,000 characters.');return clone(JSON.parse(source));}
export function expand(p,key){validate(p);return p[key].flatMap(r=>Array.from({length:r.qty},(_,n)=>({id:r.id+'.'+(n+1),row:r.id,label:r.label,length:r.length})));}
