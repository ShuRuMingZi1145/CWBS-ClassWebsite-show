// 优化与重构后的版本：更清晰的变量命名、错误处理、并发解析与更稳健的日期解析
let notifications = [];

async function parseMarkdownArticle(filename) {
	try {
		const resp = await fetch(`../article/md/${filename}`);
		if (!resp.ok) return null;
		const text = await resp.text();
		const lines = text.split(/\r?\n/);

		let title = filename.replace(/\.md$/i, "");
		let date = "";
		let author = "JGL STUDIO";
		let level = 1; // 1: 普通, 2: 成绩/分数, 3: 活动/表彰

		// 提取标题、日期、发布人
		for (const line of lines) {
			if (line.startsWith("# ")) {
				title = line.slice(2).trim();
			} else if (line.includes("发布日期：")) {
				date = line.replace(/.*发布日期：/, "").replace(/^>\s*/, "").trim();
			} else if (line.includes("发布人：")) {
				author = line.replace(/.*发布人：/, "").replace(/^>\s*/, "").trim();
			}
		}

		// 生成简短摘要（提取正文中非标题/引用的首段，限制长度）
		let snippet = "";
		for (const line of lines) {
			if (
				!line.startsWith("#") &&
				!line.startsWith(">") &&
				line.trim() !== "---" &&
				line.trim() !== ""
			) {
				snippet += (snippet ? " " : "") + line.trim();
				if (snippet.length > 80) break;
			}
		}
		snippet = (snippet || "").trim();
		if (snippet.length > 0) snippet = snippet + "...";

		// 根据标题关键词确定类型
		const lowerTitle = title.toLowerCase();
		if (lowerTitle.includes("分数") || lowerTitle.includes("成绩")) level = 2;
		else if (lowerTitle.includes("活动") || lowerTitle.includes("表彰")) level = 3;

		return {
			id: filename.replace(/\.md$/i, ""),
			title,
			content: snippet,
			date,
			level,
			author,
		};
	} catch (err) {
		console.warn("parseMarkdownArticle error:", err);
		return null;
	}
}

async function loadMarkdownArticles() {
	try {
		let files = [];
		try {
			const resp = await fetch("../config/article.json");
			if (!resp.ok) throw new Error("Failed to fetch article.json");
			const cfg = await resp.json();
			files = cfg.articleFiles || [];
		} catch (err) {
			// fallback hardcoded list
			files = ["2026010601"];
		}

		// 并发解析所有 markdown 文件
		const parsed = await Promise.all(files.map((f) => parseMarkdownArticle(f)));
		const articles = parsed.filter(Boolean);

		// 按日期降序排序（尝试解析中文日期格式）
		articles.sort((a, b) => {
			const parse = (d) => {
				if (!d) return 0;
				try {
					return new Date(d.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "")).getTime();
				} catch (e) {
					return new Date(d).getTime() || 0;
				}
			};
			return parse(b.date) - parse(a.date);
		});

		notifications = articles;
		return articles;
	} catch (err) {
		console.error("loadMarkdownArticles error:", err);
		return [];
	}
}

function getLevelMetadata(level) {
	const map = {
		1: { name: "普通通知", icon: "fa-file-text", color: "blue" },
		2: { name: "报告/公示", icon: "fa-file-alt", color: "green" },
		3: { name: "活动/表彰", icon: "fa-star", color: "yellow" },
	};
	return map[level] || map[1];
}

function sortByDateDesc(a, b) {
	const pa = new Date(a.date.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "")).getTime() || 0;
	const pb = new Date(b.date.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "")).getTime() || 0;
	return pb - pa;
}

