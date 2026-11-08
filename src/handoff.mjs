import {parseProject} from './model.mjs';import {projectJSON,receiptJSON,planHTML,layoutSVG} from './export.mjs';
export async function readProjectFile(file){if(!file||!Number.isInteger(file.size)||file.size>240000)throw Error('Project file exceeds 240,000 bytes.');const bytes=await file.arrayBuffer();if(bytes.byteLength>240000)throw Error('Project file exceeds 240,000 bytes.');return parseProject(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
export function attachHandoff(app,doc,win=doc.defaultView){
 const links=[['project-download','application/json',projectJSON],['html-download','text/html',planHTML],['svg-download','image/svg+xml',layoutSVG],['receipt-download','application/json',receiptJSON]];let urls=[],fileSequence=0;
 function refresh(){for(const u of urls)win.URL.revokeObjectURL(u);urls=[];for(const [id,type,format] of links){const a=doc.getElementById(id);a.removeAttribute('href');a.setAttribute('aria-disabled',String(app.dirty));if(!app.dirty){const u=win.URL.createObjectURL(new win.Blob([format(app.value)],{type:type+';charset=utf-8'}));urls.push(u);a.setAttribute('href',u);}}}
 for(const [id] of links)doc.getElementById(id).addEventListener('click',e=>{if(app.dirty){e.preventDefault();app.status('Save or clear drafts before downloading.');}});
 const input=doc.getElementById('project-file');
 input.addEventListener('change',async()=>{const seq=++fileSequence,start=app.revision,file=input.files?.[0];if(!file)return;if(app.dirty){app.status('Save or clear drafts before opening a project.');input.value='';return;}
  try{const p=await readProjectFile(file);if(seq!==fileSequence||start!==app.revision){if(seq===fileSequence)app.status('Project not opened because the job or a draft changed while reading. Choose the file again.');return;}app.load(p);}
  catch(e){if(seq===fileSequence&&start===app.revision)app.status('Could not open project: '+e.message);}
  finally{if(seq===fileSequence)input.value='';}
 });
 win.addEventListener('pagehide',()=>{for(const u of urls)win.URL.revokeObjectURL(u);urls=[];});win.addEventListener('pageshow',refresh);app.subscribe(refresh);
}
