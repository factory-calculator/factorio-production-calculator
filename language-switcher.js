(() => {
  "use strict";
  const path = window.location.pathname;
  const locale = path.startsWith("/en/") ? "en" : path.startsWith("/zh-CN/") ? "zh-CN" : "ja";
  let page = "home";
  if (/calculator-space-age\\.html$/.test(path)) page = "space";
  else if (/calculator\\.html$/.test(path)) page = "calculator";
  else if (/guide\\.html$/.test(path)) page = "guide";
  else if (/updates\\.html$/.test(path)) page = "updates";
  if (locale === "ja" && page === "calculator" &&
      document.querySelector('button.tab[data-page="space"][aria-selected="true"]')) page = "space";

  const destinations = {
    ja: { home: "/", calculator: "/calculator.html", space: "/calculator.html#space", guide: "/guide.html", updates: "/updates.html" },
    en: { home: "/en/", calculator: "/en/calculator.html", space: "/en/calculator-space-age.html", guide: "/en/guide.html", updates: "/en/updates.html" },
    "zh-CN": { home: "/zh-CN/", calculator: "/zh-CN/calculator.html", space: "/zh-CN/calculator-space-age.html", guide: "/zh-CN/", updates: "/zh-CN/" }
  };
  const names = { ja: "日本語", en: "English", "zh-CN": "简体中文" };
  const host = document.querySelector("header .nav") || document.querySelector("header") || document.body;
  if (!host || document.querySelector(".site-language-picker")) return;

  const wrapper = document.createElement("label");
  wrapper.className = "site-language-picker";
  wrapper.setAttribute("aria-label", "Language");
  const caption = document.createElement("span");
  caption.textContent = locale === "ja" ? "言語" : locale === "zh-CN" ? "语言" : "Language";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Select language");
  select.title = "Select language";
  for (const key of ["ja", "en", "zh-CN"]) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = names[key];
    option.selected = key === locale;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    window.location.href = destinations[select.value][page];
  });
  wrapper.append(caption, select);
  host.appendChild(wrapper);

  const style = document.createElement("style");
  style.textContent = `
    .site-language-picker{display:inline-flex;align-items:center;gap:7px;margin-left:auto;flex:0 0 auto;color:inherit;font:600 12px/1.3 system-ui,-apple-system,sans-serif;white-space:nowrap}
    .site-language-picker select{min-height:34px;max-width:150px;padding:6px 28px 6px 10px;border:1px solid #687781;border-radius:5px;background:#202a30;color:inherit;font:inherit;cursor:pointer}
    .site-language-picker select:focus-visible{outline:2px solid #e2a14b;outline-offset:2px}
    @media(max-width:600px){.site-language-picker{margin-left:0}.site-language-picker select{max-width:135px}}
  `;
  document.head.appendChild(style);
})();
