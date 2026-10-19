const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..','site');
function environment(file,pathname,hash){
 const elements={};const fake=()=>({innerHTML:'',setAttribute(){},querySelector(){return null;},querySelectorAll(){return []},classList:{add(){},remove(){}},addEventListener(){},appendChild(){}});
 const document={documentElement:fake(),body:fake(),getElementById(id){return elements[id]||(elements[id]=fake());},addEventListener(){},createTreeWalker(){return {nextNode(){return null;}}},querySelectorAll(){return[]},querySelector(){return null;}};
 const memory={};const storage={getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v};const ctx={window:{addEventListener(){}},document,localStorage:storage,sessionStorage:storage,NodeFilter:{SHOW_TEXT:4},location:{pathname:pathname||'/'+file,hash:hash===undefined?(file==='index.html'?'#/home':'#/overview'):hash,replace(url){this.redirect=url;}},history:{length:1},setTimeout(){},clearTimeout(){},console,URL,Blob,navigator:{}};vm.createContext(ctx);
 for(const name of ['data.js','app.js',...(file==='workspace.html'?['local-data.js']:[])])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
 const defs={};const original=ctx.window.APP.page;ctx.window.APP.page=(name,def)=>{defs[name]=def;original(name,def);};
 const html=fs.readFileSync(path.join(root,file),'utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],ctx,{filename:file});
 return {ctx,defs};
}
for(const file of ['index.html','workspace.html']){
 const {ctx,defs}=environment(file),L=ctx.window.LS;
 for(const lang of ['zh','en']){L.setLang(lang);for(const [name,def]of Object.entries(defs)){ctx.location.hash='#/'+name;let html=def.render(name,name==='lead'?{id:'L-2401'}:{});assert(html&&typeof html==='string',file+':'+name);assert(!html.includes('undefined'),file+':'+name+' has undefined text');}}
 console.log('PASS',file,'all routes render in Chinese and English');
 if(file==='workspace.html'){
 let row=L.makeLocal({name:'Demo',country:'UAE',email:'a@example.com',memo:'=SUM(1,2)'},'site','raw');let bid=L.addLocalBatch([row],'test');assert.equal(L.byBatch(bid).length,1);assert.equal(L.findLead(row.id),row);assert.equal(L.filterRows([row],{q:'UAE'}).length,1);assert.equal(row.ana.verdict,'pending');assert(!row.ent.identified);
 for(const format of ['export19','exportExt','exportSimple']){let csv=L[format]([row]);assert.equal(L.parseTable(csv).rows.length,1);if(format==='export19'){assert.equal(Object.keys(L.parseTable(csv).rows[0]).length,19);assert(csv.includes("'=SUM"));}}
 ctx.location.hash='#/lead';assert(defs.lead.render('lead',{id:row.id}).includes('Demo'));console.log('PASS local import, missing company, detail, country search and three CSV formats');
 }
}

for(const pathname of ['/workspace','/workspace.html']){const {ctx}=environment('workspace.html',pathname,'');assert.equal(ctx.window.APP.route().page,'overview');assert(!ctx.location.redirect,'workspace must not redirect itself at '+pathname);assert(ctx.document.getElementById('view').innerHTML.includes('Dashboard'));}console.log('PASS workspace entry with clean URLs and direct navigation');

{const {ctx}=environment('workspace.html'),L=ctx.window.LS,r=L.findLead('L-2401'),previous=r.hand.owner;r.hand.owner={zh:'已分配',en:'Assigned'};assert(!L.filterRows([r],{owner:'unassigned'}).length);r.hand.owner=previous;assert.equal(L.filterRows([r],{owner:'unassigned'}).length,1);console.log('PASS dashboard owner queue excludes assigned records');}

{const {ctx,defs}=environment('workspace.html'),L=ctx.window.LS;
 for(const lang of ['en','zh']){L.setLang(lang);for(const key of Object.keys(L.VERDICT)){const r=L.makeLocal({name:'Round trip',verdict:L.T(L.VERDICT[key])},'meta','');assert.equal(r.ana.verdict,key);assert.equal(r.ent.identified,false);}}
 assert.equal(L.aliasOf('Ad set'),'adset');assert.equal(L.aliasOf('Raw request'),'inquiry');assert.equal(L.aliasOf('Next step'),'strategy');
 assert.equal(L.parseTable(' email , company \na@example.com,Demo').rows[0].email,'a@example.com');
 assert.throws(()=>L.parseTable('name,email\nAlex,a@example.com,extra'),/more columns|列数/);
 const r=L.makeLocal({name:'Second batch',source:'Website'},'meta','');assert.equal(r.source,'site');const bid=L.addLocalBatch([r],'audit');assert.equal(L.batchOf(r.id),bid);ctx.location.hash='#/lead?id='+r.id;assert(defs.lead.render('lead',{id:r.id}).includes('#/batches?batch='+bid));
 ctx.location.hash='#/lead?id=%ZZ&memo=a=b';assert.equal(ctx.window.APP.route().q.memo,'a=b');
 ctx.sessionStorage.setItem=()=>{throw new Error('quota');};assert.equal(L.localSave(),false);assert.equal(L.storageAvailable,false);
 console.log('PASS bilingual assessment import, aliases, CSV column integrity, batch return, malformed URLs and storage failure');
}
