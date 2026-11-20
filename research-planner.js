/* Factorio Production Calculator — research planning core
 * Dataset values must be derived from permitted, versioned game data.
 * Technologies tagged category:"combat" or policyExcluded:true are omitted,
 * as are all technologies that depend on an omitted technology.
 */
(function (root) {
  "use strict";

  const VERSION = 1;
  const EDITIONS = new Set(["base", "spaceage"]);

  function parseFormula(source, level) {
    if (typeof source !== "string" || source.length > 200) throw new Error("Invalid research cost formula");
    const tokens = source.match(/\s*(?:\d+(?:\.\d+)?|L|[()+*/^\-])/g)?.map(token => token.trim());
    if (!tokens || tokens.join("").replace(/\s/g, "") !== source.replace(/\s/g, "")) {
      throw new Error("Unsupported token in research cost formula");
    }
    let i = 0;
    const peek = () => tokens[i] || "";
    const take = () => tokens[i++];
    function primary() {
      const t = take();
      if (t === "(") {
        const v = expression();
        if (take() !== ")") throw new Error("Unclosed formula parenthesis");
        return v;
      }
      if (t === "L") return level;
      if (t === "+") return primary();
      if (t === "-") return -primary();
      const n = Number(t);
      if (!Number.isFinite(n)) throw new Error("Invalid formula value");
      return n;
    }
    function power() {
      let v = primary();
      if (peek() === "^") { take(); v = Math.pow(v, power()); }
      return v;
    }
    function term() {
      let v = power();
      while (peek() === "*" || peek() === "/") {
        const op = take(), rhs = power();
        v = op === "*" ? v * rhs : v / rhs;
      }
      return v;
    }
    function expression() {
      let v = term();
      while (peek() === "+" || peek() === "-") {
        const op = take(), rhs = term();
        v = op === "+" ? v + rhs : v - rhs;
      }
      return v;
    }
    const value = expression();
    if (i !== tokens.length || !Number.isFinite(value) || value < 0) {
      throw new Error("Research cost formula produced an invalid value");
    }
    return Math.ceil(value);
  }

  function normalizeDataset(input, expectedEdition) {
    if (!input || input.schemaVersion !== VERSION || !EDITIONS.has(input.edition)) {
      throw new Error("Unsupported research dataset");
    }
    if (expectedEdition && input.edition !== expectedEdition) {
      throw new Error("Research dataset edition mismatch");
    }
    if (!Array.isArray(input.technologies)) throw new Error("Technology list is missing");
    const all = new Map();
    for (const tech of input.technologies) {
      if (!tech || typeof tech.id !== "string" || !tech.id || all.has(tech.id)) {
        throw new Error("Technology IDs must be unique non-empty strings");
      }
      all.set(tech.id, tech);
    }

    const blocked = new Set();
    for (const tech of all.values()) {
      const prerequisites = tech.prerequisites == null ? [] : tech.prerequisites;
      if (!Array.isArray(prerequisites)) throw new Error("Prerequisites must be an array for " + tech.id);
      if (tech.policyExcluded === true || tech.category === "combat" || tech.hidden === true || tech.enabled === false) {
        blocked.add(tech.id);
      }
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const tech of all.values()) {
        if (blocked.has(tech.id)) continue;
        if ((tech.prerequisites || []).some(id => blocked.has(id))) {
          blocked.add(tech.id);
          changed = true;
        }
      }
    }

    const available = new Map();
    for (const [id, tech] of all) {
      if (blocked.has(id)) continue;
      const prereqs = Array.isArray(tech.prerequisites) ? tech.prerequisites : [];
      if (prereqs.some(p => !all.has(p))) throw new Error("Unknown prerequisite for " + id);
      available.set(id, tech);
    }
    return { edition: input.edition, technologies: available, excludedCount: blocked.size };
  }

  function plan(input, request) {
    if (!request || !Array.isArray(request.targets) || request.targets.length === 0) {
      throw new Error("Select at least one target technology");
    }
    const dataset = normalizeDataset(input, request.edition);
    const completed = new Set(Array.isArray(request.completed) ? request.completed : []);
    const currentLevels = request.currentLevels == null ? {} : request.currentLevels;
    if (!currentLevels || typeof currentLevels !== "object" || Array.isArray(currentLevels)) {
      throw new Error("Current research levels must be an object");
    }
    for (const [id, rawLevel] of Object.entries(currentLevels)) {
      const tech = dataset.technologies.get(id);
      const level = Number(rawLevel);
      if (!tech || !Number.isInteger(level) || level < 0 || level > 100000) {
        throw new Error("Invalid current research level for " + id);
      }
      const max = tech.maxLevel === "infinite" ? Infinity : Number(tech.maxLevel || 1);
      if (level > max) throw new Error("Current research level exceeds the technology maximum for " + id);
    }
    const requested = new Map();
    for (const target of request.targets) {
      if (!target || typeof target.id !== "string") throw new Error("Invalid research target");
      const tech = dataset.technologies.get(target.id);
      if (!tech) throw new Error("Technology is unavailable in this edition or excluded");
      const level = target.level == null ? 1 : Number(target.level);
      if (!Number.isInteger(level) || level < 1 || level > 100000) throw new Error("Invalid target level");
      const max = tech.maxLevel === "infinite" ? Infinity : Number(tech.maxLevel || 1);
      if (level > max) throw new Error("Target level exceeds the technology maximum");
      requested.set(target.id, Math.max(requested.get(target.id) || 0, level));
    }

    const ordered = [], visiting = new Set(), visited = new Set(), neededLevels = new Map();
    function visit(id, targetLevel) {
      if (completed.has(id)) return;
      const tech = dataset.technologies.get(id);
      if (!tech) throw new Error("A prerequisite is unavailable or excluded");
      neededLevels.set(id, Math.max(neededLevels.get(id) || 0, targetLevel));
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error("Circular technology prerequisites detected");
      visiting.add(id);
      for (const prereq of tech.prerequisites || []) visit(prereq, 1);
      visiting.delete(id);
      visited.add(id);
      ordered.push(id);
    }
    for (const [id, level] of requested) visit(id, level);

    const packs = Object.create(null), rows = [], conditions = [];
    let totalResearchSeconds = 0, totalUnits = 0;
    for (const id of ordered) {
      const tech = dataset.technologies.get(id);
      if (tech.researchType === "condition" || tech.researchTrigger) {
        conditions.push({ id, trigger: tech.researchTrigger || null, condition: tech.condition || null });
        rows.push({ id, kind: "condition", levels: 0, units: 0, seconds: 0 });
        continue;
      }
      const from = Number(currentLevels[id] || 0);
      const to = neededLevels.get(id) || 1;
      if (from >= to) continue;
      const time = Number(tech.timeSeconds);
      if (!Number.isFinite(time) || time <= 0) throw new Error("Invalid research time for " + id);
      let units = 0;
      for (let level = from + 1; level <= to; level++) {
        const count = tech.countFormula != null
          ? parseFormula(tech.countFormula, level)
          : Number(tech.unitCount);
        if (!Number.isFinite(count) || count < 0) throw new Error("Invalid unit count for " + id);
        units += Math.ceil(count);
      }
      if (tech.sciencePacks != null && !Array.isArray(tech.sciencePacks)) {
        throw new Error("Science packs must be an array for " + id);
      }
      for (const pack of (tech.sciencePacks || [])) {
        if (!pack || typeof pack.id !== "string" || !Number.isFinite(Number(pack.amountPerUnit)) || Number(pack.amountPerUnit) < 0) {
          throw new Error("Invalid science pack entry for " + id);
        }
        packs[pack.id] = (packs[pack.id] || 0) + units * Number(pack.amountPerUnit);
      }
      const seconds = units * time;
      totalUnits += units;
      totalResearchSeconds += seconds;
      rows.push({ id, kind: "science", levels: to - from, units, seconds });
    }
    return {
      edition: dataset.edition,
      technologies: rows,
      sciencePacks: packs,
      totalUnits,
      totalResearchSeconds,
      totalResearchHours: totalResearchSeconds / 3600,
      conditions,
      excludedTechnologyCount: dataset.excludedCount
    };
  }

  const api = Object.freeze({ version: VERSION, parseFormula, normalizeDataset, plan });
  root.FactorioResearchPlanner = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
