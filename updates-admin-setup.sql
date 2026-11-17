-- Run this once in Supabase SQL Editor.
create table if not exists public.site_updates (
  id uuid primary key default gen_random_uuid(),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ja jsonb not null default '{}'::jsonb,
  en jsonb not null default '{}'::jsonb,
  zh jsonb not null default '{}'::jsonb
);
alter table public.site_updates enable row level security;
grant select on public.site_updates to anon, authenticated;
grant insert, update, delete on public.site_updates to authenticated;
drop policy if exists "Anyone can read published updates" on public.site_updates;
create policy "Anyone can read published updates"
on public.site_updates for select to anon, authenticated
using (published = true);
drop policy if exists "Admins can read all updates" on public.site_updates;
create policy "Admins can read all updates"
on public.site_updates for select to authenticated
using (public.is_site_admin());
drop policy if exists "Admins can insert updates" on public.site_updates;
create policy "Admins can insert updates"
on public.site_updates for insert to authenticated
with check (public.is_site_admin());
drop policy if exists "Admins can update updates" on public.site_updates;
create policy "Admins can update updates"
on public.site_updates for update to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());
drop policy if exists "Admins can delete updates" on public.site_updates;
create policy "Admins can delete updates"
on public.site_updates for delete to authenticated
using (public.is_site_admin());

-- Import the five existing changelog entries so they can also be edited in the admin page.
insert into public.site_updates (published, ja, en, zh) values
(true,
 '{"title":"多言語ページのレイアウトと切り替えを改善","date":"2026-11-17","category":"MULTILINGUAL / UI","items":["英語版・中国語版の計算機に共通トップバーを追加し、通常版とSpace Age版の移動をわかりやすく改善。","言語切り替えを各ページに対応させ、切り替え後も同じ種類のページを開けるように修正。","英語版・中国語版のガイドと更新履歴を日本語版に近いレイアウトに統一。","中国語版のガイド・更新履歴を新設し、トップページからのリンクとサイトマップを更新。","中国語版計算機の表示文言を追加翻訳。"]}'::jsonb,
 '{"title":"Improved multilingual layouts and navigation","date":"2026-11-17","category":"MULTILINGUAL / UI","items":["Added a shared top navigation bar to the English and Chinese calculators, making it easier to switch between Base Game and Space Age.","Fixed language switching so it opens the equivalent page in the selected language.","Aligned the English and Chinese guide and changelog layouts more closely with the Japanese pages.","Added Chinese guide and changelog pages, and updated the Chinese home-page links and sitemap.","Added more Chinese translations for calculator interface labels."]}'::jsonb,
 '{"title":"改进多语言页面布局与导航","date":"2026-11-17","category":"MULTILINGUAL / UI","items":["为英文版和中文版计算器添加统一的顶部导航栏，方便切换基础游戏版与太空时代版。","修复语言切换功能，切换后会打开对应语言的同类页面。","统一英文版和中文版使用指南、更新记录的页面布局，使其更接近日文版。","新增中文版使用指南和更新记录，并更新中文版首页链接与站点地图。","补充翻译了更多计算器界面文字。"]}'::jsonb),
(true,
 '{"title":"保存機能の説明を改善","date":"2026-11-11","category":"GUIDE / TRANSPARENCY","items":["生産計画の自動保存内容と保存先をガイドに追記。","通常版・Space Age版の保存が別々であること、端末間同期がないことを明記。"]}'::jsonb,
 '{"title":"Clarified automatic saving","date":"2026-11-11","category":"GUIDE / TRANSPARENCY","items":["Documented what production-plan data is saved and where it is stored.","Clarified separate saves for each mode and the lack of cross-device sync."]}'::jsonb,
 '{"title":"完善自动保存功能说明","date":"2026-11-11","category":"GUIDE / TRANSPARENCY","items":["在使用指南中补充生产计划自动保存的数据内容和保存位置。","明确基础游戏版与太空时代版分别保存，且不支持跨设备同步。"]}'::jsonb),
(true,
 '{"title":"英語ページ・検索対策を追加","date":"2026-11-11","category":"GLOBAL / SEO","items":["英語版のトップページ、ガイド、更新履歴を追加。","日本語・英語ページ間の言語切り替えリンクを追加。","ページごとの説明文、正規URL、言語情報を整備。","サイトマップに英語ページを追加。"]}'::jsonb,
 '{"title":"English pages and search improvements","date":"2026-11-11","category":"GLOBAL / SEO","items":["Added English home, guide, and changelog pages.","Added language-switch links between Japanese and English pages.","Improved page descriptions, canonical URLs, and language metadata.","Added English pages to the sitemap."]}'::jsonb,
 '{"title":"新增英文页面与搜索优化","date":"2026-11-11","category":"GLOBAL / SEO","items":["新增英文首页、使用指南和更新记录页面。","添加日文与英文页面之间的语言切换链接。","完善页面描述、规范网址和语言元数据。","将英文页面加入站点地图。"]}'::jsonb),
(true,
 '{"title":"サイト改善アップデート","date":"2026-11-11","category":"UI / NAVIGATION","items":["トップページのデザインとナビゲーションを刷新。","使い方ガイドと更新履歴への導線を整理。","ご意見・不具合報告フォームへのリンクを設置。","スマートフォン・タブレットでの表示を調整。"]}'::jsonb,
 '{"title":"Website improvement update","date":"2026-11-11","category":"UI / NAVIGATION","items":["Refreshed the home page design and navigation.","Improved access to the guide and changelog.","Added a feedback and bug-report form link.","Adjusted the layout for phones and tablets."]}'::jsonb,
 '{"title":"网站界面改进","date":"2026-11-11","category":"UI / NAVIGATION","items":["更新首页设计和导航。","整理使用指南和更新记录的入口。","添加意见反馈与问题报告表单链接。","调整手机和平板设备上的显示效果。"]}'::jsonb),
(true,
 '{"title":"ガイドページ追加","date":"2026-11-10","category":"DOCUMENTATION","items":["通常版とSpace Age版の使い分けを説明。","計算の基本操作、設定、FAQを掲載。"]}'::jsonb,
 '{"title":"Guide page added","date":"2026-11-10","category":"DOCUMENTATION","items":["Added guidance on choosing between the base game and Space Age modes.","Documented basic calculator usage, settings, and FAQs."]}'::jsonb,
 '{"title":"新增使用指南页面","date":"2026-11-10","category":"DOCUMENTATION","items":["说明基础游戏版与太空时代版的使用区别。","介绍计算器基本操作、设置和常见问题。"]}'::jsonb);
