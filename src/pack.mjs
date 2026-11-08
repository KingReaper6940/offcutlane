import {validate,expand} from './model.mjs';
export const ALGORITHM='best-fit-decreasing-v1';
export function plan(p){
 validate(p);const stock=expand(p,'stocks').map(s=>({...s,used:false})),pieces=expand(p,'parts').map((c,index)=>({...c,index})).sort((a,b)=>b.length-a.length||a.index-b.index),bars=[],unplaced=[];
 const fit=(remaining,length)=>length===remaining?0:length+p.kerf<=remaining?p.kerf:null;
 for(const c of pieces){
  let chosen=null,cost=null,best=Infinity;
  for(const b of bars){const k=fit(b.remaining,c.length);if(k!==null&&b.remaining-c.length-k<best){chosen=b;cost=k;best=b.remaining-c.length-k;}}
  if(!chosen){let selected=null,smallest=Infinity;for(const s of stock){const usable=s.length-p.trimStart-p.trimEnd,k=fit(usable,c.length);if(!s.used&&k!==null&&usable<smallest){selected=s;cost=k;smallest=usable;}}
   if(selected){selected.used=true;chosen={stock:selected.id,cuts:[],remaining:smallest,cursor:p.trimStart};bars.push(chosen);}}
  if(!chosen){unplaced.push(c.id);continue;}
  chosen.cuts.push({piece:c.id,start:chosen.cursor,end:chosen.cursor+c.length,kerfAfter:cost});chosen.cursor+=c.length+cost;chosen.remaining-=c.length+cost;
 }
 return {algorithm:ALGORITHM,bars:bars.map(({stock,cuts})=>({stock,cuts})),unplaced};
}
export function auditPlan(p,result){
 validate(p);if(result?.algorithm!==ALGORITHM||!Array.isArray(result.bars)||!Array.isArray(result.unplaced))throw Error('Invalid plan.');
 const stocks=expand(p,'stocks'),pieces=expand(p,'parts'),stockMap=new Map(stocks.map(s=>[s.id,s])),pieceMap=new Map(pieces.map(c=>[c.id,c])),seen=new Set(),used=new Set(),bars=[];
 let stockLength=0,partLength=0,kerfLoss=0,trimLoss=0,leftover=0;
 for(const b of result.bars){
  const s=stockMap.get(b.stock);if(!s||used.has(s.id)||!Array.isArray(b.cuts)||!b.cuts.length)throw Error('Invalid or repeated stock assignment.');used.add(s.id);
  let cursor=p.trimStart,barParts=0,barKerf=0;const cuts=[];
  for(const c of b.cuts){const piece=pieceMap.get(c.piece);if(!piece||seen.has(piece.id))throw Error('Missing or repeated piece.');seen.add(piece.id);
   const remaining=s.length-p.trimEnd-cursor,expectedKerf=piece.length===remaining?0:p.kerf;
   if(c.start!==cursor||c.end!==cursor+piece.length||c.kerfAfter!==expectedKerf||piece.length+expectedKerf>remaining)throw Error('Cut geometry violates the kerf model.');
   cursor=c.end+c.kerfAfter;barParts+=piece.length;barKerf+=c.kerfAfter;cuts.push({...c,label:piece.label,length:piece.length});
  }
  const rem=s.length-p.trimEnd-cursor;if(rem<0)throw Error('Negative remnant.');
  stockLength+=s.length;partLength+=barParts;kerfLoss+=barKerf;trimLoss+=p.trimStart+p.trimEnd;leftover+=rem;
  bars.push({stock:s.id,label:s.label,length:s.length,usable:s.length-p.trimStart-p.trimEnd,partLength:barParts,kerfLoss:barKerf,leftover:rem,cuts});
 }
 const missing=result.unplaced.map(id=>{const c=pieceMap.get(id);if(!c||seen.has(id))throw Error('Invalid unplaced-piece accounting.');seen.add(id);return {...c,reason:'No placement found under this heuristic and kerf model; not proof of infeasibility.'};});
 if(seen.size!==pieces.length)throw Error('Plan omits requested pieces.');
 if(stockLength!==partLength+kerfLoss+trimLoss+leftover)throw Error('Length conservation failed.');
 return {algorithm:ALGORITHM,requested:pieces.length,placed:pieces.length-missing.length,unplaced:missing,usedStock:bars.length,availableStock:stocks.length,stockLength,partLength,kerfLoss,trimLoss,leftover,bars,unused:stocks.filter(s=>!used.has(s.id))};
}
export const calculate=p=>auditPlan(p,plan(p));