function renderNotifications(filter = "all") {
	const container = document.getElementById("notifications-container");
	if (!container) return;

	const isWin10 = document.body.classList.contains("win10");
	const list = notifications.filter((it) => filter === "all" || it.level.toString() === filter);
	list.sort(sortByDateDesc);

	container.innerHTML = "";
	list.forEach((item, idx) => {
		const meta = getLevelMetadata(item.level);
		const card = document.createElement("div");
		const baseClass = isWin10 ? "notification-card" : "notice-card";
		card.className = `${baseClass} ${isWin10 ? `priority-${item.level}` : ""}`;
		card.setAttribute("data-aos", "fade-up");
		card.setAttribute("data-aos-delay", String(100 * idx));

		card.innerHTML = `
			<div class="flex items-start justify-between mb-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: var(--win11-${meta.color}-light-bg, rgba(0, 120, 212, 0.1));">
						<i class="fas ${meta.icon}" style="color: var(--win11-${meta.color}, var(--win11-primary));"></i>
					</div>
					<div>
						<h3 class="text-lg font-semibold" style="color: var(--win11-text-primary);">${item.title}</h3>
						<div class="flex items-center space-x-2 text-sm" style="color: var(--win11-text-secondary);">
							<span>${item.author}</span>
							<span>•</span>
							<span>${item.date}</span>
						</div>
					</div>
				</div>
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style="background-color: var(--win11-${meta.color}-light-bg, rgba(0, 120, 212, 0.1)); color: var(--win11-${meta.color}, var(--win11-primary));">
					${meta.name}
				</span>
			</div>
			<p class="mb-4 leading-relaxed" style="color: var(--win11-text-primary);">${item.content}</p>
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center space-x-4"></div>
				<button class="font-medium transition-colors duration-200 px-4 py-2 rounded" style="background-color: var(--win11-primary); color: var(--win11-text-white);" onclick="openArticle('${item.id}')">
					查看详情 <i class="fas fa-arrow-right ml-1"></i>
				</button>
			</div>
		`;

		container.appendChild(card);
	});

	updateStatistics(list.length);
}

function updateStatistics(count) {
	const el = document.getElementById("notification-count");
	if (el) animateNumber(el, parseInt(el.textContent) || 0, count);
}

function animateNumber(el, from, to, duration = 500) {
	const start = performance.now();
	requestAnimationFrame(function step(ts) {
		const t = Math.min((ts - start) / duration, 1);
		const eased = 1 - Math.pow(1 - t, 4);
		el.textContent = String(Math.floor(from + (to - from) * eased));
		if (t < 1) requestAnimationFrame(step);
	});
}

function viewNotificationDetail(id) {
	const item = notifications.find((n) => n.id === id);
	if (!item) return;
	alert(`通知详情：\n标题：${item.title}\n内容：${item.content}\n日期：${item.date}\n发布人：${item.author}`);
}

function openArticle(id) {
	// 保持和原来相同的跳转逻辑
	window.location.href = `../article/notice-template.html?md=md/${id}.md`;
}

async function initNoticePage() {
	if (typeof AOS !== "undefined") AOS.init({ duration: 800, once: true, offset: 100 });
	await loadMarkdownArticles();

	const filterBtns = document.querySelectorAll(".filter-btn");
	filterBtns.forEach((btn) => {
		const filter = btn.getAttribute("data-filter");
		let colorClass = "primary";
		let textClass = "text-primary/80";
		let bgClass = "bg-primary/10";
		if (filter === "1") {
			colorClass = "blue"; textClass = "text-blue-700"; bgClass = "bg-blue-100";
		} else if (filter === "2") {
			colorClass = "green"; textClass = "text-green-700"; bgClass = "bg-green-100";
		} else if (filter === "3") {
			colorClass = "yellow"; textClass = "text-yellow-700"; bgClass = "bg-yellow-100";
		}

		btn.classList.add(textClass, bgClass, "transition-all", "duration-300");
		btn.classList.remove("bg-gray-200", "text-gray-700");
		btn.addEventListener("click", function () {
			// 恢复其他按钮样式
			filterBtns.forEach((b) => {
				const f = b.getAttribute("data-filter");
				let cc = "primary", tc = "text-primary/80", bc = "bg-primary/10";
				if (f === "1") { cc = "blue"; tc = "text-blue-700"; bc = "bg-blue-100"; }
				else if (f === "2") { cc = "green"; tc = "text-green-700"; bc = "bg-green-100"; }
				else if (f === "3") { cc = "yellow"; tc = "text-yellow-700"; bc = "bg-yellow-100"; }
				b.classList.remove(`bg-${cc}`, "text-white");
				b.classList.add(tc, bc);
			});

			this.classList.remove(textClass, bgClass);
			this.classList.add(`bg-${colorClass}`, "text-white");
			renderNotifications(filter);
		});
	});

	renderNotifications("all");
}

function openArticleModal() {}
function closeArticleModal() {}

document.addEventListener("DOMContentLoaded", function () {
	if (document.body.classList.contains("theme-rendering")) {
		window.addEventListener("sidebar.theme.render.ready", function () { initNoticePage(); });
	} else {
		initNoticePage();
	}
});