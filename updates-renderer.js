(() => {
"use strict";
const SUPABASE_URL="https://ytlsvlnrmspyhwxeimyf.supabase.co";
const SUPABASE_KEY="sb_publishable_UopE1sU8E_tWd2Ehx3L4dA_A0Fug0TW";
async function render(){
 const main=document.querySelector("main.wrap")||document.querySelector("main");
 if(!main||!window.supabase)return;
 try{
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const {data:rows,error}=await db.from("site_updates").select("id,ja,en,zh,published").eq("published",true).order("created_at",{ascending:false});
  if(error||!rows||!rows.length)return;
  const lang=document.documentElement.lang==="zh-CN"?"zh":document.documentElement.lang==="en"?"en":"ja";
  main.querySelectorAll(".release").forEach(x=>x.remove());
  const anchor=main.querySelector(".actions");
  rows.forEach(row=>{
   const data=row[lang];if(!data)return;
   const section=document.createElement("section");section.className="release";
   const head=document.createElement("div");head.className="release-head";
   const title=document.createElement("h2");title.textContent=data.title||"";
   const date=document.createElement("span");date.className="date";
   const raw=data.date||"";
   if(/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)){
    const [y,m,d]=raw.split("-").map(Number);
    date.textContent=lang==="ja"?`${y}年${m}月${d}日`:lang==="zh"?`${y}年${m}月${d}日`:`${m}/${d}/${y}`;
   }else date.textContent=raw;
   head.append(title,date);section.append(head);
   const tagWrap=document.createElement("div");tagWrap.style.marginTop="8px";
   const tag=document.createElement("span");tag.className="tag";tag.textContent=data.category||"";tagWrap.append(tag);section.append(tagWrap);
   const ul=document.createElement("ul");(data.items||[]).forEach(item=>{const li=document.createElement("li");li.textContent=item;ul.append(li);});section.append(ul);
   if(anchor)main.insertBefore(section,anchor);else main.append(section);
  });
 }catch(e){console.warn("Could not load shared updates",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();