// 全局：在所有页面添加“更多”按钮并移除移动菜单按钮（红框元素）
(function(){
	function createMoreMenu(container) {
		if (document.getElementById('more-menu')) return;
		const menu = document.createElement('div');
		menu.id = 'more-menu';
		menu.className = 'more-menu win11-card';
		menu.style.position = 'absolute';
		menu.style.right = '16px';
		menu.style.top = '56px';
		menu.style.display = 'none';
		menu.style.zIndex = '1000';
		menu.style.minWidth = '180px';
		menu.innerHTML = `
			<div style="padding:8px;">
				<a href="#class-info" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">班级介绍</a>
				<a href="Sidebar/notice.html" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">班级动态</a>
				<a href="Sidebar/Rules.html" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">班级规章</a>
				<a href="Sidebar/timetable.html" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">课程表</a>
				<a href="Sidebar/treasurebox.html" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">百宝箱</a>
				<a href="Sidebar/about.html" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">关于我们</a>
				<hr style="border:none;border-top:1px solid #eee;margin:8px 0;">
				<a href="#" id="theme-toggle" class="more-link" style="display:block;padding:6px 8px;color:#333;text-decoration:none;border-radius:4px;">黑暗模式</a>
			</div>
		`;
		// append to body so absolute positioning works across pages
		document.body.appendChild(menu);
	}

	function ensureMoreButton() {
		// remove any existing mobile menu toggle buttons (red-boxed)
		const mobileBtns = document.querySelectorAll('#mobile-menu-button');
		mobileBtns.forEach(b => b.remove());

		// find navbar actions container
		const actions = document.querySelector('.navbar-actions');
		if (!actions) return;

		// add more button if not present
		if (!document.getElementById('more-button')) {
			const btn = document.createElement('button');
			btn.id = 'more-button';
			btn.className = 'win11-btn-text more-btn';
			btn.setAttribute('aria-haspopup', 'true');
			btn.setAttribute('aria-expanded', 'false');
			btn.innerHTML = '更多 <i class="fas fa-caret-down" style="margin-left:6px;"></i>';
			actions.insertBefore(btn, actions.lastElementChild?.nextSibling || null);
		}

		createMoreMenu();

		// 主题切换逻辑：读取/保存到 localStorage，切换 root 上的 .dark 类，并更新菜单文字
		function updateThemeToggleLabel(isDark){
			const tbtn = document.getElementById('theme-toggle');
			if(!tbtn) return;
			tbtn.textContent = isDark ? '明亮模式' : '黑暗模式';
		}

		function applyTheme(isDark){
			const root = document.documentElement || document.body;
			if(isDark) root.classList.add('dark'); else root.classList.remove('dark');
			try{ localStorage.setItem('site-theme','' + (isDark ? 'dark' : 'light')); }catch(e){}
			updateThemeToggleLabel(isDark);
		}

		// 初始化主题：优先使用 localStorage，其次使用系统偏好
		try{
			const saved = localStorage.getItem('site-theme');
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			if(saved) applyTheme(saved === 'dark'); else applyTheme(prefersDark);
		}catch(e){ /* ignore */ }

		// 为菜单中的切换按钮绑事件
		const _themeToggleBtn = document.getElementById('theme-toggle');
		if(_themeToggleBtn){
			_themeToggleBtn.addEventListener('click', function(ev){ ev.preventDefault(); const isDark = document.documentElement.classList.contains('dark'); applyTheme(!isDark); if(moreMenu) moreMenu.style.display = 'none'; });
		}

		// init interactions
		const moreBtn = document.getElementById('more-button');
		const moreMenu = document.getElementById('more-menu');
		if (!moreBtn || !moreMenu) return;

		function openMenu(){ moreMenu.style.display = 'block'; moreBtn.setAttribute('aria-expanded','true'); }
		function closeMenu(){ moreMenu.style.display = 'none'; moreBtn.setAttribute('aria-expanded','false'); }

		moreBtn.addEventListener('click', function(e){ e.stopPropagation(); const isOpen = moreMenu.style.display === 'block'; if (isOpen) closeMenu(); else openMenu(); });
		moreMenu.addEventListener('click', function(e){ if (e.target.closest('a')) closeMenu(); });
		document.addEventListener('click', function(e){ if (!moreMenu.contains(e.target) && e.target !== moreBtn) closeMenu(); });
		document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureMoreButton); else ensureMoreButton();
})();
class SiteConfig{constructor(){this.config=null,this.loaded=!1,this.initPromise=this.init()}async init(){try{const e=await fetch("config/site-config.json");this.config=await e.json(),this.loaded=!0,window.dispatchEvent(new CustomEvent("site.config.loaded"))}catch(e){this.config={site:{name:"贯通2501班",title:"贯通2501班班级网站",description:"专业的语文积分管理与评估系统",uiStyle:"win11"},pages:{index:{title:"贯通2501班 - 首页",heroTitle:"欢迎来到贯通2501班"},about:{title:"关于贯通2501班",heroTitle:"了解我们的班级"},rules:{title:"班级规则",heroTitle:"班级管理规则"},notice:{title:"通知公告",heroTitle:"班级通知"},treasurebox:{title:"班级宝库",heroTitle:"学习资源"},classstyle:{title:"班级风采",heroTitle:"我们的风采"},article:{title:"文章详情"}},navigation:{home:"首页",about:"关于",rules:"规则",notice:"通知",treasurebox:"宝库",classstyle:"风采"},footer:{copyright:"© 2025 贯通2501班. 保留所有权利。",description:"专业的语文积分管理与评估系统，助力学习成长与团队协作。"}},this.loaded=!0,window.dispatchEvent(new CustomEvent("site.config.loaded"))}return Promise.resolve()}getConfig(){return this.config}getSiteInfo(){return this.config?.site||{}}getUIStyle(){return this.config?.site?.uiStyle||"win11"}getPageConfig(e){return this.config?.pages?.[e]||{}}getNavigationConfig(){return this.config?.navigation||{}}getFooterConfig(){return this.config?.footer||{}}applyPageConfig(e){if(!this.config)return;const t=this.getPageConfig(e),o=this.getSiteInfo();t.title&&(document.title=t.title);document.querySelectorAll(".site-name").forEach(e=>{o.name&&(e.textContent=o.name)});document.querySelectorAll(".hero-title, #page-title").forEach(e=>{t.heroTitle&&(e.textContent=t.heroTitle)});document.querySelectorAll(".hero-subtitle").forEach(e=>{t.heroSubtitle&&(e.textContent=t.heroSubtitle)});const i=this.getNavigationConfig(),n=document.querySelector(".nav-home");n&&i.home&&(n.textContent=i.home);const s=document.querySelector(".nav-about");s&&i.about&&(s.textContent=i.about);const c=document.querySelector(".nav-rules");c&&i.rules&&(c.textContent=i.rules);const r=document.querySelector(".nav-notice");r&&i.notice&&(r.textContent=i.notice);const l=document.querySelector(".nav-treasurebox");l&&i.treasurebox&&(l.textContent=i.treasurebox);const a=document.querySelector(".nav-classstyle");a&&i.classstyle&&(a.textContent=i.classstyle);const u=this.getFooterConfig(),d=document.querySelector(".footer-copyright");d&&u.copyright&&(d.textContent=u.copyright);const g=document.querySelector(".footer-description");g&&u.description&&(g.textContent=u.description)}}function logClassWebSiteASCII(){}const siteConfigInstance=new SiteConfig;window.siteConfig=siteConfigInstance,window.siteConfigLoaded=siteConfigInstance.initPromise,"undefined"!=typeof module&&void 0!==module.exports&&(module.exports=siteConfigInstance),document.addEventListener("DOMContentLoaded",()=>{logClassWebSiteASCII();const e=window.location.pathname,t=window.location.href;let o="index";e.includes("about")||t.includes("about")?o="about":e.includes("rules")||t.includes("Rules")?o="rules":e.includes("notice")||t.includes("notice")?o="notice":e.includes("treasurebox")||t.includes("treasurebox")?o="treasurebox":e.includes("classstyle")||t.includes("ClassStyle")?o="classstyle":(e.includes("article")||t.includes("article"))&&(o="article"),setTimeout(()=>{window.siteConfig.applyPageConfig(o)},100)});