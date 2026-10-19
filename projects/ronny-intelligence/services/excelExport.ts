import XLSX from 'xlsx-js-style';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  customColWidths?: Record<string, number>;
}

/**
 * 将数据以标准化商务格式导出为 Excel (.xlsx) 文件
 * 全量单元格强制应用：垂直居中 (vertical: 'center') 与 水平居中 (horizontal: 'center')
 */
export const exportDataToExcel = (
  data: Record<string, any>[],
  options: ExcelExportOptions
) => {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  if (worksheet && worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headers = Object.keys(data[0]);

    // 1. 设置列宽 (针对不同字段自适应，同时支持自定义列宽)
    const colWidths = headers.map(header => {
      if (options.customColWidths && options.customColWidths[header]) {
        return { wch: options.customColWidths[header] };
      }

      // 默认按列名特征自适应更优的商务列宽
      if (header === '序号') return { wch: 8 };
      if (header.includes('姓名')) return { wch: 16 };
      if (header.includes('职位')) return { wch: 16 };
      if (header.includes('国家')) return { wch: 14 };
      if (header.includes('日期')) return { wch: 14 };
      if (header.includes('邮箱')) return { wch: 24 };
      if (header.includes('电话')) return { wch: 18 };
      if (header.includes('网站')) return { wch: 24 };
      if (header.includes('全称')) return { wch: 26 };
      if (header.includes('业务类型') || header.includes('实际类型')) return { wch: 22 };
      if (header.includes('主营业务')) return { wch: 36 };
      if (header.includes('规模')) return { wch: 25 }; // 融合规模与采购潜力
      if (header.includes('结论')) return { wch: 12 };
      if (header.includes('策略')) return { wch: 35 };
      if (header.includes('跟进') || header.includes('备注')) return { wch: 25 };
      if (header.includes('负责员工')) return { wch: 14 };

      // 默认宽度
      return { wch: 20 };
    });

    worksheet['!cols'] = colWidths;

    // 2. 设置行高 (表头高 30pt，数据行高 26pt，保证视觉垂直居中不拥挤)
    const rowHeights = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      rowHeights.push({ hpt: R === 0 ? 30 : 25 });
    }
    worksheet['!rows'] = rowHeights;

    // 3. 逐单元格设置样式：强制垂直居中与居中对齐
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const isHeader = R === 0;

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (!cell) continue;

        cell.s = {
          alignment: {
            vertical: 'center',   // 垂直居中
            horizontal: 'center', // 居中对齐
            wrapText: true        // 自动换行
          },
          font: {
            name: 'Microsoft YaHei',
            sz: isHeader ? 11 : 10,
            bold: isHeader,
            color: { rgb: isHeader ? 'FFFFFF' : '1E293B' }
          },
          fill: isHeader
            ? { fgColor: { rgb: '4338CA' } } // 商务靛蓝表头 (Indigo 700)
            : (R % 2 === 0 ? { fgColor: { rgb: 'F8FAFC' } } : { fgColor: { rgb: 'FFFFFF' } }), // 斑马纹交替
          border: {
            top: { style: 'thin', color: { rgb: isHeader ? '3730A3' : 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: isHeader ? '3730A3' : 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: isHeader ? '3730A3' : 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: isHeader ? '3730A3' : 'E2E8F0' } }
          }
        };
      }
    }
  }

    const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || '背调报告');

  // 写入并触发浏览器下载
  XLSX.writeFile(workbook, options.filename);
};

/**
 * 严格保持原 19 列导出格式完全不变
 */
export const formatLeadToStandard19Columns = (item: any): Record<string, any> => {
  return {
    '序号': item.serialNumber,
    '客户姓名': item.name,
    '职位': item.jobTitle || '',
    '表单原选品类': item.currentlySelling || (item.fiveQuestions?.q2ProductsInterested !== '未填写' ? item.fiveQuestions?.q2ProductsInterested : '') || '',
    '表单合作意向': item.interestedCooperation || (item.fiveQuestions?.q3MeetingPreference !== '未填写' ? item.fiveQuestions?.q3MeetingPreference : '') || '',
    '国家': item.country,
    '企业识别映射': item.companyNameMapping,
    '实际业务类型': item.actualBusinessType || item.businessType || '',
    '表单原填类型': item.originalBusinessType || (item.fiveQuestions?.q1BusinessDescription !== '未填写' ? item.fiveQuestions?.q1BusinessDescription : '') || '',
    '电子邮箱': item.contactInfo?.email || '',
    '联络电话': item.contactInfo?.phone || '',
    '官方网站': item.contactInfo?.website || '',
    '主营业务与供应链': item.companyNature?.mainBusiness || '',
    '企业规模与采购实力': item.companyNature?.scale || '',
    '背调评估结论': item.conclusion,
    '针对性推销策略': item.productStrategy,
    '负责人员': item.assignedTo || '未分配',
    '跟进记录': item.followUpRecord || '',
    '备忘便签': item.note || ''
  };
};

/**
 * 展会与 Meta 专区全息扩展导出 (在原 19 列基准上追加 Meta 追溯与 5 题问卷明细)
 */
export const formatLeadToExtendedColumns = (item: any): Record<string, any> => {
  const base19 = formatLeadToStandard19Columns(item);
  const q = item.fiveQuestions;
  const m = item.meta;

  return {
    ...base19,
    '线索渠道分类': item.sourceType === 'exhibition' ? '展会推广' : item.sourceType === 'meta_daily' ? '日常Meta产品推广' : (!item.sourceType || item.sourceType === 'pending_confirmation') ? '待确认来源' : '通用背调',
    'WhatsApp独立号码': item.whatsappNumber || '',
    'Meta Lead ID': item.metaLeadId || m?.leadId || '',
    '广告表单ID (Form ID)': m?.formId || '',
    '广告表单名称 (Form Name)': m?.formName || '',
    '广告活动ID (Campaign ID)': m?.campaignId || '',
    '广告活动名称 (Campaign Name)': m?.campaignName || '',
    '广告ID (Ad ID)': m?.adId || '',
    'Messenger收件箱URL': item.inboxUrl || m?.inboxUrl || '',
    'Q1自报业务类型(需核验)': q?.q1BusinessDescription || '未填写',
    'Q2产品兴趣(仅代表意向)': q?.q2ProductsInterested || '未填写',
    'Q3会面地点意向': q?.q3MeetingPreference || '未填写',
    'Q4自报月采购量(辅助优先级)': q?.q4EstimatedMonthlyVolume || '未填写',
    'Q5服务市场(非注册国)': q?.q5MainMarketServed || '未填写',
    '依据状态': item.assessment?.verification === 'verified' ? '已有核实依据' : item.assessment?.verification === 'partial' ? '部分已核实' : '待核实',
    '判断依据': item.assessment?.reason || '未记录',
    '核验来源': (item.evidence || []).map((e: any) => `${e.claim}: ${e.url}`).join('\n'),
    '会面跟进优先级': item.meetingPriority === 'high' ? '重点优先' : item.meetingPriority === 'medium' ? '中度跟进' : item.meetingPriority === 'online_only' ? '线上优先' : '常规标准'
  };
};
