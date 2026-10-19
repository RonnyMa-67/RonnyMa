import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileUp, Search, X, FileText, FileSpreadsheet, Import, 
  Image as ImageIcon, Sparkles, Cpu, ChevronDown, Check, 
  Zap, ShieldCheck, UploadCloud, Eye, RefreshCw,
  Layers, ArrowRight, Trash2, HelpCircle, FileCheck,
  CheckCircle2, CornerDownLeft, Info,
  Building2, UserCheck, Globe, Target, Mail
} from 'lucide-react';
import { FileUpload, FREE_MODELS } from '../types';
import * as XLSX from 'xlsx';

interface LeadInputProps {
  onAnalyze: (text: string, contextFile: FileUpload | null, leadImage: FileUpload | null, tableRows?: Record<string, unknown>[]) => void;
  isAnalyzing: boolean;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
}

// 完全虚构的演示数据；不对应真实联系人或公司。
const SAMPLE_LEADS_TEXT = `序号	客户姓名	职位	现售品类	合作意向	国家	企业名称	电子邮箱	电话	官方网站
1	Demo Buyer A	Buyer	Beverage Equipment	Product consultation	Germany	Example Equipment A	buyer-a@example.com		https://example.com
2	Demo Buyer B	Manager	Hospitality Supplies	Distribution enquiry	Australia	Example Equipment B	buyer-b@example.com		https://example.org`;

// Meta 风格的 25 列虚构示例；不含真实广告或表单 ID。
const SAMPLE_META_EXHIBITION_CSV = `id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,what_best_describes_your_business?,which_products_are_you_interested_in?,where_would_you_prefer_to_meet_supplier?,what_is_your_estimated_monthly_order_volume?,which_market_do_you_mainly_serve?,full_name,job_title,company_name,whatsapp_number,email,phone_number,inbox_url,lead_status
demo_exhibition_1,2026-10-01T08:00:00Z,demo_ad_1,Fictional demo ad,demo_adset,Fictional demo audience,demo_exhibition,Fictional exhibition campaign,demo_form,Fictional sample form,false,fb,Equipment distributor,Commercial beverage dispensers,Trade fair,Not confirmed,Germany,Demo Buyer 1,Buyer,Example Equipment 1,,demo-buyer-1@example.com,,,active
demo_exhibition_2,2026-10-01T08:00:00Z,demo_ad_2,Fictional demo ad,demo_adset,Fictional demo audience,demo_exhibition,Fictional exhibition campaign,demo_form,Fictional sample form,false,fb,Equipment distributor,Commercial beverage dispensers,Trade fair,Not confirmed,Germany,Demo Buyer 2,Buyer,Example Equipment 2,,demo-buyer-2@example.com,,,active`;

// Meta 日常产品推广表单 25 列标准数据（非展会表单，走日常产品核验/报价推进）
const SAMPLE_META_DAILY_CSV = `id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,what_best_describes_your_business?,which_products_are_you_interested_in?,where_would_you_prefer_to_meet_supplier?,what_is_your_estimated_monthly_order_volume?,which_market_do_you_mainly_serve?,full_name,job_title,company_name,whatsapp_number,email,phone_number,inbox_url,lead_status
demo_daily_1,2026-10-01T08:00:00Z,demo_ad_1,Fictional demo ad,demo_adset,Fictional demo audience,demo_daily,Fictional daily campaign,demo_form,Fictional sample form,false,fb,Equipment distributor,Commercial beverage dispensers,-,Not confirmed,Germany,Demo Buyer 1,Buyer,Example Equipment 1,,demo-buyer-1@example.com,,,active
demo_daily_2,2026-10-01T08:00:00Z,demo_ad_2,Fictional demo ad,demo_adset,Fictional demo audience,demo_daily,Fictional daily campaign,demo_form,Fictional sample form,false,fb,Equipment distributor,Commercial beverage dispensers,-,Not confirmed,Germany,Demo Buyer 2,Buyer,Example Equipment 2,,demo-buyer-2@example.com,,,active`;

