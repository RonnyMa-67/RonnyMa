(() => {
  'use strict';
  const english = {
    skip:'Skip to content',navSkills:'AI Skills',navProjects:'Tools',navNotes:'Updates',navAbout:'About',
    hello:'👋 hey, I’m Ronny',headline:'Too many tabs open.<br>Still making new things.',
    intro:'I work in foreign trade and tinker with AI. Here you’ll find Skills and tools for customer research, buyer discovery, and Meta marketing.',
    browse:'Open the Skill drawer ↘',meet:'Meet the person 👀',tiny:'🫠 Saving time has become quite a time-consuming hobby.',
    portrait:'🌏 Foreign-trade operations<br>🧪 AI experiments in progress',sticker:'Still growing.<br>Taking my time 🌱',avatarAlt:'Ronny’s line-art avatar with glasses and wavy hair',
    status:'Foreign trade · B2B · AI Skills',statusRight:'A little at a time. / since 2026',
    skillsTitle:'AI Skills <span>📦</span>',skillsDesc:'Lead research, buyer discovery, and Meta marketing. Pick one for your current task.',allDownloads:'All downloads ↗',
    scoutType:'🔎 Customer research',scoutQuestion:'“We have the inquiry.<br>Who’s behind it?”',scoutDesc:'Start with the customer’s original request. Research the company, website, and public contacts. Put the findings, commercial fit, and a useful next step into an A–J sheet.',
    demo:'Try the demo ↗',read:'Read more →',demoNote:'Demo customers are fictional. Live research requires the Skill in an AI host with browsing.',previewAlt:'Preview of the Ronny Scout customer workbench',previewCaption:'Customer details · Dashboard · Original leads ↗',
    buyerQuestion:'The product is ready. Where are the right buyers?',buyerDesc:'Start with your product, images, and target market. Find potential companies, with a clear reason each one belongs on the list.',
    metaQuestion:'The ad is out. What happens next?',metaDesc:'Connect creative, audiences, forms, and incoming messages. Make sure the attention has somewhere useful to go.',zip:'Download ZIP ↓',
    installTitle:'🚀 New to Skills? A quick starting point',installBody:'Download the matching ZIP, extract it, and keep the folder structure when installing in a Skills-compatible AI host. Current research needs host browsing. The Skill itself does not require a separate developer API key.',installLink:'Installation and downloads →',
    projectsTitle:'Tools & projects <span>🧪</span>',projectsDesc:'Local tools, frontend experiments, and cloud prototypes. Each has its status marked.',
    intelligenceDesc:'A frontend prototype for bringing lead sources and customer information together.',frontend:'Frontend prototype',leadscopeDesc:'Import, assign, and follow up. A local browser workbench for leads.',localTool:'Local tool',crmTitle:'Trade CRM',crmDesc:'Customer records and team follow-up. A little WeChat cloud-development experiment.',cloudProto:'Cloud prototype',
    notesTitle:'Updates & loose thoughts.',notesBody:'Customer development always leaves another question. Found the company — does the product fit? Set up the ad — who handles the messages? I’m turning these steps into Skills, starting with the work in front of me. Maybe they’ll help someone else too.',noteWish:'Hoping AI learns more about the business,<br>so I can explain a little less. 🫠',
    updatesTitle:'📝 Little updates',update1:'Separate packages for all three Skills, a feedback form, and a fresh look in Chinese and English 📦',update2:'Shared B2B Customer Scout and Meta Promotion Ops 🌱',update3:'Added Scout’s sheet, installation guide, and demo 🔎',changelog:'Browse the changelog →',
    aboutTitle:'About me <span>👋</span>',aboutBody:'I’m Ronny. I work in foreign-trade operations and B2B digital marketing, with experience in Alibaba.com operations, commercial-equipment exports, and overseas customer development.',aboutSide:'I see a repetitive task and wonder if I can save some time. Then give myself a few more things to build.',now:'NOW',nowValue:'Commercial-equipment exports · Trade operations · B2B',before:'BEFORE',beforeValue:'Alibaba.com · Commercial kitchen equipment',school:'EDUCATION',schoolValue:'Zhejiang University of Technology · Class of 2023',
    guestTitle:'Tried something? Drop by and say hi.',guestBody:'What helped, what got stuck, what could be better. Happy to hear all of it 😂',guestCta:'Leave a note →',guestNote:'Feedback is public and optional. Please keep real customer data, private contacts, and internal files out of it.',
    footer:'🌈 A little at a time. See you around.',source:'Source on GitHub ↗'
  };
  const chinese = {};
  document.querySelectorAll('[data-i18n]').forEach(el => { chinese[el.dataset.i18n] = el.innerHTML; });
  const chineseAlt = {};
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { chineseAlt[el.dataset.i18nAlt] = el.alt; });
  let language = 'zh';
  const params = new URLSearchParams(location.search);
  let saved;
  try { saved = localStorage.getItem('ronny-corner-language'); } catch (_) { /* local copies may disallow storage */ }
  const selected = params.get('lang');
  function apply(lang) {
    language = lang === 'en' ? 'en' : 'zh';
    const dict = language === 'en' ? english : chinese;
    document.querySelectorAll('[data-i18n]').forEach(el => { const text = dict[el.dataset.i18n]; if (text !== undefined) el.innerHTML = text; });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = (language === 'en' ? english : chineseAlt)[el.dataset.i18nAlt]; });
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'Ronny’s little corner · Trade, AI & side quests' : 'Ronny 的互联网小角落 · 外贸与 AI 碎碎念';
    document.querySelector('meta[name="description"]').content = language === 'en' ? 'Ronny’s little corner: foreign trade, B2B customer research, AI Skills, and projects still growing.' : 'Ronny 的互联网小角落：外贸运营、B2B 客户研究、AI Skills 和一些还在长的小项目。';
    document.querySelectorAll('[data-doc]').forEach(el => { el.href = 'https://github.com/RonnyMa-67/RonnyMa/blob/main/' + el.dataset.doc + '/README' + (language === 'en' ? '.en' : '') + '.md'; });
    document.getElementById('changelog').href = 'https://github.com/RonnyMa-67/RonnyMa/blob/main/skills/CHANGELOG' + (language === 'en' ? '.en' : '') + '.md';
    const button = document.getElementById('language');
    button.textContent = language === 'en' ? '中' : 'EN';
    button.setAttribute('aria-label', language === 'en' ? '切换为中文' : 'Switch to English');
    try { localStorage.setItem('ronny-corner-language',language); } catch (_) { /* Language still works without storage. */ }
  }
  apply(selected === 'en' || selected === 'zh' ? selected : saved);
  document.getElementById('language').addEventListener('click', () => {
    apply(language === 'en' ? 'zh' : 'en');
    const url = new URL(location.href); url.searchParams.set('lang', language);
    try { history.replaceState(null, '', url); } catch (_) { /* file:// previews still switch language. */ }
  });
})();
