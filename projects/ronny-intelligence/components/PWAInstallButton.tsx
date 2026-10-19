import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Check, ExternalLink, Copy, X, Sparkles, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'desktop' | 'ios' | 'android'>(
    isIOS ? 'ios' : 'desktop'
  );
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return (
      <div 
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[12px] font-medium text-[var(--ink-2)]"
        title="当前正运行在独立桌面应用模式中"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--glow-1)]"></span>
        <span>已安装桌面端</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const currentUrl = window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenDirect = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className="harmony-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium"
        title="安装应用到桌面或手机主屏，像客户端一样随时打开"
      >
        <Download size={13} strokeWidth={2} />
        <span className="hidden sm:inline">添加到桌面</span>
        <span className="sm:hidden">安装</span>
      </button>

      {/* 安装引导弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[20px] elevation-float border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* 弹窗头部 */}
            <div className="px-5 py-4 bg-[var(--surface-2)] border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center">
                  <Laptop size={16} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ink)] text-[14px] flex items-center gap-1.5">
                    <span>添加应用到桌面 / 主屏幕</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)]">PWA 客户端</span>
                  </h3>
                  <p className="text-[12px] text-[var(--ink-2)]">一键启动独立窗口，告别浏览器标签限制</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* 如果是在 iframe 中，给出核心提示 */}
            {isInIframe && (
              <div className="mx-5 mt-4 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] text-[12px] text-[var(--ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles size={15} className="text-[var(--glow-2)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">提示：当前位于预览窗格中</span>
                    <p className="text-[11px] text-[var(--ink-2)] mt-0.5">浏览器限制了在内嵌预览中直接弹出安装。请点击右侧在新窗口打开即可直接安装！</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenDirect}
                  className="harmony-btn-cta shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1 text-[12px] h-[34px]"
                >
                  <ExternalLink size={12} />
                  <span>在新标签页打开</span>
                </button>
              </div>
            )}

            {/* 平台分栏切换 */}
            <div className="px-5 pt-4">
              <div className="harmony-capsule-bg flex p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                    activeTab === 'desktop'
                      ? 'bg-[var(--ink)] text-[var(--bg)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Monitor size={13} />
                  <span>电脑端 (Windows/Mac)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                    activeTab === 'ios'
                      ? 'bg-[var(--ink)] text-[var(--bg)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>苹果 (iOS Safari)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                    activeTab === 'android'
                      ? 'bg-[var(--ink)] text-[var(--bg)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>安卓 (Chrome)</span>
                </button>
              </div>
            </div>

            {/* 分栏步骤指引 */}
            <div className="p-5 overflow-y-auto space-y-3 text-[12px]">
              {activeTab === 'desktop' && (
                <div className="space-y-2.5">
                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">地址栏一键安装（Chrome / Edge）</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        查看浏览器顶部网址栏右侧，通常会显示一个「<span className="font-medium text-[var(--ink)]">安装应用 ⊕</span>」或「<span className="font-medium text-[var(--ink)]">计算机/下载</span>」小图标，直接点击即可一键保存到桌面。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">通过浏览器菜单安装</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        点击浏览器右上角三个点「<span className="font-medium text-[var(--ink)]">⋮</span>」菜单 → 选择「<span className="font-medium text-[var(--ink)]">保存并共享</span>」或「<span className="font-medium text-[var(--ink)]">更多工具</span>」 → 点击「<span className="font-medium text-[var(--ink)]">安装 Ronny背调</span>」或「<span className="font-medium text-[var(--ink)]">创建快捷方式</span>（勾选作为窗口打开）」。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="space-y-2.5">
                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">必须在 Safari 浏览器中打开</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        由于苹果 iOS 系统限制，微信内或第三方 App 内置网页无法直接添加桌面，请复制网址并在系统自带的 Safari 浏览器中访问。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">点击底部「分享」按钮</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        点击 Safari 底部工具栏正中间的「分享」图标（方形带向上箭头 ⎋）。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">选择「添加到主屏幕」</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        向下滑动菜单找到并点击「<span className="font-medium text-[var(--ink)]">添加到主屏幕 (+)</span>」，右上角点击「添加」即可！
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="space-y-2.5">
                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">在 Chrome 浏览器中打开</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        点击右上方「<span className="font-medium text-[var(--ink)]">⋮</span>」菜单设置按钮。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-medium text-[11px] shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--ink)] mb-0.5">点击「安装应用」或「添加到主屏幕」</h4>
                      <p className="text-[var(--ink-2)] leading-relaxed">
                        在弹出列表中选择「<span className="font-medium text-[var(--ink)]">安装应用</span>」或「<span className="font-medium text-[var(--ink)]">添加到主屏幕</span>」，确认后即可生成桌面专属应用图标。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 弹窗底部操作条 */}
            <div className="p-4 bg-[var(--surface-2)] border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="harmony-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? '已复制网址' : '复制网址'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDirect}
                  className="harmony-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium"
                  title="在新标签页中打开独立网页"
                >
                  <ExternalLink size={13} />
                  <span>独立窗口打开</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="harmony-btn-primary px-5 py-1.5 text-[12px] h-[36px]"
              >
                我知道了
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
export default PWAInstallButton;
