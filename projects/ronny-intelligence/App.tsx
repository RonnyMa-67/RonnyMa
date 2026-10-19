import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LeadInput } from './components/LeadInput';
import { AnalysisTable } from './components/AnalysisTable';
import { StatsDashboard, DashboardFilter, matchDashboardFilter } from './components/StatsDashboard';
import { CRMView } from './components/CRMView';
import { Logo } from './components/Logo';
import { parseLeadTableText, recordsFromRows, deduplicateRecords } from './services/leadImport';
import { normalizeConclusion } from './services/leadRules';
import { analyzeLeads } from './services/geminiService';
import { initSupabase, fetchHistory, saveHistoryItem, clearAllHistory, saveAllHistory, isCloudMode, getSupabaseClient } from './services/dataService';
import { AnalysisResult, FileUpload, ContactInfo, FREE_MODELS, ConclusionStatus, LeadSourceType } from './types';
import { normalizeCountryName } from './utils/countryUtils';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Settings, X, Globe, Cloud, Loader2, Database, Zap, Sparkles, Cpu, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('duediligence_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('duediligence_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentResults, setCurrentResults] = useState<AnalysisResult[]>([]);
  const [analysisFilter, setAnalysisFilter] = useState<DashboardFilter | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('duediligence_selected_model') || 'gemini-3.8-flash';
  });

  useEffect(() => {
    localStorage.setItem('duediligence_selected_model', selectedModel);
  }, [selectedModel]);

  const activeModelInfo = FREE_MODELS.find(m => m.id === selectedModel) || FREE_MODELS[0];

  const [employees, setEmployees] = useState<string[]>(() => {
    const saved = localStorage.getItem('duediligence_employees');
    return saved ? JSON.parse(saved) : ['未分配', '张三', '李四', '王五', '赵六', '销售A组', '销售B组'];
  });

  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => localStorage.getItem('duediligence_api_base_url') || '');
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem('duediligence_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState<string>(() => localStorage.getItem('duediligence_supabase_key') || '');
  
  const [showSettings, setShowSettings] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  type AppTab = 'analysis' | 'exhibition' | 'meta_daily' | 'crm';
  const [activeTab, setActiveTab] = useState<AppTab>('analysis');
  const [hasUserKey, setHasUserKey] = useState(false);
  const [importSource, setImportSource] = useState<LeadSourceType>('pending_confirmation');
  const analysisRunning = useRef(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasUserKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setHasUserKey(hasKey);
    }
  };

  useEffect(() => {
    const success = initSupabase(supabaseUrl, supabaseKey);
    setCloudConnected(success);
    
    const loadData = async () => {
      setLoadingHistory(true);
      try {
        const data = await fetchHistory();
        setHistory(data.map(item => ({ ...item, conclusion: normalizeConclusion(item.conclusion) as ConclusionStatus }))); 
        setInitialLoadDone(true);
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadData();

    let subscription: any = null;
    if (success) {
      const client = getSupabaseClient();
      if (client) {
        subscription = client
          .channel('public:leads')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload: any) => {
            const newItem = payload.new.data;
            if (newItem) {
               setHistory(prev => {
                 if (prev.find(i => i.id === newItem.id)) return prev;
                 return [newItem, ...prev];
               });
            }
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload: any) => {
            const updatedItem = payload.new.data;
            if (updatedItem) {
               setHistory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
            }
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload: any) => {
            const deletedId = payload.old.id;
            setHistory(prev => prev.filter(item => item.id !== deletedId));
          })
          .subscribe();
      }
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (!isCloudMode() && initialLoadDone) {
      const timer = setTimeout(() => {
        saveAllHistory(history);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [history, initialLoadDone]);

  useEffect(() => {
    localStorage.setItem('duediligence_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('duediligence_api_base_url', apiBaseUrl);
    localStorage.setItem('duediligence_supabase_url', supabaseUrl);
    localStorage.setItem('duediligence_supabase_key', supabaseKey);
  }, [apiBaseUrl, supabaseUrl, supabaseKey]);

  const handleAnalyze = async (text: string, file: FileUpload | null, leadImage: FileUpload | null, tableRows?: Record<string, unknown>[]) => {
    if (analysisRunning.current || loadingHistory) return;
    analysisRunning.current = true;
    setIsAnalyzing(true);
    setError(null);
    setProgress({ current: 0, total: 0 }); 
    setCurrentResults([]); 
    setAnalysisFilter(null); 

    try {
      const parsed = leadImage ? undefined : tableRows ? recordsFromRows(tableRows, importSource) : parseLeadTableText(text, importSource);
      const records = parsed ? deduplicateRecords(parsed, history.map(item => item.metaLeadId || item.meta?.leadId || '').filter(Boolean)) : undefined;
      if (parsed && !records?.length) {
        setError('这批没有新线索，已跳过重复记录。');
        return;
      }
      const data = await analyzeLeads(text, file, apiBaseUrl, leadImage, selectedModel,
        (current, total) => setProgress({ current, total }), records, importSource);
      setCurrentResults(data);
      setHistory(prev => {
        const existing = new Set(prev.map(item => item.metaLeadId || item.meta?.leadId || item.id));
        return [...data.filter(item => !existing.has(item.metaLeadId || item.id)), ...prev];
      });
      // Persistence is separate from React's state updater, which may run more than once.
      for (const item of data) await saveHistoryItem(item);
      if (importSource === 'exhibition' || importSource === 'meta_daily') setActiveTab(importSource);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析过程中发生异常，请检查网络或配置。');
    } finally {
      analysisRunning.current = false;
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const clearHistory = async () => {
    await clearAllHistory();
    setHistory([]);
  };

  const updateLeadAssignment = async (id: string, employee: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, assignedTo: employee } : item));
    const target = history.find(i => i.id === id);
    if (target) {
       await saveHistoryItem({ ...target, assignedTo: employee });
    }
  };

  const handleAddEmployee = (name: string) => {
    if (name && !employees.includes(name)) {
      setEmployees(prev => [...prev, name]);
    }
  };

  const handleRemoveEmployee = (name: string) => {
    if (employees.length <= 1) {
      alert('至少需要保留一个员工姓名');
      return;
    }
    setEmployees(prev => prev.filter(e => e !== name));
  };

  const updateItem = async (id: string, updates: Partial<AnalysisResult>) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const target = history.find(i => i.id === id);
    if (target) {
      await saveHistoryItem({ ...target, ...updates });
    }
  };

  const handleBatchUpdateFollowUp = async (ids: string[], record: string) => {
    setHistory(prev => prev.map(item => ids.includes(item.id) ? { ...item, followUpRecord: record } : item));
    const updates = ids.map(id => {
       const item = history.find(i => i.id === id);
       return item ? { ...item, followUpRecord: record } : null;
    }).filter(Boolean) as AnalysisResult[];
    for (const item of updates) { await saveHistoryItem(item); }
  };
  
  const handleBatchAssign = async (ids: string[], employee: string) => {
    setHistory(prev => prev.map(item => ids.includes(item.id) ? { ...item, assignedTo: employee } : item));
    const updates = ids.map(id => {
       const item = history.find(i => i.id === id);
       return item ? { ...item, assignedTo: employee } : null;
    }).filter(Boolean) as AnalysisResult[];
    for (const item of updates) {
      await saveHistoryItem(item);
    }
  };

  const handleUpdateFollowUp = (id: string, record: string) => updateItem(id, { followUpRecord: record });
  
  const [tempApiBaseUrl, setTempApiBaseUrl] = useState(apiBaseUrl);
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseUrl);
  const [tempSupabaseKey, setTempSupabaseKey] = useState(supabaseKey);

  const handleSaveSettings = () => {
    setApiBaseUrl(tempApiBaseUrl);
    setSupabaseUrl(tempSupabaseUrl);
    setSupabaseKey(tempSupabaseKey);
    setShowSettings(false);
  };

  const handleBatchUpdateNote = async (ids: string[], note: string) => {
    setHistory(prev => prev.map(item => ids.includes(item.id) ? { ...item, note: note } : item));
    const updates = ids.map(id => {
       const item = history.find(i => i.id === id);
       return item ? { ...item, note: note } : null;
    }).filter(Boolean) as AnalysisResult[];
    for (const item of updates) { await saveHistoryItem(item); }
  };

  const handleUpdateNote = (id: string, note: string) => updateItem(id, { note: note });
  const handleUpdateContactInfo = (id: string, newContactInfo: ContactInfo) => updateItem(id, { contactInfo: newContactInfo });

  // 手动标记/修正线索来源（旧记录支持手动打标，不自动迁移）
  const handleUpdateSourceType = useCallback((id: string, sourceType: LeadSourceType) => {
    updateItem(id, { sourceType, sourceTagManuallySet: true });
  }, []);

  const handleBatchUpdateSourceType = async (ids: string[], sourceType: LeadSourceType) => {
    setHistory(prev => prev.map(item => ids.includes(item.id) ? { ...item, sourceType, sourceTagManuallySet: true } : item));
    const updates = ids.map(id => {
       const item = history.find(i => i.id === id);
       return item ? { ...item, sourceType, sourceTagManuallySet: true } : null;
    }).filter(Boolean) as AnalysisResult[];
    for (const item of updates) { await saveHistoryItem(item); }
  };

  // 各专区动态线索实时统计
  const exhibitionCount = useMemo(() => history.filter(i => i.sourceType === 'exhibition').length, [history]);
  const metaDailyCount = useMemo(() => history.filter(i => i.sourceType === 'meta_daily').length, [history]);

  // 客户线索分析结果联动筛选 (支持单点下钻与快速筛选侧栏多维组合)
  const displayedCurrentResults = React.useMemo(() => {
    if (!analysisFilter) return currentResults;
    return currentResults.filter(item => matchDashboardFilter(item, analysisFilter));
  }, [currentResults, analysisFilter]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] pb-16 font-sans relative transition-colors duration-200">
      
      {/* Header - Navigation Bar (沉浸通透空间质感 + 顶边微光流注光带) */}
      <header className="sticky top-0 z-50 w-full bg-[var(--surface)] backdrop-blur-[28px] border-b border-[var(--line)] shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-colors">
        <div className="h-[2px] w-full opacity-80" style={{ background: 'linear-gradient(90deg, var(--glow-1), var(--glow-2), var(--glow-3))' }} />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo onClick={() => setActiveTab('analysis')} size="md" />

            <button 
              onClick={() => setShowSettings(true)}
              className="hidden lg:inline-flex items-center gap-2 text-[12px] font-medium text-[var(--ink-2)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--line)] px-3 py-1 rounded-full cursor-pointer transition-all"
              title="点击查看与切换背调模型"
            >
              <Cpu size={12} className="text-[var(--glow-2)]" />
              <span className="text-[var(--ink)] font-semibold">{activeModelInfo.name}</span>
              <span className="text-[10px] bg-[var(--surface)] text-[var(--ink-2)] font-mono px-1.5 py-0.5 rounded-full border border-[var(--line)]">
                {activeModelInfo.badge}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-2 mr-1">
                {cloudConnected ? (
                   <span className="flex items-center gap-1.5 text-[12px] bg-[var(--surface-2)] text-[var(--ink)] px-3 py-1 rounded-full font-medium border border-[var(--line)]">
                     <span className="w-1.5 h-1.5 bg-[var(--glow-1)] rounded-full animate-pulse"></span>
                     云端就绪
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 text-[12px] bg-[var(--surface-2)] text-[var(--ink-2)] px-3 py-1 rounded-full font-normal border border-[var(--line)]">
                     <span className="w-1.5 h-1.5 bg-[var(--ink-3)] rounded-full"></span>
                     本地离线
                   </span>
                 )}
             </div>

            {/* PWA 客户端安装按钮 */}
            <PWAInstallButton />

            {/* 深浅双主题切换按钮 (次按钮样式 + 太阳/月亮无彩图标) */}
            <button
              onClick={toggleTheme}
              className="harmony-btn-secondary h-[36px] w-[36px] p-0 text-[var(--ink)]"
              title={theme === 'dark' ? '切换至浅色模式 (白天办公)' : '切换至深色模式 (沉浸光感)'}
            >
              {theme === 'dark' ? (
                <Sun size={15} className="text-[var(--ink)] transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={15} className="text-[var(--ink)] transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* API 额度配置 (统一采用次按钮样式) */}
            <button 
              onClick={handleOpenKeyDialog}
              className="harmony-btn-secondary h-[36px] text-[12px] font-medium"
              title="配置自有 API Key 以获取更高并发限额"
            >
              <Sparkles size={13} className="text-[var(--ink-2)]" />
              <span className="hidden sm:inline">{hasUserKey ? 'Key 已激活' : 'API 额度配置'}</span>
              <span className="sm:hidden">{hasUserKey ? 'Key已激活' : 'API配置'}</span>
            </button>

            {/* 系统设置按钮 (次按钮样式) */}
            <button 
              onClick={() => setShowSettings(true)}
              className="harmony-btn-secondary h-[36px] w-[36px] p-0 text-[var(--ink)] relative"
              title="系统设置"
            >
              <Settings size={15} strokeWidth={1.8} />
              {!supabaseUrl && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--glow-5)] rounded-full border border-[var(--bg)]"></span>}
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal (符合 HarmonyOS 7 规范的 Level 100 全屏弹窗层) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[12px] flex items-center justify-center z-[100] p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="elevation-float rounded-[20px] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-[14px]">
                <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center">
                  <Settings size={13} strokeWidth={2}/>
                </div>
                系统配置
              </h3>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              
              <div className="p-3.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                 <h4 className="text-[12px] font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                    <Cloud size={14} className="text-[var(--ink-2)]" />
                    Supabase 数据库同步 (选填)
                 </h4>
                 <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-medium text-[var(--ink-2)] mb-1">Project URL</label>
                        <input 
                            type="text" 
                            value={tempSupabaseUrl}
                            onChange={(e) => setTempSupabaseUrl(e.target.value)}
                            className="w-full text-[12px] p-2 border border-[var(--line)] rounded-[12px] bg-[var(--surface)] text-[var(--ink)] focus:border-[var(--glow-2)] outline-none transition-colors"
                            placeholder="https://xyz.supabase.co"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-[var(--ink-2)] mb-1">Anon / Service Key</label>
                        <input 
                            type="password" 
                            value={tempSupabaseKey}
                            onChange={(e) => setTempSupabaseKey(e.target.value)}
                            className="w-full text-[12px] p-2 border border-[var(--line)] rounded-[12px] bg-[var(--surface)] text-[var(--ink)] focus:border-[var(--glow-2)] outline-none transition-colors"
                        />
                    </div>
                 </div>
              </div>

              <div className="p-3.5 rounded-[16px] border border-[var(--line)] bg-[var(--surface-2)]">
                <label className="block text-[12px] font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
                  <Cpu size={14} className="text-[var(--ink-2)]"/>
                  分析引擎选择
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-[12px] p-2 border border-[var(--line)] rounded-[12px] bg-[var(--surface)] text-[var(--ink)] focus:border-[var(--glow-2)] outline-none cursor-pointer font-medium transition-colors"
                >
                  {FREE_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-[var(--surface-float)] text-[var(--ink)]">
                      {m.name} ({m.badge}) - {m.speed} / {m.quality}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--ink-3)] mt-2 leading-relaxed">
                  {activeModelInfo.description}
                </p>
              </div>

              <div className="p-3.5 rounded-[16px] border border-[var(--line)] bg-[var(--surface-2)]">
                <label className="block text-[12px] font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-[var(--ink-2)]"/>
                  API 反向代理网关 (可选)
                </label>
                <input 
                  type="text" 
                  value={tempApiBaseUrl}
                  onChange={(e) => setTempApiBaseUrl(e.target.value)}
                  placeholder="https://your-proxy.com"
                  className="w-full text-[12px] p-2 border border-[var(--line)] rounded-[12px] bg-[var(--surface)] text-[var(--ink)] focus:border-[var(--glow-2)] outline-none transition-colors"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="harmony-btn-primary px-6 py-2 text-[12px] h-[36px]"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 laptop-screen-container relative z-10">
        
        {/* Navigation Tabs (全胶囊高精分段控件：增加展会推广专区与日常 Meta 产品推广专区) */}
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="harmony-capsule-bg inline-flex items-center gap-1.5 p-1 backdrop-blur-[24px] flex-wrap justify-center">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`
                relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer
                ${activeTab === 'analysis' 
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' 
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'}
              `}
            >
              <Zap size={14} className={activeTab === 'analysis' ? 'text-[var(--glow-5)]' : 'text-[var(--ink-3)]'} />
              <span>线索录入与背调</span>
            </button>

            <button
              onClick={() => setActiveTab('exhibition')}
              className={`
                relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer
                ${activeTab === 'exhibition' 
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' 
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'}
              `}
            >
              <span>🏛️</span>
              <span>展会推广专区</span>
              <span className={`ml-0.5 text-[11px] px-2 py-0.2 rounded-full font-mono font-medium transition-colors ${
                activeTab === 'exhibition' 
                  ? 'bg-[var(--bg)] text-[var(--ink)]' 
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)]'
              }`}>
                {exhibitionCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('meta_daily')}
              className={`
                relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer
                ${activeTab === 'meta_daily' 
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' 
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'}
              `}
            >
              <span>📢</span>
              <span>日常 Meta 推广</span>
              <span className={`ml-0.5 text-[11px] px-2 py-0.2 rounded-full font-mono font-medium transition-colors ${
                activeTab === 'meta_daily' 
                  ? 'bg-[var(--bg)] text-[var(--ink)]' 
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)]'
              }`}>
                {metaDailyCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`
                relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer
                ${activeTab === 'crm' 
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' 
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'}
              `}
            >
              <Database size={14} className={activeTab === 'crm' ? 'text-[var(--glow-2)]' : 'text-[var(--ink-3)]'} />
              <span>客户资产总库</span>
              <span className={`ml-0.5 text-[11px] px-2 py-0.2 rounded-full font-mono font-medium transition-colors ${
                activeTab === 'crm' 
                  ? 'bg-[var(--bg)] text-[var(--ink)] opacity-90' 
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)]'
              }`}>
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'analysis' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="harmony-card rounded-[20px] p-4 flex flex-wrap items-center gap-3">
              <label htmlFor="import-source" className="text-[13px]">本次线索来源</label>
              <select id="import-source" value={importSource} disabled={isAnalyzing} onChange={e => setImportSource(e.target.value as LeadSourceType)} className="bg-[var(--surface)] rounded-lg p-2">
                <option value="pending_confirmation">自动识别 / 待确认</option><option value="exhibition">展会推广</option><option value="meta_daily">日常 Meta 产品推广</option><option value="general">通用背调</option>
              </select>
              <span className="text-[12px] text-[var(--ink-2)]">Meta 文件按表单来源识别；其他输入使用所选来源。</span>
            </div>
            <LeadInput 
              onAnalyze={handleAnalyze} 
              isAnalyzing={isAnalyzing || loadingHistory} 
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />

            {/* Progress Bar (气态质感) */}
            {isAnalyzing && progress && (
                <div className="harmony-card rounded-[20px] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--ink)] flex items-center justify-center text-[var(--bg)] shrink-0">
                       <Loader2 className="animate-spin" size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-[12px] font-medium text-[var(--ink)] mb-2">
                            <span className="flex items-center gap-2">
                              <Sparkles size={13} className="text-[var(--glow-2)]" />
                              正在全网深度背调客户资质与商业情报...
                            </span>
                            <span className="font-mono bg-[var(--ink)] text-[var(--bg)] px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                                进度 {progress.current} / {progress.total}
                            </span>
                        </div>
                        <div className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-full h-2 overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(76,155,255,0.6)]" 
                                style={{ 
                                  width: `${(progress.current / progress.total) * 100}%`,
                                  background: 'linear-gradient(90deg, var(--glow-2), var(--glow-1))'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
              <div className="harmony-card rounded-[20px] p-4 border border-[var(--danger)]/30 flex items-start gap-3.5 text-[var(--danger)]">
                <div className="bg-[var(--surface-2)] p-2 rounded-full text-[var(--danger)] border border-[var(--danger)]/30 shrink-0">
                   <Settings size={16} />
                </div>
                <div>
                  <h3 className="font-medium text-[13px] text-[var(--ink)]">核验中断</h3>
                  <p className="text-[12px] mt-0.5 text-[var(--danger)] leading-relaxed font-normal">{error}</p>
                </div>
              </div>
            )}

            {currentResults.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5 pl-1">
                   <div className="w-1.5 h-4 rounded-full bg-[var(--glow-2)] shadow-[0_0_8px_var(--glow-2)]" />
                   <h2 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">核验结果报告</h2>
                   <span className="text-[12px] text-[var(--ink-2)] font-medium font-mono bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                     共 {currentResults.length} 家目标企业
                   </span>
                </div>
                
                <StatsDashboard 
                  results={currentResults} 
                  activeFilter={analysisFilter}
                  onFilterChange={setAnalysisFilter}
                />
                <AnalysisTable 
                  results={displayedCurrentResults} 
                  mode="batch" 
                  employees={employees}
                  onUpdateAssignment={updateLeadAssignment}
                  onUpdateFollowUp={handleUpdateFollowUp}
                  onUpdateNote={handleUpdateNote}
                  onUpdateContactInfo={handleUpdateContactInfo}
                  onUpdateSourceType={handleUpdateSourceType}
                />
              </div>
            )}
          </div>
        )}

        {activeTab !== 'analysis' && (
          <>
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-40">
                 <div className="relative">
                    <div className="w-10 h-10 border-2 border-[var(--line)] border-t-[var(--glow-2)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Database size={15} className="text-[var(--glow-2)]"/>
                    </div>
                 </div>
                 <span className="text-[13px] font-normal text-[var(--ink-2)] mt-3">正在同步客户列表...</span>
              </div>
            ) : (
              <CRMView 
                key={`crm-view-${activeTab}`}
                history={history}
                onImportSource={(source) => { setImportSource(source); setActiveTab('analysis'); }} 
                employees={employees}
                initialSourceFilter={activeTab === 'exhibition' ? 'exhibition' : activeTab === 'meta_daily' ? 'meta_daily' : '全部'}
                onClearHistory={clearHistory} 
                onUpdateAssignment={updateLeadAssignment}
                onBatchAssign={handleBatchAssign}
                onUpdateFollowUp={handleUpdateFollowUp}
                onBatchUpdateFollowUp={handleBatchUpdateFollowUp}
                onBatchUpdateNote={handleBatchUpdateNote}
                onUpdateContactInfo={handleUpdateContactInfo}
                onUpdateNote={handleUpdateNote}
                onUpdateSourceType={handleUpdateSourceType}
                onBatchUpdateSourceType={handleBatchUpdateSourceType}
                onAddEmployee={handleAddEmployee}
                onRemoveEmployee={handleRemoveEmployee}
              />
            )}
          </>
        )}

      </main>

      {/* 离线状态检测指示器 */}
      <OfflineIndicator />
    </div>
  );
};

export default App;
