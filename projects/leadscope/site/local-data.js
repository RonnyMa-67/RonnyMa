/* Device-local staging: imports and hand-off edits remain in this browser tab. */
(function(){
  'use strict';
  var LS=window.LS, baseBy=LS.byBatch, baseFind=LS.findLead, local=[];
  var key='leadscope-local-v1';
  LS.storageAvailable=true;
  function decorate(r){r.ext=function(){return Object.assign({campaign:'',adset:'',ad:'',form:r.raw.form},r.raw.ext||{});};return r;}
  try{local=JSON.parse(sessionStorage.getItem(key)||'[]');local.forEach(function(b){b.leads.forEach(decorate);});}catch(e){local=[];}
  function sync(){
    LS.BATCHES=local.concat(LS.BATCHES.filter(function(b){return !b.local;}));
    try{sessionStorage.setItem(key,JSON.stringify(local));}catch(e){LS.storageAvailable=false;return false;}LS.storageAvailable=true;return true;
  }
  LS.byBatch=function(id){if(!id)return LS.BATCHES.reduce(function(a,b){return a.concat(b.leads);},[]);var b=LS.BATCHES.find(function(b){return b.id===id;});return b?b.leads:[];};
  LS.findLead=function(id){return LS.byBatch().find(function(r){return r.id===id;})||baseFind(id);};
  LS.localSave=sync;
  LS.batchOf=function(id){var b=LS.BATCHES.find(function(b){return b.leads.some(function(r){return r.id===id;});});return b?b.id:'';};
  LS.localClear=function(){local=[];sync();};
  LS.makeLocal=function(fields,source,rawText){
    function val(k){return String(fields[k]||'').trim();}
    var verdict=val('verdict'),mapped={strong:'strong',worth:'worth',pending:'pending',hold:'hold','强烈推荐':'strong','可合作':'worth','值得跟进':'worth','待补信息':'pending','谨慎跟进':'hold','谨慎暂弃':'hold','谨慎':'hold'};
    Object.keys(LS.VERDICT).forEach(function(k){mapped[LS.VERDICT[k].zh]=k;mapped[LS.VERDICT[k].en.toLowerCase()]=k;});
    var known=mapped[verdict]||mapped[verdict.toLowerCase()],result=known||'pending';
    var sourceNames={};Object.keys(LS.SOURCES).forEach(function(k){[k,LS.SOURCES[k].zh,LS.SOURCES[k].en,typeof LS.SOURCES[k].short==='string'?LS.SOURCES[k].short:LS.SOURCES[k].short.zh,LS.SOURCES[k].short.en].forEach(function(n){if(n)sourceNames[n.toLowerCase()]=k;});});
    Object.assign(sourceNames,{website:'site','独立站':'site',marketplaces:'alibaba','b2b platform':'alibaba','expo card':'expo','business cards':'expo','email / manual':'email'});
    source=sourceNames[val('source').toLowerCase()]||source;
    if(!LS.SOURCES[source])source='email';
    return decorate({id:'I-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),source:source,local:true,
      raw:{name:val('name'),title:val('title'),category:val('category'),intent:val('intent'),country:val('country'),email:val('email'),phone:val('phone'),website:val('website'),company:val('company'),form:{zh:'本地录入 / 导入',en:'Local entry / import'},ext:{rawText:rawText||'',campaign:val('campaign'),adset:val('adset'),ad:val('ad'),inquiry:val('inquiry'),expoName:val('expoName'),emailSubject:val('emailSubject'),productPage:val('productPage'),originalFields:fields}},
      ent:{identified:false,name:val('entmap'),nameRaw:val('entmap')||val('company'),registry:'',confidence:'none',evidence:[LS.unknown('导入信息尚未独立核实','Imported information has not been independently verified')]},
      ana:{biztype:val('biztype'),roleCode:'',selftype:val('selftype'),mainbiz:val('mainbiz'),scale:val('scale'),verdict:result,gaps:[{zh:verdict&&!known?'原始结论「'+verdict+'」未映射；保留在原始字段中，需人工复核。':'主体、主营、采购角色与采购计划待核实。',en:'Verify entity, main business, purchasing role and purchasing plan.'}],evidence:[LS.unknown('用户提供的分析内容不等于已验证事实','User-supplied assessments are not independently verified facts')],strategy:val('strategy')||{zh:'先补齐识别信息，再到 AI Studio 运行背调；当前未自动生成判断。',en:'Complete identification fields, then screen in AI Studio. No assessment has been automatically generated.'}},
      hand:{owner:val('owner')||{zh:'待分配',en:'Unassigned'},followup:val('followup'),memo:val('memo')},flags:{priority:'p2',info:(val('company')&&(val('email')||val('phone')))?'partial':'thin',risk:'unverified'}});
  };
  LS.addLocalBatch=function(records,label){var id='LOCAL-'+Date.now();records.forEach(function(r){r.batch=id;});local.unshift({id:id,label:{zh:label,en:label},local:true,src:'mixed',leads:records});sync();return id;};
  sync();
  // Correct the sample's role: operating a store chain is commercial end use, not importing.
  var first=baseFind('L-2401');if(first){first.ana.roleCode='L3';first.ana.scale={zh:'客户自述 12 家门店；员工数与年采购额尚未核实。',en:'Customer reports 12 stores; staff count and annual purchasing value are unverified.'};first.ana.gaps=[{zh:'确认集中采购权限、计划数量与设备更换周期。',en:'Confirm purchasing authority, quantities and replacement cycle.'}];}
  Object.keys(LS.SOURCES).forEach(function(k){LS.SOURCES[k].label=LS.SOURCES[k].label||{zh:LS.SOURCES[k].zh,en:LS.SOURCES[k].en};});
  var oldFilter=LS.filterRows;
  var basicFilter=oldFilter;oldFilter=function(list,f){return basicFilter(list,f).filter(function(r){return (!f.country||(LS.T(r.raw.country)||'—')===f.country)&&(!f.business||(LS.T(r.ana.biztype)||'—')===f.business)&&(!f.owner||f.owner==='unassigned'||LS.T(r.hand.owner)===f.owner);});};
  LS.filterRows=function(list,f){if(!f||!f.q)return oldFilter(list,f);var q=f.q.toLowerCase(),rest=Object.assign({},f,{q:''});return oldFilter(list,rest).filter(function(r){return [LS.T(r.raw.name),LS.T(r.raw.company),LS.T(r.raw.country),r.raw.email,LS.T(r.ana.biztype),LS.T(r.ana.mainbiz),r.id].join(' ').toLowerCase().indexOf(q)>=0;});};
})();