export const LeadInput: React.FC<LeadInputProps> = ({ 
  onAnalyze, 
  isAnalyzing,
  selectedModel = 'gemini-3.8-flash',
  onSelectModel
}) => {
  const [text, setText] = useState('');
  const importedTable = useRef<{text: string; rows: Record<string, unknown>[]} | null>(null);
  const [inputTab, setInputTab] = useState<'text' | 'image'>('text');
  const [contextFile, setContextFile] = useState<FileUpload | null>(null);
  const [leadImage, setLeadImage] = useState<FileUpload | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  
  const catalogInputRef = useRef<HTMLInputElement>(null);
  const leadsImportInputRef = useRef<HTMLInputElement>(null);
  const leadImageInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = FREE_MODELS.find(m => m.id === selectedModel) || FREE_MODELS[0];

  const utf8_to_b64 = (str: string) => {
    return window.btoa(unescape(encodeURIComponent(str)));
  };

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  // 预估行数与线索条数
  const estimatedLeadCount = React.useMemo(() => {
    if (!text.trim()) return 0;
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    // 如果首行是标题头（如包含 "姓名" "企业" "序号" "Name"），则减去1
    const firstLine = lines[0]?.toLowerCase() || '';
    const isHeader = firstLine.includes('姓名') || firstLine.includes('name') || firstLine.includes('序号') || firstLine.includes('company');
    return isHeader && lines.length > 1 ? lines.length - 1 : lines.length;
  }, [text]);

  // 检测是否为 macOS 环境，以便在界面适配专属 Command (⌘) 快捷键交互
  const isMac = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  }, []);

  // 统一处理图片文件
  const processImageFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast("图片过大，请上传 8MB 以内的图片。", "info");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = (event.target.result as string).split(',')[1];
        const displayName = file.name || `截图_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;
        setLeadImage({
          name: displayName,
          type: file.type || 'image/png',
          content: base64String
        });
        showToast(`已成功挂载截图: ${displayName}`, "success");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // 统一处理 Excel / CSV 表格（按表头解析整个 xls/xlsx/csv，支持 Meta 25 列自动识别与去重预处理）
  const processExcelFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast("表格文件过大，请上传 8MB 以内的文件。", "info");
      return;
    }
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      
      // 读取为结构化 JSON 行对象
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      
      if (!csv.trim() || rows.length === 0) {
        showToast("选中的表格文件内容为空。", "info");
        return;
      }

      // 检测是否为 Meta 表单导出
      const firstRowKeys = Object.keys(rows[0] || {});
      const isMeta = firstRowKeys.some(k => {
        const norm = k.toLowerCase().replace(/[\s\?_\-\.]/g, '');
        return norm.includes('formid') || norm.includes('campaignid') || norm.includes('whatbestdescribes') || norm.includes('wherewouldyouprefer');
      });

      if (isMeta) {
        showToast(`检测到 Meta 广告导出表 (${rows.length} 条线索)，已自动保留表头与 25 列字段`, "success");
      } else {
        showToast(`已成功导入表格名单: ${file.name} (共 ${rows.length} 行)`, "success");
      }

      importedTable.current = { text: csv, rows };
      setText(csv);
      setInputTab('text');
    } catch (err) {
      console.error("Excel import error", err);
      showToast("解析表格失败，请确认文件格式为有效 .xlsx / .xls / .csv。", "info");
    }
  }, []);

  // 文本录入区域原生粘贴
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const plainText = e.clipboardData?.getData('text');
    if (plainText) {
      return; // 原生接收文本
    }
  };

  // 快捷键监听：Ctrl+Enter / Cmd+Enter 快速触发分析
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && (text.trim() || leadImage)) {
        handleAnalyze();
      }
    }
  };

  // 在截图识别专属分区中粘贴
  const handleScreenshotTabPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          return;
        }
      }
    }
    showToast("当前为截图识别区，未在剪贴板中检测到有效图片数据", "info");
  };

  // 全局拖放监听
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic|bmp|gif)$/i.test(fileName)) {
      processImageFile(file);
      setInputTab('image');
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      processExcelFile(file);
    } else {
      showToast("请拖入图片文件 (PNG/JPG) 或表格名单 (Excel/CSV)。", "info");
    }
  };

  const handleLeadImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
      setInputTab('image');
    }
  };

  const handleLeadsImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
      if (leadsImportInputRef.current) leadsImportInputRef.current.value = '';
    }
  };

  const handleCatalogFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        showToast("背景材料文件过大 (超过 8MB)。", "info");
        e.target.value = ''; 
        return;
      }

      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        try {
          const data = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(data);
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(firstSheet);
          
          setContextFile({
            name: selectedFile.name,
            type: 'text/csv', 
            content: utf8_to_b64(csv)
          });
          showToast(`已附加业务材料: ${selectedFile.name}`, "success");
        } catch (err) {
          console.error("Excel parse error", err);
          showToast("无法解析该 Excel 文件，请确认格式。", "info");
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64String = (event.target.result as string).split(',')[1];
            setContextFile({
              name: selectedFile.name,
              type: selectedFile.type,
              content: base64String
            });
            showToast(`已附加业务材料: ${selectedFile.name}`, "success");
          }
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const removeContextFile = () => {
    setContextFile(null);
    if (catalogInputRef.current) catalogInputRef.current.value = '';
  };

  const removeLeadImage = () => {
    setLeadImage(null);
    if (leadImageInputRef.current) leadImageInputRef.current.value = '';
  };

  const handleInsertSample = () => {
    setText(SAMPLE_LEADS_TEXT);
    setInputTab('text');
    showToast("已载入 4 条精选外贸客户测试数据", "success");
  };

  const handleClearText = () => {
    setText('');
    showToast("输入内容已清空", "info");
  };

  const handleAnalyze = () => {
    if (!text.trim() && !leadImage) {
      showToast("请输入文本线索或上传包含线索的截图。", "info");
      return;
    }
    onAnalyze(text, contextFile, leadImage, importedTable.current?.text === text ? importedTable.current.rows : undefined);
  };

  return (
    <div 
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`harmony-card rounded-[20px] p-[20px] sm:p-[22px] bg-[var(--surface)] border border-[var(--line)] relative ${
        isDraggingOver 
          ? 'border-[var(--ink)] bg-[var(--surface-2)]' 
          : ''
      }`}
    >
      {/* 拖拽悬停遮罩指示 */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[var(--surface)]/95 rounded-[20px] z-40 flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-[var(--ink)]">
          <div className="bg-[var(--surface)] p-6 rounded-[20px] elevation-float flex items-center gap-4 border border-[var(--line)]">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] text-[var(--ink)] flex items-center justify-center">
              <UploadCloud size={24} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-[var(--ink)]">释放文件完成导入</p>
              <p className="text-[13px] font-normal text-[var(--ink-2)] mt-0.5">支持图片截图 (PNG/JPG) 或 Excel/CSV 客户名单</p>
            </div>
          </div>
        </div>
      )}

      {/* 操作反馈浮动提示 */}
      {feedbackToast && (
        <div className="absolute top-4 right-6 z-50 bg-[var(--surface)] text-[var(--ink)] text-[12px] px-3.5 py-2 rounded-full elevation-float flex items-center gap-2 border border-[var(--line)]">
          <div className="w-4 h-4 rounded-full flex items-center justify-center bg-[var(--surface-2)] text-[var(--ink)]">
            {feedbackToast.type === 'info' ? <Info size={11} strokeWidth={2.5} /> : <Check size={11} strokeWidth={3} />}
          </div>
          <span className="font-medium">{feedbackToast.message}</span>
        </div>
      )}

      {/* 顶部控制台头部：标题导向 + 多模态分区 + 快速工具 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[var(--line)]">
        
        {/* 左侧：工作台标题与说明 */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-1.5 h-4 rounded-full bg-[var(--glow-2)] shadow-[0_0_8px_var(--glow-2)]" />
              <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                客户线索背调
              </h2>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--line)] px-2.5 py-0.5 rounded-full">
                联网核验
              </span>
            </div>
            <p className="text-[13px] font-normal text-[var(--ink-2)] mt-0.5">
              粘贴客户信息、表格或截图，自动核实公司全称、联系通道与真实业务
            </p>
          </div>
        </div>

        {/* 右侧：多模态切换胶囊与快捷导入操作 */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          
          {/* 模式切换选项卡（大圆角全胶囊） */}
          <div className="harmony-capsule-bg inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setInputTab('text')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                inputTab === 'text'
                  ? 'bg-[var(--ink)] text-white'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <FileText size={13} className={inputTab === 'text' ? 'text-white' : 'text-[var(--ink-2)]'} strokeWidth={2} />
              <span>文本 / 表格</span>
              {text.trim() && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  inputTab === 'text' ? 'bg-[var(--surface)]/20 text-white' : 'bg-[var(--line)] text-[var(--ink)]'
                }`}>
                  {estimatedLeadCount}条
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setInputTab('image')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                inputTab === 'image'
                  ? 'bg-[var(--ink)] text-white'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <ImageIcon size={13} className={inputTab === 'image' ? 'text-white' : 'text-[var(--ink-2)]'} strokeWidth={2} />
              <span>截图核验</span>
              {leadImage && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]"></span>
              )}
            </button>
          </div>

          {/* 隐藏式文件 Input */}
          <input
            type="file"
            ref={leadImageInputRef}
            onChange={handleLeadImageChange}
            accept="image/png,image/jpeg,image/webp,image/heic"
            className="hidden"
          />
          <input
            type="file"
            ref={leadsImportInputRef}
            onChange={handleLeadsImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* 工具快捷按钮组（一律全胶囊） */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => leadsImportInputRef.current?.click()}
              className="harmony-btn-secondary flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap"
              disabled={isAnalyzing}
              title="导入本地 Excel 或 CSV 表格名单"
            >
              <Import size={13} className="text-[var(--ink)]" strokeWidth={2} />
              <span>导入表格</span>
            </button>

            <button 
              onClick={handleInsertSample}
              className="harmony-btn-secondary flex items-center gap-1 text-[12px] font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap text-[var(--ink-2)] hover:text-[var(--ink)]"
              disabled={isAnalyzing}
              title="填入通用示例客户数据"
            >
              <span>通用示例</span>
            </button>

            <button 
              onClick={() => {
                setText(SAMPLE_META_EXHIBITION_CSV);
                setInputTab('text');
                showToast("已载入【虚构展会演示表单】Meta 25列真实测试样本", "success");
              }}
              className="harmony-btn-secondary flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap text-amber-600 dark:text-amber-400 border-amber-500/30 hover:border-amber-500"
              disabled={isAnalyzing}
              title="载入展会推广示例表单 (form_id: demo_exhibition_form)"
            >
              <span>🏛️ 展会Meta样本</span>
            </button>

            <button 
              onClick={() => {
                setText(SAMPLE_META_DAILY_CSV);
                setInputTab('text');
                showToast("已载入【日常 Meta 产品推广】25列真实测试样本", "success");
              }}
              className="harmony-btn-secondary flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap text-blue-600 dark:text-blue-400 border-blue-500/30 hover:border-blue-500"
              disabled={isAnalyzing}
              title="载入日常 Meta 产品推广表单样本"
            >
              <span>📢 日常Meta样本</span>
            </button>

            {text.trim() && (
              <button 
                onClick={handleClearText}
                className="p-1.5 rounded-full text-[var(--ink-3)] hover:text-[var(--danger)] transition-colors"
                title="清空输入框"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主输入画布区域 */}
      <div className="pt-4 pb-2">
        
        {/* 模式 1：文本与结构化表格录入 */}
        {inputTab === 'text' && (
          <div className="space-y-2">
            {/* 输入区上方的小提示栏：标签与预估状态 */}
            <div className="flex items-center justify-between text-[12px] px-1 text-[var(--ink-2)]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[12px] font-medium text-[var(--ink)]">
                  自动提取:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] px-2 py-0.5 rounded-full">
                  企业全称
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] px-2 py-0.5 rounded-full">
                  姓名职位
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] px-2 py-0.5 rounded-full">
                  国家地区
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] px-2 py-0.5 rounded-full">
                  现售与意向
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] px-2 py-0.5 rounded-full">
                  邮箱/电话/官网
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono">
                {text.trim() && (
                  <span className="text-[var(--ink)] font-medium bg-[var(--surface-2)] border border-[var(--line)] px-2 py-0.5 rounded-full">
                    检测到 ~{estimatedLeadCount} 条潜在客户
                  </span>
                )}
                <span className="text-[var(--ink-3)]">{text.length} 字符</span>
              </div>
            </div>

            {/* 输入框容器（圆角 12px，底 var(--surface-2) var(--surface-2)，描边 var(--line) var(--line)） */}
            <div className="relative group rounded-[12px] bg-[var(--surface-2)] p-1 border border-[var(--line)] focus-within:border-[var(--ink)] transition-colors">
              <textarea
                ref={textareaRef}
                className="w-full h-32 sm:h-36 lg:h-36 xl:h-40 p-3 sm:p-3.5 rounded-[12px] font-mono text-[13px] resize-none bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--ink-3)] leading-relaxed outline-none"
                placeholder={`可直接粘贴 Excel、CSV、客户询盘、网站表单或零散客户信息。例如：
1. Demo Buyer A (Buyer), Example Equipment, Germany, buyer@example.com, https://example.com
2. 客户咨询：Example Supplies (Australia), 意向咨询商用饮品设备, 联系人 Demo Buyer B
3. 直接从网站后台表单复制的多列制表符内容...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handleTextareaPaste}
                onKeyDown={handleTextareaKeyDown}
                disabled={isAnalyzing}
              ></textarea>

              {/* 快捷键与底部状态指示 */}
              <div className="px-3 py-1.5 sm:py-2 border-t border-[var(--line)] bg-[var(--surface-2)] rounded-b-[12px] flex items-center justify-between text-[12px] text-[var(--ink-2)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">支持中英文与多列制表符，全自动解析</span>
                </div>
                <div className="hidden xs:flex sm:flex items-center gap-2 text-[12px] shrink-0">
                  <span className="hidden md:inline text-[var(--ink-3)]">快捷启动:</span>
                  <kbd className="px-2 py-0.5 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-full font-mono text-[11px] font-medium flex items-center gap-1">
                    <span>{isMac ? '⌘ + Enter' : 'Ctrl + Enter'}</span>
                    <CornerDownLeft size={10} />
                  </kbd>
                </div>
              </div>
            </div>

            {/* 若已附加截图，在文本模式底部给出联动卡片 */}
            {leadImage && (
              <div className="flex items-center justify-between text-[12px] px-3.5 py-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] text-[var(--ink-2)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] shrink-0 border border-[var(--line)]">
                    <ImageIcon size={13} />
                  </div>
                  <span className="text-[var(--ink)] font-medium truncate">
                    已关联截图: <strong className="text-[var(--ink)]">{leadImage.name}</strong>
                  </span>
                  <span className="text-[11px] bg-[var(--surface)] text-[var(--ink-2)] px-2 py-0.5 rounded-full font-mono font-medium shrink-0 border border-[var(--line)]">
                    已就绪
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => setInputTab('image')}
                    className="text-[var(--ink)] hover:underline text-[12px] flex items-center gap-1 font-medium"
                  >
                    查看截图 <ArrowRight size={12} />
                  </button>
                  <button 
                    onClick={removeLeadImage}
                    className="text-[var(--ink-3)] hover:text-[var(--danger)] p-1 rounded-full hover:bg-[var(--surface)] transition-colors"
                    title="移除截图"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 模式 2：截图智能 OCR 专属提取区 */}
        {inputTab === 'image' && (
          <div 
            onPaste={handleScreenshotTabPaste}
            tabIndex={0}
            className="w-full h-56 rounded-[12px] outline-none"
          >
            {!leadImage ? (
              <div 
                onClick={() => leadImageInputRef.current?.click()}
                className="w-full h-full border border-dashed border-[var(--line)] hover:border-[var(--ink)] bg-[var(--surface-2)] rounded-[12px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] mb-3">
                  <ImageIcon size={20} />
                </div>
                <p className="text-[14px] font-semibold text-[var(--ink)] flex items-center gap-2">
                  <span>点击上传截图，或在当前区域按下</span>
                  <kbd className="px-2 py-0.5 bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-full font-mono text-[11px] font-medium">
                    {isMac ? '⌘ + V' : 'Ctrl + V'}
                  </kbd>
                  <span>直接粘贴</span>
                </p>
                <p className="text-[13px] text-[var(--ink-2)] mt-1.5">
                  支持 WhatsApp / 微信聊天记录截图、展会名片、企业官网截图、后台线索表格截图等 (自动 OCR 提取)
                </p>
              </div>
            ) : (
              <div className="w-full h-full p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  {/* 截图缩略图 */}
                  <div 
                    onClick={() => setShowImagePreviewModal(true)}
                    className="w-24 h-24 bg-[var(--surface)] rounded-[12px] overflow-hidden shrink-0 border border-[var(--line)] cursor-pointer relative"
                    title="点击放大查看原图"
                  >
                    <img 
                      src={`data:${leadImage.type};base64,${leadImage.content}`} 
                      alt="preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye size={18} />
                    </div>
                  </div>

                  {/* 详情与说明 */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[14px] font-semibold text-[var(--ink)] truncate max-w-[320px]">
                        {leadImage.name}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--ink-2)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full">
                        图片已就绪
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                      将自动提取图片中的公司名称、联系人和需求，并执行核验。
                    </p>
                    <div className="mt-2.5 flex items-center gap-3 text-[12px] text-[var(--ink)] font-medium">
                      <button 
                        onClick={() => setShowImagePreviewModal(true)}
                        className="hover:underline flex items-center gap-1"
                      >
                        <Eye size={13} /> 查看原图
                      </button>
                    </div>
                  </div>
                </div>

                {/* 截图操作条 */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => leadImageInputRef.current?.click()}
                      className="harmony-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    >
                      <RefreshCw size={12} />
                      <span>更换截图</span>
                    </button>
                    <button 
                      onClick={removeLeadImage}
                      className="harmony-btn-danger flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    >
                      <X size={12} />
                      <span>移除截图</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="harmony-btn-cta flex items-center gap-2 px-5 text-[14px]"
                  >
                    <span>开始背调</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部功能配置底座 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3.5 mt-1 border-t border-[var(--line)]">
        
        {/* 卡片 1: 产品资料 (选填) */}
        <div className="md:col-span-5 bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-[var(--ink)] flex items-center gap-1.5">
                <FileUp size={13} className="text-[var(--ink-2)]" /> 1. 产品资料 (选填)
              </span>
              <span className="text-[11px] text-[var(--ink-2)] font-normal bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--line)]">辅助精准匹配</span>
            </div>

            <input
              type="file"
              ref={catalogInputRef}
              onChange={handleCatalogFileChange}
              accept=".pdf,.txt,.csv,.md,.xlsx,.xls"
              className="hidden"
            />
            
            {!contextFile ? (
              <button
                onClick={() => catalogInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] transition-colors text-[12px] font-medium"
                disabled={isAnalyzing}
              >
                <FileUp size={12} className="text-[var(--ink-2)]"/>
                <span className="truncate">上传产品目录 / 规格书 (PDF/Excel)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-[var(--surface)] text-[var(--ink)] px-3 py-1.5 rounded-full border border-[var(--line)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12px] font-medium truncate max-w-[180px]">{contextFile.name}</span>
                </div>
                <button 
                  onClick={removeContextFile}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-[var(--ink-2)] hover:text-[var(--danger)] transition-colors"
                  disabled={isAnalyzing}
                  title="移除此资料"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 卡片 2: 分析引擎 */}
        <div className="md:col-span-4 bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-[var(--ink)] flex items-center gap-1.5">
                <Cpu size={13} className="text-[var(--ink-2)]" /> 2. 分析引擎
              </span>
              <span className="text-[11px] text-[var(--ink-2)] font-medium bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--line)]">就绪</span>
            </div>

            <button
              type="button"
              onClick={() => setShowModelModal(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] rounded-full text-[12px] font-medium transition-colors"
              title="点击切换分析模型"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-[12px] font-medium">{currentModel.name}</span>
                <span className="text-[10px] bg-[var(--surface-2)] text-[var(--ink-2)] px-1.5 py-0.2 rounded-full font-mono border border-[var(--line)]">
                  {currentModel.badge}
                </span>
              </div>
              <ChevronDown size={13} className="text-[var(--ink-2)] shrink-0" />
            </button>
          </div>
        </div>

        {/* 卡片 3: 启动主操作按钮 (全屏唯一主按钮) */}
        <div className="md:col-span-3 flex items-center justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!text.trim() && !leadImage)}
            className="w-full harmony-btn-primary text-[14px]"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>正在核验中...</span>
              </>
            ) : (
              <>
                <Search size={15} className="text-white shrink-0" />
                <span>开始背调</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 图片原图放大预览 Modal */}
      {/* 客户图片大图预览弹窗 (符合 HarmonyOS 7 规范的 Level 100 全屏模态弹层) */}
      {showImagePreviewModal && leadImage && (
        <div 
          onClick={() => setShowImagePreviewModal(false)}
          className="fixed inset-0 z-[100] bg-[var(--ink)]/40 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[var(--surface)] rounded-[20px] overflow-hidden max-w-4xl max-h-[90vh] flex flex-col elevation-float border border-[var(--line)]"
          >
            <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-2)]">
              <span className="text-[13px] font-semibold text-[var(--ink)] truncate">{leadImage.name}</span>
              <button 
                onClick={() => setShowImagePreviewModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-70px)] flex items-center justify-center bg-[var(--surface-2)]">
              <img 
                src={`data:${leadImage.type};base64,${leadImage.content}`} 
                alt="Full Preview" 
                className="max-w-full max-h-full object-contain rounded-[12px] border border-[var(--line)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Selection Modal (符合 HarmonyOS 7 规范的 Level 100 全屏模态弹层) */}
      {showModelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[var(--ink)]/40 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[var(--surface)] rounded-[20px] elevation-float border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-2)]">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]">
                  <Cpu size={16} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2">
                    选择分析引擎
                    <span className="text-[11px] font-medium text-[var(--ink-2)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full">
                      当前可用
                    </span>
                  </h3>
                  <p className="text-[12px] text-[var(--ink-2)] mt-0.5">选择底层模型，支持实时联网核验</p>
                </div>
              </div>
              <button
                onClick={() => setShowModelModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Model List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar">
              {FREE_MODELS.map((m) => {
                const isSelected = m.id === selectedModel;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectModel) {
                        onSelectModel(m.id);
                      }
                      setShowModelModal(false);
                    }}
                    className={`
                      relative p-4 rounded-[16px] border cursor-pointer transition-all duration-150
                      ${isSelected 
                        ? 'border-[var(--ink)] bg-[var(--surface-2)]' 
                        : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink-3)] hover:bg-[var(--surface-2)]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[13px] text-[var(--ink)]">{m.name}</h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-[var(--ink)] text-white' : 'bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]'
                          }`}>
                            {m.badge}
                          </span>
                          {m.isRecommended && (
                            <span className="text-[10px] font-medium text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full">
                              推荐引擎
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-[var(--ink-2)] font-medium mb-1 flex items-center gap-1">
                          <Sparkles size={11} className="text-[var(--ink-2)] shrink-0" />
                          {m.tag}
                        </p>

                        <p className="text-[12px] text-[var(--ink-2)] leading-relaxed">
                          {m.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] font-normal text-[var(--ink-2)]">
                          <span className="flex items-center gap-1">
                            <Zap size={11} className="text-[var(--ink-2)]" />
                            响应速度: <strong className="text-[var(--ink)] font-medium">{m.speed}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={11} className="text-[var(--ink-2)]" />
                            背调质量: <strong className="text-[var(--ink)] font-medium">{m.quality}</strong>
                          </span>
                        </div>
                      </div>

                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all mt-0.5
                        ${isSelected 
                          ? 'bg-[var(--ink)] border-[var(--ink)] text-white' 
                          : 'border-[var(--line)] text-transparent'}
                      `}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Note */}
            <div className="px-6 py-3.5 bg-[var(--surface-2)] border-t border-[var(--line)] flex items-center justify-between text-[12px] text-[var(--ink-2)]">
              <span className="flex items-center gap-1.5 font-normal">
                <ShieldCheck size={13} className="text-[var(--ink-2)]" />
                支持自动重试容灾
              </span>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="harmony-btn-primary px-4 py-1.5 text-[12px]"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
