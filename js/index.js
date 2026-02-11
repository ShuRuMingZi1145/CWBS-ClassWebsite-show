// 优化后的 index.js：更清晰的结构与稳健的 Markdown 加载与渲染

function animateNumbers() {
  document.querySelectorAll(".stat-number").forEach((el) => {
    const target = +el.dataset.target;
    if (!target) return;
    const step = target / 100;
    let cur = 0;
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) {
        cur = target;
        clearInterval(id);
      }
      el.textContent = target > 1000 ? Math.floor(cur).toLocaleString() : Math.floor(cur);
    }, 20);
  });
}

function initializePage() {
  if (typeof AOS !== "undefined") AOS.init({ duration: 800, easing: "ease-in-out", once: true, offset: 100 });

  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("back-to-top");

  if (navbar && backToTop) {
    window.addEventListener("scroll", () => {
      const style = document.body.classList.contains("win10") ? "win10" : "win11";
      if (window.scrollY > 50) {
        navbar.classList.add(`${style}-shadow-md`);
        navbar.classList.remove(`${style}-shadow-sm`);
      } else {
        navbar.classList.remove(`${style}-shadow-md`);
        navbar.classList.add(`${style}-shadow-sm`);
      }

      if (window.scrollY > 300) {
        backToTop.classList.remove("opacity-0", "invisible");
        backToTop.classList.add("opacity-100", "visible");
      } else {
        backToTop.classList.add("opacity-0", "invisible");
        backToTop.classList.remove("opacity-100", "visible");
      }
    });

    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const mobileBtn = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileBtn && mobileMenu) mobileBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));

  animateNumbers();
}

window.addEventListener("theme.render.ready", () => { initializePage(); loadMarkdownArticles(); });
setTimeout(() => {
  if (!document.body.classList.contains("win10") && !document.body.classList.contains("win11")) {
    const ui = window.siteConfig?.getUIStyle?.() || "win11";
    document.body.classList.add(ui);
    initializePage();
    loadMarkdownArticles();
  }
}, 3000);

let notifications = [];

async function parseMarkdownArticle(filename) {
  try {
    const resp = await fetch(`article/md/${filename}`);
    if (!resp.ok) return null;
    const text = await resp.text();
    const lines = text.split(/\r?\n/);

    let title = filename.replace(/\.md$/i, "");
    let date = "";

    for (const line of lines) {
      if (line.startsWith("# ")) title = line.slice(2).trim();
      else if (line.includes("发布日期：")) date = line.replace(/.*发布日期：/, "").replace(/^>\s*/, "").trim();
    }

    const lower = title.toLowerCase();
    let level = 1;
    if (lower.includes("分数") || lower.includes("成绩")) level = 2;
    else if (lower.includes("活动") || lower.includes("表彰") || lower.includes("运动会")) level = 3;

    return {
      id: filename.replace(/\.md$/i, ""),
      title,
      date,
      level,
      path: `article/notice-template.html?md=md/${filename}`,
    };
  } catch (err) {
    console.warn('parseMarkdownArticle error', err);
    return null;
  }
}

async function loadMarkdownArticles() {
  try {
    let files = [];
    try {
      const resp = await fetch("config/article.json");
      if (!resp.ok) throw new Error("Failed to fetch article.json");
      const cfg = await resp.json();
      files = cfg.articleFiles || [];
    } catch (err) {
      files = ["2026010610.md"];
    }

    const parsed = await Promise.all(files.map((f) => parseMarkdownArticle(f)));
    const articles = parsed.filter(Boolean);

    articles.sort((a, b) => {
      const parseDate = (d) => {
        if (!d) return 0;
        try { return new Date(d.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "")).getTime(); }
        catch { return new Date(d).getTime() || 0; }
      };
      return parseDate(b.date) - parseDate(a.date);
    });

    notifications = articles;
    renderNotifications();
  } catch (err) {
    console.error('loadMarkdownArticles error', err);
    notifications = [
      { title: "关于2025-2026学年秋季运动会的通知", date: "2025-10-06", level: 3, path: "article/notice-template.html?md=md/202510061035.md" },
      { title: "25-26 学年九上第一次质量检测（语文）统分通知", date: "2025-10-12", level: 2, path: "article/notice-template.html?md=md/202510122130.md" }
    ];
    renderNotifications();
  }
}

function getLevelMeta(level) {
  const map = {
    1: { icon: "fa-file-text", color: "text-blue-500 bg-blue-100" },
    2: { icon: "fa-file-alt", color: "text-green-500 bg-green-100" },
    3: { icon: "fa-star", color: "text-yellow-500 bg-yellow-100" },
  };
  return map[level] || map[1];
}

function renderNotifications() {
  const container = document.getElementById("notifications-container");
  if (!container) return;

  container.innerHTML = "";
  const list = [...notifications].slice(0, 6);
  const ui = document.body.classList.contains("win10") ? "win10" : "win11";

  list.forEach((item, i) => {
    const meta = getLevelMeta(item.level);
    const card = document.createElement("div");
    card.className = ui === "win10" ? "notification-card" : "win11-card rounded-2xl p-6 card-hover glass-card";
    card.setAttribute("data-aos", "fade-up");
    card.setAttribute("data-aos-delay", String(100 * i));

    if (ui === "win10") {
      card.innerHTML = `
        <h3 class="notification-title">${item.title}</h3>
        <span class="notification-date">${item.date}</span>
        <div class="notification-content"><i class="fas ${meta.icon}"></i></div>
        <a href="${item.path}" class="notification-link">点击查看</a>
      `;
    } else {
      card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center mr-4"><i class="fas ${meta.icon}"></i></div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">${item.title}</h3>
              <p class="text-sm text-gray-500 mt-1">${item.date}</p>
            </div>
          </div>
        </div>
        <a href="${item.path}" class="inline-flex items-center text-primary hover:text-primary/80 font-medium">点击查看 <i class="fas fa-arrow-right ml-2"></i></a>
      `;
    }

    container.appendChild(card);
  });
}
