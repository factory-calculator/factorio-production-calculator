(() => {
  "use strict";
  const api = window.__factorioPlanApi;
  const host = document.getElementById("productionPlan");
  if (!api || !host || document.getElementById("factorioPlanManager")) return;
  const lang = (document.documentElement.lang || "ja").toLowerCase();
  const isZh = lang.startsWith("zh"), isEn = lang.startsWith("en");
  const t = isZh ? {
    title:"生产计划保存与共享", name:"计划名称", save:"保存计划", saved:"已保存的计划", load:"加载", remove:"删除", export:"导出 JSON", import:"导入 JSON", choose:"选择已保存的计划", unnamed:"未命名计划", savedMsg:"计划已保存。", loadedMsg:"计划已加载。", deletedMsg:"计划已删除。", exportedMsg:"计划文件已导出。", importedMsg:"计划已导入并应用。", enterName:"请输入计划名称。", overwrite:"同名计划已存在。要覆盖吗？", deleteConfirm:"确定删除所选计划吗？", invalid:"文件格式或数据无效。", wrongEdition:"此计划属于另一种游戏版本，无法在当前页面加载。", missingItem:"计划中包含当前数据集中不存在的物品。", noSaved:"没有已保存的计划。", importError:"导入失败：", auto:"当前编辑内容会自动保存在此浏览器中。JSON 文件可用于备份或转移到其他设备。"
  } : isEn ? {
    title:"Save & Share Production Plans", name:"Plan name", save:"Save plan", saved:"Saved plans", load:"Load", remove:"Delete", export:"Export JSON", import:"Import JSON", choose:"Select a saved plan", unnamed:"Untitled plan", savedMsg:"Plan saved.", loadedMsg:"Plan loaded.", deletedMsg:"Plan deleted.", exportedMsg:"Plan file exported.", importedMsg:"Plan imported and applied.", enterName:"Enter a plan name.", overwrite:"A plan with this name already exists. Overwrite it?", deleteConfirm:"Delete the selected plan?", invalid:"The file format or data is invalid.", wrongEdition:"This plan belongs to a different game edition and cannot be loaded here.", missingItem:"The plan contains an item that is not available in this dataset.", noSaved:"No saved plans.", importError:"Import failed: ", auto:"Your current work is saved automatically in this browser. Use JSON files to back up or move plans to another device."
  } : {
    title:"生産計画の保存・共有", name:"計画名", save:"計画を保存", saved:"保存済み計画", load:"読み込む", remove:"削除", export:"JSONを書き出す", import:"JSONを読み込む", choose:"保存した計画を選択", unnamed:"無題の計画", savedMsg:"計画を保存しました。", loadedMsg:"計画を読み込みました。", deletedMsg:"計画を削除しました。", exportedMsg:"計画ファイルを書き出しました。", importedMsg:"計画を読み込み、適用しました。", enterName:"計画名を入力してください。", overwrite:"同じ名前の計画があります。上書きしますか？", deleteConfirm:"選択した計画を削除しますか？", invalid:"ファイル形式またはデータが正しくありません。", wrongEdition:"この計画は別のゲーム版用です。現在のページには読み込めません。", missingItem:"現在のデータに存在しないアイテムが計画に含まれています。", noSaved:"保存済みの計画はありません。", importError:"読み込みに失敗しました：", auto:"編集中の内容はこのブラウザに自動保存されます。JSONファイルでバックアップや別端末への移行もできます。"
  };
  const storageKey = "factorio_named_plans_v1_" + api.edition;
  const draftKey = "factorio_plan_draft_v1_" + api.edition;
  const panel = document.createElement("section");
  panel.id = "factorioPlanManager"; panel.className = "plan-manager";
  panel.innerHTML = '<h4>' + t.title + '</h4><div class="plan-manager-row"><label class="plan-manager-name">' + t.name + '<input id="factorioPlanName" type="text" maxlength="48" autocomplete="off"></label><button type="button" id="factorioPlanSave">' + t.save + '</button></div><div class="plan-manager-row"><label class="plan-manager-select">' + t.saved + '<select id="factorioSavedPlan"><option value="">' + t.choose + '</option></select></label><button type="button" class="secondary" id="factorioPlanLoad">' + t.load + '</button><button type="button" class="secondary" id="factorioPlanDelete">' + t.remove + '</button></div><div class="plan-manager-row"><button type="button" class="secondary" id="factorioPlanExport">' + t.export + '</button><button type="button" class="secondary" id="factorioPlanImport">' + t.import + '</button><input id="factorioPlanFile" type="file" accept="application/json,.json" hidden></div><p class="plan-manager-help">' + t.auto + '</p><p id="factorioPlanStatus" class="plan-manager-status" role="status" aria-live="polite"></p>';
  host.insertAdjacentElement("afterend", panel);
  const style = document.createElement("style");
  style.textContent = ".plan-manager{margin-top:14px;padding:13px;border:1px solid var(--line,#46505a);border-radius:8px;background:var(--panel,#20252a)}.plan-manager h4{margin:0 0 10px;font-size:15px}.plan-manager-row{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin:8px 0}.plan-manager label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted,#aab2bb)}.plan-manager-name{flex:1 1 180px}.plan-manager-select{flex:1 1 220px}.plan-manager input,.plan-manager select{min-width:0;width:100%;padding:8px;border:1px solid var(--line,#46505a);border-radius:5px;background:var(--input,#171b1f);color:inherit}.plan-manager button{min-height:36px}.plan-manager-help,.plan-manager-status{margin:7px 0 0;font-size:12px;color:var(--muted,#aab2bb)}.plan-manager-status{min-height:1.2em;color:var(--accent,#e6a23c)}@media(max-width:560px){.plan-manager-row>*{flex:1 1 100%}.plan-manager button{width:100%}}";
  document.head.appendChild(style);
  const $ = id => document.getElementById(id);
  const status = message => { $("factorioPlanStatus").textContent = message || ""; };
  const knownNames = () => new Set(api.getRecipeNames());
  const validData = data => {
    if (!data || data.format !== "factorio-production-plan" || data.version !== 1) throw new Error(t.invalid);
    if (data.edition !== api.edition) throw new Error(t.wrongEdition);
    const names = knownNames(), targets = Array.isArray(data.productionPlan) ? data.productionPlan : [];
    if (targets.length > 100) throw new Error(t.invalid);
    const cleanedTargets = targets.map(item => {
      if (!item || typeof item.name !== "string" || !names.has(item.name)) throw new Error(t.missingItem);
      const rate = Number(item.rate);
      if (!Number.isFinite(rate) || rate < 0.01 || rate > 1e12) throw new Error(t.invalid);
      return {name:item.name, rate};
    });
    const selected = typeof data.selectedTarget === "string" && names.has(data.selectedTarget) ? data.selectedTarget : (cleanedTargets[0] ? cleanedTargets[0].name : "");
    const supplies = {};
    if (data.supplyRates && typeof data.supplyRates === "object" && !Array.isArray(data.supplyRates)) {
      const entries = Object.entries(data.supplyRates);
      if (entries.length > 1000) throw new Error(t.invalid);
      for (const [key,value] of entries) { const n=Number(value); if(key.length<=120 && Number.isFinite(n) && n>=0 && n<=1e12) supplies[key]=n; }
    }
    return {format:"factorio-production-plan",version:1,edition:api.edition,name:String(data.name||t.unnamed).slice(0,48),savedAt:typeof data.savedAt==="string"?data.savedAt:new Date().toISOString(),selectedTarget:selected,settings:data.settings&&typeof data.settings==="object"?data.settings:{},productionPlan:cleanedTargets,supplyRates:supplies};
  };
  const snapshot = name => ({format:"factorio-production-plan",version:1,edition:api.edition,name:String(name||t.unnamed).trim().slice(0,48),savedAt:new Date().toISOString(),selectedTarget:api.getTarget(),settings:api.getSettings(),productionPlan:api.getProductionPlan(),supplyRates:api.getSupplyRates()});
  const readPlans = () => { try { const parsed=JSON.parse(localStorage.getItem(storageKey)||"[]"); return Array.isArray(parsed)?parsed.map(item=>{try{return validData(item)}catch(_){return null}}).filter(Boolean):[]; } catch(_){return [];} };
  const writePlans = plans => localStorage.setItem(storageKey,JSON.stringify(plans));
  const renderList = selected => {
    const select=$("factorioSavedPlan"), plans=readPlans();
    select.innerHTML='<option value="">' + t.choose + '</option>'+plans.map((p,i)=>'<option value="'+i+'">'+String(p.name).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))+'</option>').join("");
    if(selected!==undefined&&selected!==null&&plans[selected])select.value=String(selected);
  };
  function saveDraft(){try{localStorage.setItem(draftKey,JSON.stringify(snapshot("Auto Save")))}catch(_){}}
  const applyData = data => {
    const clean=validData(data);
    api.applySettings(clean.settings);
    if(clean.selectedTarget)api.setTarget(clean.selectedTarget);
    api.setProductionPlan(clean.productionPlan);
    api.setSupplyRates(clean.supplyRates);
    api.calc(); saveDraft(); return clean;
  };
  const restoreDraft = () => {try{const raw=localStorage.getItem(draftKey);if(!raw)return false;applyData(JSON.parse(raw));return true}catch(_){return false}};
  $("factorioPlanSave").addEventListener("click",()=>{
    const name=$("factorioPlanName").value.trim(); if(!name){status(t.enterName);$("factorioPlanName").focus();return}
    const plans=readPlans(),existing=plans.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
    if(existing>=0&&!window.confirm(t.overwrite))return;
    const data=snapshot(name);if(existing>=0)plans[existing]=data;else plans.push(data);
    try{writePlans(plans);renderList(existing>=0?existing:plans.length-1);status(t.savedMsg)}catch(_){status(t.invalid)}
  });
  $("factorioPlanLoad").addEventListener("click",()=>{
    const index=Number($("factorioSavedPlan").value),plans=readPlans();
    if(!$("factorioSavedPlan").value||!plans[index]){status(t.noSaved);return}
    try{applyData(plans[index]);$("factorioPlanName").value=plans[index].name;status(t.loadedMsg)}catch(error){status(error.message||t.invalid)}
  });
  $("factorioPlanDelete").addEventListener("click",()=>{
    const index=Number($("factorioSavedPlan").value),plans=readPlans();
    if(!$("factorioSavedPlan").value||!plans[index]){status(t.noSaved);return}
    if(!window.confirm(t.deleteConfirm))return;
    plans.splice(index,1);try{writePlans(plans);renderList();status(t.deletedMsg)}catch(_){status(t.invalid)}
  });
  $("factorioPlanExport").addEventListener("click",()=>{
    const index=Number($("factorioSavedPlan").value),plans=readPlans();
    const data=$("factorioSavedPlan").value&&plans[index]?plans[index]:snapshot($("factorioPlanName").value||t.unnamed);
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download="factorio-production-plan-"+api.edition+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status(t.exportedMsg);
  });
  $("factorioPlanImport").addEventListener("click",()=>$("factorioPlanFile").click());
  $("factorioPlanFile").addEventListener("change",async event=>{
    const file=event.target.files&&event.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new Error(t.invalid);
      const clean=validData(JSON.parse(await file.text())),plans=readPlans(),existing=plans.findIndex(p=>p.name.toLowerCase()===clean.name.toLowerCase());
      if(existing>=0&&!window.confirm(t.overwrite))return;
      if(existing>=0)plans[existing]=clean;else plans.push(clean);
      writePlans(plans);applyData(clean);$("factorioPlanName").value=clean.name;renderList(existing>=0?existing:plans.length-1);status(t.importedMsg);
    }catch(error){status(t.importError+(error.message||t.invalid))}finally{event.target.value=""}
  });
  document.addEventListener("input",event=>{if(event.target.closest("#factorioPlanManager"))return;if(event.target.matches("input,select"))saveDraft()});
  document.addEventListener("change",event=>{if(event.target.closest("#factorioPlanManager"))return;if(event.target.matches("input,select"))saveDraft()});
  renderList();if(!restoreDraft())saveDraft();
})();