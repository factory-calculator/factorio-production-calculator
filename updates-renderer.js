(() => {
"use strict";
const SUPABASE_URL="https://ytlsvlnrmspyhwxeimyf.supabase.co";
const SUPABASE_KEY="sb_publishable_UopE1sU8E_tWd2Ehx3L4dA_A0Fug0TW";
async function render(){
 const main=document.querySelector("main.wrap")||document.querySelector("main");
 if(!main)return;
 try{
  const response=await fetch(SUPABASE_URL+"/rest/v1/site_updates?select=id,ja,en,zh,published&published=eq.true&order=created_at.desc",{headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}});
  if(!response.ok)return;
  const rows=await response.json();if(!rows.length)return;
  const lang=document.documentElement.lang==="zh-CN"?"zh":document.documentElement.lang==="en"?"en":"ja";
  const existing=main.querySelectorAll(".release");existing.forEach(x=>x.remove());
  const anchor=main.querySelector(".actions")||null;
  rows.forEach(row=>{
   const data=row[lang];if(!data)return;
   const section=document.createElement("section");section.className="release";
   const head=document.createElement("div");head.className="release-head";
   const title=document.createElement("h2");title.textContent=data.title||"";
   const date=document.createElement("span");date.className="date";date.textContent=data.date||"";
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