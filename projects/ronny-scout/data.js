'use strict';
// Fictional scenarios only. No real people, company identities or contact details.
const ScoutData = (() => {
  const headers = ['分配业务员','客户信息','国家','公司介绍（主营·背景·规模）','原始采购需求','联系方式 / WhatsApp','官网与社媒','匹配与合作潜力','背调评级','开发切入点'];
  const scenarios = [
    ['雾湾餐饮','阿联酋','果汁分发机','连锁餐饮','P1','主营：轻餐与现调饮品。背景：虚构的多门店运营场景。规模：示例设定 4 个点位。','计划先试用 2 台，评估高峰出杯效率；希望比较清洁流程。','门店菜单与设备使用场景吻合，可从单店试点讨论统一配置。','确认日均杯量、吧台尺寸及供电条件，提供两款机型对照。'],
    ['松屿咖啡','新加坡','商用咖啡机','独立咖啡馆','P2','主营：咖啡与烘焙。背景：虚构的社区店早餐升级项目。规模：示例单店。','需要紧凑型商用咖啡机，先了解占地与日常维护。','单店需求清晰，适合通过操作与维护资料进一步确认匹配度。','发送设备尺寸与清洁说明，询问每日出杯量。'],
    ['澄原设备渠道','沙特阿拉伯','双缸雪泥机','设备分销','P1','主营：餐饮设备渠道分销。背景：虚构的冷饮产品线拓展计划。规模：区域渠道场景。','拟评估 8 台雪泥机，希望了解起订量、备件与交付周期。','具有渠道配套需求，可讨论样机测试与售后培训。','先核实销售区域和售后能力，再准备经销规格及备件方案。'],
    ['青桥运动饮品','马来西亚','蛋白饮品机','健康饮品品牌','P2','主营：运动营养饮品。背景：虚构的线下体验点方案。规模：示例初创团队。','希望测试蛋白粉自动冲调，尚未确定采购量。','粉料兼容性与清洁周期是判断设备适配的关键。','确认配方与单杯容量，制定样品测试清单。'],
    ['月港酒店配套','卡塔尔','果汁分发机','酒店供应','P1','主营：酒店饮品设备配套。背景：虚构的早餐区更新项目。规模：示例 3 个项目点。','计划分批配置 6 台果汁机，先核对容量与包装。','项目配套可按使用频次与部署节奏制定组合方案。','核实各点位人数、项目时间与售后响应要求。'],
    ['林序品鉴空间','德国','葡萄酒分杯机','独立零售','P2','主营：葡萄酒品鉴体验。背景：虚构的分杯体验空间。规模：示例单店。','咨询 4 瓶位分杯机，重点关注保鲜与操作。','适合从分杯体验和酒液保护讨论配置，仍需测试条件。','确认保存时长、计费方式与员工操作习惯。'],
    ['蓝汀活动服务','阿联酋','多品类设备','项目服务','P3','主营：活动现场饮品服务。背景：虚构的项目制采购。规模：活动服务团队。','尚未确定机型，想了解不同活动场景的设备选择。','需先确认活动频次与场地约束，暂不推定稳定采购量。','询问人数、用电、运输条件，以及租赁还是自持。'],
    ['晨岬办公饮品','阿曼','商用咖啡机','办公饮品服务','P2','主营：办公点位饮品配套。背景：虚构的自助服务方案。规模：示例 5 个试点。','了解速溶咖啡机与耗材配置，预计先测试一个点位。','多点运营场景适合从补货、清洁与单杯成本切入。','确认点位杯量、供粉方式与日常维护人选。'],
    ['禾岸厨房工程','肯尼亚','多品类设备','工程采购','P3','主营：商用厨房项目配套。背景：虚构的项目前期选型。规模：具体范围未提供。','希望获取饮品设备目录，采购时间未确定。','需先取得项目清单与安装条件，才能形成有效选型建议。','收集项目设备清单、安装尺寸和预计交付节点。'],
    ['星渡待核线索','英国','未分类','待核实','待核实','仅有虚构线索名称与国家；业务类型、背景和规模尚未提供。','希望获取产品资料，具体品类未填写。','信息不足，保留为待核实，不判断采购能力。','先确认企业主体、业务类型和目标产品。']
  ];
  function samples(){return scenarios.map((s,i)=>({id:'sample-'+(i+1),synthetic:true,category:s[2],type:s[3],raw:s[5]+'\n原始需求：'+s[6],cells:['','虚构 · '+s[0]+'｜联系人 S'+String(i+1).padStart(2,'0'),s[1],s[5],s[6],'未提供（演示不含联系方式）','未核验（演示不提供外链）',s[7],s[4],s[8]]}));}
  function parseDelimited(text, delimiter){
    const rows=[];let row=[],value='',quoted=false,closed=false;
    text=text.replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
      if(c==='"'){if(value||closed)throw new Error('引号格式不正确，请将包含引号的字段用双引号包围。');quoted=true;}
      else if(c===delimiter){row.push(value);value='';closed=false;}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';closed=false;}
      else {if(closed)throw new Error('结束引号后应为分隔符或换行。');value+=c;}
    }
    if(quoted)throw new Error('存在未闭合的双引号，请检查表格文本。');
    row.push(value);if(row.some(x=>x.trim()))rows.push(row);return rows;
  }
  function parseImport(text,start=0){
    if(new TextEncoder().encode(text).length>2*1024*1024)throw new Error('文本超过 2 MB，请分批导入。');
    if(!text.trim())throw new Error('请先粘贴线索或选择文件。');
    const firstLine=text.split(/\r?\n/)[0];
    const delimiter=firstLine.includes('\t')?'\t':firstLine.includes(',')?',':null;
    let rows=delimiter?parseDelimited(text,delimiter):text.split(/\r?\n/).filter(s=>s.trim()).map(s=>[s]);
    const aliases=[['分配业务员','业务员','owner'],['客户信息','公司','公司名称','company','company_name','customer'],['国家','国家/地区','country'],['公司介绍（主营·背景·规模）','公司介绍','企业身份与主营','profile'],['原始采购需求','采购需求','需求','intent'],['联系方式 / WhatsApp','联系方式','contact'],['官网与社媒','website'],['匹配与合作潜力','potential'],['背调评级','评级','priority'],['开发切入点','next']];
    const normalize=x=>x.trim().replace(/^[A-J][.．、\s]+/,'').toLowerCase();
    const first=rows[0].map(normalize),mapping=aliases.map(a=>first.findIndex(v=>a.some(s=>s.toLowerCase()===v)));
    const hasHeader=mapping[1]>=0;
    let productIndex=first.findIndex(s=>['产品','品类','category','product'].includes(s));
    let typeIndex=first.findIndex(s=>['业务类型','type'].includes(s));
    if(hasHeader)rows=rows.slice(1);
    else if(delimiter)throw new Error('表格需要标题行，至少包含「公司」或「客户信息」。请使用 CSV 模板。');
    if(!rows.length)throw new Error('只有标题行，没有可导入的客户。');
    if(rows.length>1000)throw new Error('一次最多导入 1,000 条，请分批处理。');
    return rows.map((row,i)=>{
      if(hasHeader&&row.length!==first.length)throw new Error('第 '+(i+2)+' 行列数与标题不一致，请检查分隔符。');
      const cells=hasHeader?mapping.map(index=>index<0?'':row[index].trim()):['',row[0].trim(),'','','','','','','',''];
      if(!cells[1])throw new Error('第 '+(i+2)+' 行缺少客户信息，本次未导入。');
      cells[8]='待核实';
      return {id:'import-'+(start+i),synthetic:false,cells,category:hasHeader&&productIndex>=0?row[productIndex].trim()||'未分类':'未分类',type:hasHeader&&typeIndex>=0?row[typeIndex].trim()||'待核实':'待核实',raw:hasHeader?first.map((k,j)=>k+'：'+row[j]).join('\n'):row[0]};
    });
  }
  // Spreadsheet formula prefixes are neutralized at export, never evaluated.
  function csvCell(value){let s=String(value);if(/^[\s\uFEFF]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function csv(records){return '\uFEFF'+[headers,...records.map(x=>x.cells)].map(row=>row.map(csvCell).join(',')).join('\r\n');}
  function audit(records){const seen=new Set();let duplicates=0,missingCountry=0,missingIntent=0,pending=0,formula=0;
    for(const r of records){const key=(r.cells[1]+'|'+r.cells[2]).trim().toLowerCase();if(seen.has(key))duplicates++;seen.add(key);if(!r.cells[2])missingCountry++;if(!r.cells[4])missingIntent++;if(r.cells[8]==='待核实')pending++;if(r.cells.some(c=>/^[\s\uFEFF]*[=+@-]/.test(c)))formula++;}
    return {duplicates,missingCountry,missingIntent,pending,formula,invalid:records.filter(r=>r.cells.length!==10||!r.cells[1]).length};
  }
  return {headers,samples,parseDelimited,parseImport,csv,audit};
})();
if(typeof module!=='undefined')module.exports=ScoutData;
