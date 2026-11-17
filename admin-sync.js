(() => {
  "use strict";
  const SUPABASE_URL = "https://ytlsvlnrmspyhwxeimyf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_UopE1sU8E_tWd2Ehx3L4dA_A0Fug0TW";
  const src = document.currentScript && document.currentScript.src;
  const edition = new URL(src || location.href).searchParams.get("edition") === "spaceage" ? "spaceage" : "base";
  const dbId = edition === "spaceage" ? "space-age" : "base";
  const recipeKey = "factorio_custom_recipes_" + edition;
  const recipeVersionKey = "factorio_recipe_data_version_" + edition;
  const settingsKey = "factorio_calculator_settings_" + edition;
  const imagesKey = "factorio_item_images_v1";
  const lang = document.documentElement.lang;
  const labels = lang === "zh-CN"
    ? {login:"管理员登录",logout:"退出登录",email:"邮箱",password:"密码",submit:"登录",cancel:"关闭",denied:"此账号没有管理员权限。",signed:"管理员已登录",sync:"正在同步共享设置…",ok:"已保存并同步给所有用户。",failed:"同步失败。请检查网络或管理员权限。"}
    : lang === "en"
    ? {login:"Admin login",logout:"Log out",email:"Email",password:"Password",submit:"Sign in",cancel:"Close",denied:"This account does not have administrator access.",signed:"Administrator signed in",sync:"Syncing shared settings…",ok:"Saved and shared with everyone.",failed:"Sync failed. Check the connection or administrator access."}
    : {login:"管理者ログイン",logout:"ログアウト",email:"メールアドレス",password:"パスワード",submit:"ログイン",cancel:"閉じる",denied:"このアカウントには管理者権限がありません。",signed:"管理者としてログイン中",sync:"共有設定を同期中…",ok:"保存して全ユーザーに反映しました。",failed:"同期に失敗しました。通信状態と管理者権限を確認してください。"};
  function loadScript(url) {
    return new Promise((resolve,reject) => {
      const s=document.createElement("script"); s.src=url; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }
  let client=null, isAdmin=false, currentUser=null, statusTimer=null;
  function showStatus(message,bad=false) {
    const el=document.getElementById("fpc-admin-status"); if(!el)return;
    el.textContent=message; el.style.display="block"; el.style.border=bad?"1px solid #b85d5d":"1px solid #60758d";
    clearTimeout(statusTimer); statusTimer=setTimeout(()=>el.style.display="none",5000);
  }
  function setAdmin(value,user) {
    isAdmin=value; currentUser=user||null;
    const entry=document.getElementById("fpc-admin-entry");
    const adminButton=document.getElementById("adminToggleBtn");
    if(entry)entry.textContent=value?labels.logout:labels.login;
    if(adminButton)adminButton.style.display=value?"":"none";
    if(value)showStatus(labels.signed);
  }
  async function verifyAdmin(user) {
    if(!user){setAdmin(false,null);return false;}
    const {data,error}=await client.from("site_admins").select("user_id").eq("user_id",user.id).maybeSingle();
    if(error){console.error("Admin verification failed",error);setAdmin(false,null);return false;}
    setAdmin(!!data,user);return !!data;
  }
  async function signIn() {
    const email=document.getElementById("fpc-admin-email").value.trim();
    const password=document.getElementById("fpc-admin-password").value;
    const msg=document.getElementById("fpc-admin-message");
    if(!email||!password){msg.textContent=labels.email+" / "+labels.password;return;}
    msg.textContent="…";
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){msg.textContent=error.message;return;}
    if(await verifyAdmin(data.user)){
      document.getElementById("fpc-admin-overlay").style.display="none";
      document.getElementById("fpc-admin-password").value="";
    }else{
      await client.auth.signOut();msg.textContent=labels.denied;
    }
  }
  async function signOut(){await client.auth.signOut();setAdmin(false,null);showStatus(labels.logout);}
  function addUi() {
    const style=document.createElement("style");
    style.textContent="#fpc-admin-entry{position:fixed;right:14px;bottom:14px;z-index:99990;border:1px solid #60758d;border-radius:9px;padding:9px 13px;background:#26384b;color:#fff;font:600 13px system-ui;box-shadow:0 3px 12px #0005}#fpc-admin-entry:hover{background:#354d66}#fpc-admin-status{position:fixed;right:14px;bottom:58px;z-index:99990;padding:8px 12px;border-radius:8px;background:#182534;color:#fff;font:12px system-ui;max-width:min(88vw,360px);display:none}#fpc-admin-overlay{position:fixed;inset:0;z-index:100000;background:#000a;display:none;align-items:center;justify-content:center;padding:16px;font:14px system-ui}#fpc-admin-panel{box-sizing:border-box;width:min(100%,380px);background:#1b2836;color:#eef4fa;border:1px solid #53677d;border-radius:14px;padding:20px;box-shadow:0 12px 40px #0008}#fpc-admin-panel h2{margin:0 0 16px;font-size:19px}#fpc-admin-panel label{display:block;margin:12px 0 5px}#fpc-admin-panel input{box-sizing:border-box;width:100%;padding:11px;border:1px solid #62768b;border-radius:7px;background:#101a25;color:#fff;font-size:16px}#fpc-admin-panel button{padding:9px 13px;border:0;border-radius:7px;background:#3d78a8;color:white;font-weight:600}#fpc-admin-panel button.secondary{background:#465566}#fpc-admin-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}#fpc-admin-message{min-height:18px;color:#ffd38a;margin-top:12px;font-size:13px}";
    document.head.appendChild(style);
    const entry=document.createElement("button");entry.id="fpc-admin-entry";entry.type="button";entry.textContent=labels.login;
    const status=document.createElement("div");status.id="fpc-admin-status";
    const overlay=document.createElement("div");overlay.id="fpc-admin-overlay";
    overlay.innerHTML='<div id="fpc-admin-panel" role="dialog" aria-modal="true"><h2>'+labels.login+'</h2><label for="fpc-admin-email">'+labels.email+'</label><input id="fpc-admin-email" type="email" autocomplete="username"><label for="fpc-admin-password">'+labels.password+'</label><input id="fpc-admin-password" type="password" autocomplete="current-password"><div id="fpc-admin-actions"><button id="fpc-admin-submit" type="button">'+labels.submit+'</button><button id="fpc-admin-cancel" class="secondary" type="button">'+labels.cancel+'</button></div><div id="fpc-admin-message" aria-live="polite"></div></div>';
    document.body.append(entry,status,overlay);
    entry.addEventListener("click",()=>{if(isAdmin)signOut();else{overlay.style.display="flex";document.getElementById("fpc-admin-email").focus();}});
    document.getElementById("fpc-admin-cancel").addEventListener("click",()=>overlay.style.display="none");
    overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.style.display="none";});
    document.getElementById("fpc-admin-submit").addEventListener("click",signIn);
    document.getElementById("fpc-admin-password").addEventListener("keydown",e=>{if(e.key==="Enter")signIn();});
    const adminButton=document.getElementById("adminToggleBtn");if(adminButton)adminButton.style.display="none";
  }
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||"null");}catch(_){return null;}}
  async function pullSharedSettings() {
    const {data,error}=await client.from("site_settings").select("value,updated_at").eq("id",dbId).maybeSingle();
    if(error){console.warn("Shared settings read failed",error);return;}
    if(!data||!data.value||typeof data.value!=="object")return;
    const v=data.value,stamp=data.updated_at||"initial";let changed=false;
    const apply=(key,val)=>{
      if(!Object.prototype.hasOwnProperty.call(v,key))return;
      const next=val===null?null:JSON.stringify(val);
      if(localStorage.getItem(key)!==next){if(next===null)localStorage.removeItem(key);else localStorage.setItem(key,next);changed=true;}
    };
    apply(recipeKey,v.recipes);apply(recipeVersionKey,v.recipeVersion);apply(settingsKey,v.settings);apply(imagesKey,v.itemImages);
    const marker="fpc-shared-reload-"+edition;
    if(changed&&sessionStorage.getItem(marker)!==stamp){sessionStorage.setItem(marker,stamp);location.reload();}
  }
  async function pushSharedSettings() {
    if(!isAdmin||!currentUser){showStatus(labels.denied,true);return;}
    showStatus(labels.sync);
    const value={recipes:readJson(recipeKey),recipeVersion:localStorage.getItem(recipeVersionKey),settings:readJson(settingsKey),itemImages:readJson(imagesKey)};
    const {error}=await client.from("site_settings").upsert({id:dbId,value,updated_at:new Date().toISOString(),updated_by:currentUser.id},{onConflict:"id"});
    if(error){console.error("Shared settings write failed",error);showStatus(labels.failed,true);return;}
    showStatus(labels.ok);
  }
  function hookSaveButtons() {
    const save=document.getElementById("saveStorageBtn");
    if(save){save.textContent=lang==="zh-CN"?"保存并共享给所有用户":lang==="en"?"Save and share with everyone":"保存して全員に共有";save.addEventListener("click",()=>setTimeout(pushSharedSettings,150));}
    const imageSave=document.getElementById("saveItemImageBtn");
    if(imageSave)imageSave.addEventListener("click",()=>setTimeout(pushSharedSettings,150));
    const reset=document.getElementById("resetStorageBtn");
    if(reset)reset.addEventListener("click",()=>setTimeout(()=>{if(isAdmin&&confirm(lang==="zh-CN"?"将默认设置同步给所有用户？":lang==="en"?"Share the reset settings with everyone?":"初期設定を全ユーザーに反映しますか？"))pushSharedSettings();},250));
  }
  async function start() {
    addUi();hookSaveButtons();
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js");
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data}=await client.auth.getSession();
    await verifyAdmin(data.session?.user||null);
    client.auth.onAuthStateChange((_event,session)=>setTimeout(()=>verifyAdmin(session?.user||null),0));
    await pullSharedSettings();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>start().catch(e=>{console.error(e);showStatus(labels.failed,true);}));
  else start().catch(e=>{console.error(e);showStatus(labels.failed,true);});
})();