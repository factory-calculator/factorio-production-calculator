(() => {
"use strict";
const URL="https://ytlsvlnrmspyhwxeimyf.supabase.co";
const KEY="sb_publishable_UopE1sU8E_tWd2Ehx3L4dA_A0Fug0TW";
const db=window.supabase.createClient(URL,KEY);
const $=id=>document.getElementById(id);
let translations=null;
const today=new Date().toLocaleDateString("sv-SE");
$("date").value=today;
function status(s,bad=false){$("status").textContent=s;$("status").style.color=bad?"#ff9c9c":"#f0bd7e";}
function pack(){return {title:$("title").value.trim(),date:$("date").value,category:$("category").value.trim(),items:$("items").value.split("\n").map(x=>x.trim()).filter(Boolean)};}
function valid(){const p=pack();if(!p.title||!p.date||!p.category||!p.items.length){status("タイトル・日付・カテゴリ・更新内容をすべて入力してください。",true);return false;}return true;}
async function adminCheck(session){
 if(!session){$("loginPanel").classList.remove("hidden");$("manager").classList.add("hidden");return false;}
 const {data,error}=await db.from("site_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
 if(error||!data){await db.auth.signOut();$("loginPanel").classList.remove("hidden");$("manager").classList.add("hidden");$("loginStatus").textContent="管理者権限を確認できませんでした。";return false;}
 $("loginPanel").classList.add("hidden");$("manager").classList.remove("hidden");await loadEntries();return true;
}
async function login(){ $("loginStatus").textContent="ログイン中…";const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){$("loginStatus").textContent=error.message;return;}await adminCheck(data.session);}
async function loadEntries(){
 $("entries").textContent="読み込み中…";
 const {data,error}=await db.from("site_updates").select("*").order("created_at",{ascending:false});
 if(error){$("entries").textContent="読み込み失敗："+error.message;return;}
 if(!data.length){$("entries").textContent="まだ更新履歴はありません。";return;}
 $("entries").innerHTML="";
 data.forEach(row=>{
  const el=document.createElement("div");el.className="entry";
  const title=row.ja?.title||"(タイトルなし)";
  const info=document.createElement("strong");info.textContent=title+" · "+(row.ja?.date||"")+" · "+(row.published?"公開中":"下書き");
  const detail=document.createElement("small");detail.textContent=(row.ja?.items||[]).join(" / ");
  const edit=document.createElement("button");edit.textContent="編集";edit.className="secondary";edit.onclick=()=>editRow(row);
  const toggle=document.createElement("button");toggle.textContent=row.published?"非公開にする":"公開する";toggle.className="secondary";toggle.onclick=()=>togglePublish(row);
  const del=document.createElement("button");del.textContent="削除";del.className="danger";del.onclick=()=>deleteRow(row.id);
  el.append(info,detail,document.createElement("br"),edit,toggle,del);$("entries").append(el);
 });
}
function editRow(row){$("recordId").value=row.id;$("formHeading").textContent="更新履歴を編集";$("title").value=row.ja?.title||"";$("date").value=row.ja?.date||today;$("category").value=row.ja?.category||"";$("items").value=(row.ja?.items||[]).join("\n");$("enTitle").value=row.en?.title||"";$("enCategory").value=row.en?.category||"";$("enItems").value=(row.en?.items||[]).join("\n");$("zhTitle").value=row.zh?.title||"";$("zhCategory").value=row.zh?.category||"";$("zhItems").value=(row.zh?.items||[]).join("\n");translations=null;$("preview").textContent="既存の翻訳を読み込みました。";status("編集内容を読み込みました。");window.scrollTo({top:0,behavior:"smooth"});}
function copyTranslationPrompt(){
 if(!valid())return;
 const p=pack();
 const prompt=[
 "次のFactorio Production Calculatorの更新情報を、意味や技術的な正確さを保って英語と中国語（簡体字）に翻訳してください。",
 "タイトル、カテゴリ、更新内容をそれぞれ分け、更新内容は1行につき1項目で出力してください。",
 "出力形式:",
 "【English】","Title:","Category:","Update details:","- ...",
 "【简体中文】","标题：","分类：","更新内容：","- ...",
 "",
 "【日本語の原文】",
 "タイトル: "+p.title,
 "カテゴリ: "+p.category,
 "更新内容:",
 ...p.items.map(x=>"- "+x)
 ].join("\n");
 navigator.clipboard.writeText(prompt).then(()=>status("翻訳依頼文をコピーしました。ChatGPTに貼り付けてください。")).catch(()=>{
  const area=document.createElement("textarea");area.value=prompt;document.body.append(area);area.select();
  const ok=document.execCommand("copy");area.remove();
  status(ok?"翻訳依頼文をコピーしました。ChatGPTに貼り付けてください。":"コピーできませんでした。",!ok);
 });
}
function prepareTranslations(){
 if(!valid())return false;
 const en={title:$("enTitle").value.trim(),date:pack().date,category:$("enCategory").value.trim(),items:$("enItems").value.split("\n").map(x=>x.trim()).filter(Boolean)};
 const zh={title:$("zhTitle").value.trim(),date:pack().date,category:$("zhCategory").value.trim(),items:$("zhItems").value.split("\n").map(x=>x.trim()).filter(Boolean)};
 if(!en.title||!en.category||!en.items.length||!zh.title||!zh.category||!zh.items.length){status("英語・中国語のタイトル、カテゴリ、更新内容もすべて入力してください。",true);return false;}
 translations={en,zh};
 $("preview").textContent="English: "+en.title+" / 中文: "+zh.title;
 status("3言語の内容を確認しました。公開または下書き保存できます。");
 return true;
}
async function save(published){
 if(!valid())return;
 if(!prepareTranslations())return;
 const p=pack();translations.en.date=p.date;translations.zh.date=p.date;
 const record={ja:p,en:translations.en,zh:translations.zh,published,updated_at:new Date().toISOString()};
 const id=$("recordId").value;
 const result=id?await db.from("site_updates").update(record).eq("id",id):await db.from("site_updates").insert(record);
 if(result.error){status("保存に失敗しました："+result.error.message,true);return;}
 status(published?"公開しました。3言語の更新履歴に反映されます。":"下書きを保存しました。");
 clearForm();await loadEntries();
}
async function togglePublish(row){const {error}=await db.from("site_updates").update({published:!row.published,updated_at:new Date().toISOString()}).eq("id",row.id);if(error){status(error.message,true);return;}await loadEntries();}
async function deleteRow(id){if(!confirm("この更新履歴を削除しますか？"))return;const {error}=await db.from("site_updates").delete().eq("id",id);if(error){status(error.message,true);return;}status("削除しました。");await loadEntries();}
function clearForm(){$("recordId").value="";$("formHeading").textContent="新しい更新を追加";["title","category","items","enTitle","enCategory","enItems","zhTitle","zhCategory","zhItems"].forEach(id=>$(id).value="");$("date").value=today;$("preview").textContent="";translations=null;}
$("loginBtn").addEventListener("click",login);$("password").addEventListener("keydown",e=>{if(e.key==="Enter")login();});
$("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload();});
$("copyPromptBtn").addEventListener("click",copyTranslationPrompt);$("translateBtn").addEventListener("click",prepareTranslations);$("publishBtn").addEventListener("click",()=>save(true));$("draftBtn").addEventListener("click",()=>save(false));$("clearBtn").addEventListener("click",clearForm);
db.auth.getSession().then(({data})=>adminCheck(data.session));db.auth.onAuthStateChange((_e,s)=>{if(!s){$("manager").classList.add("hidden");$("loginPanel").classList.remove("hidden");}});
})();