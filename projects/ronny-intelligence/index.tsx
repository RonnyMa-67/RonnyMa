
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// 注册 PWA Service Worker 确保离线缓存与桌面端可安装性
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA 有新版本可用');
  },
  onOfflineReady() {
    console.log('PWA 已就绪，支持离线运行');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
