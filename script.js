const SAVE_KEY = "dust-and-daybreak-save-v2";
const JOB_DURATION = 60_000;
const materials = {
  timber: { name: "Rough-cut timber", icon: "▤", detail: "Useful wood, cut from whatever will burn." },
  scrap: { name: "Iron scrap", icon: "⌁", detail: "Bent nails, old fittings, and workable iron." },
  hide: { name: "Tanned hide", icon: "▧", detail: "Tough leather, still carrying the smell of the trail." },
  ore: { name: "Copper ore", icon: "◆", detail: "A few bright veins from the red hills." },
  herbs: { name: "Wild herbs", icon: "✿", detail: "Bitter leaves with a knack for closing a wound." },
};

const gear = {
  "old-revolver": { name: "Old revolver", type: "weapon", slot: "Weapon", power: 3, rarity: "common", icon: "♧", detail: "A faithful six-shooter with a loose sight." },
  "patched-coat": { name: "Patched trail coat", type: "armor", slot: "Coat", power: 2, rarity: "common", icon: "▤", detail: "More patches than original cloth. Still keeps the wind off." },
  "iron-peacemaker": { name: "Iron Peacemaker", type: "weapon", slot: "Weapon", power: 8, rarity: "uncommon", icon: "♧", detail: "A hand-fitted revolver with a steady pull." },
  "redhide-vest": { name: "Redhide vest", type: "armor", slot: "Coat", power: 7, rarity: "uncommon", icon: "▧", detail: "Layered mesa hide, tough enough to turn a glancing blow." },
  "lucky-spur": { name: "Prospector's lucky spur", type: "charm", slot: "Charm", power: 3, rarity: "rare", icon: "✧", detail: "Adds a little bite to your strikes and a little luck." },
  "ironjaw-trophy": { name: "Ironjaw's tooth", type: "charm", slot: "Charm", power: 5, rarity: "epic", icon: "◆", detail: "A heavy trophy that lends weight to every strike." },
  "silver-star": { name: "Deputy's silver star", type: "armor", slot: "Coat", power: 12, rarity: "epic", icon: "✦", detail: "The town marshal's badge, earned the hard way." },
};

const recipes = [
  { id: "iron-peacemaker", name: "Iron Peacemaker", description: "A dependable upgrade for the gulch.", cost: 25, materials: { scrap: 5, timber: 2 }, output: "iron-peacemaker" },
  { id: "redhide-vest", name: "Redhide vest", description: "Protection against claws and bad decisions.", cost: 30, materials: { hide: 4, scrap: 2 }, output: "redhide-vest" },
  { id: "healing-tonic", name: "Frontier tonic", description: "Restore 35 health during a fight.", cost: 12, materials: { herbs: 3 }, output: "healing-tonic" },
];

const jobs = {
  mail: { name: "Letters for Red Mesa", cost: 12, reward: 24, xp: 18, materials: ["timber", "scrap", "herbs"] },
  ranch: { name: "Fence-line trouble", cost: 20, reward: 39, xp: 28, materials: ["timber", "hide", "scrap"] },
  saloon: { name: "Last call at the Lantern", cost: 26, reward: 52, xp: 36, materials: ["scrap", "herbs", "hide"] },
};

const routes = {
  creek: { name: "Take the creek path", description: "A short ramble with a chance of pocket change or something useful.", cost: 10, danger: 0.04, coins: [4, 17] },
  mesa: { name: "Ride for Red Mesa", description: "A longer ride, but the old trail has a way of giving things back.", cost: 18, danger: 0.12, coins: [10, 32] },
  pines: { name: "Wander the pines", description: "Keep your ears open. The quiet trails can hide a surprise or two.", cost: 15, danger: 0.19, coins: [7, 26] },
};

const enemies = {
  coyote: { name: "Ridgeback coyote", kind: "BEAST · COMMON", health: 25, attack: 5, reward: 18, xp: 18, icon: "♧", boss: false },
  outlaw: { name: "Gulch road-agent", kind: "OUTLAW · TOUGH", health: 48, attack: 10, reward: 42, xp: 36, icon: "♠", boss: false },
  ironjaw: { name: "Ironjaw, the old bear", kind: "BOSS · LEGENDARY", health: 125, attack: 18, reward: 180, xp: 120, icon: "◆", boss: true },
};

const missions = [
  { id: "steady-work", name: "A steady hand", detail: "Complete 3 jobs.", target: 3, stat: "jobsCompleted", reward: 45, xp: 25 },
  { id: "supply-run", name: "Stock the workbench", detail: "Gather 12 raw materials.", target: 12, stat: "materialsGathered", reward: 55, xp: 30 },
  { id: "craftsman", name: "Make something of it", detail: "Craft 2 recipes.", target: 2, stat: "itemsCrafted", reward: 70, xp: 40 },
  { id: "gulch-clear", name: "Keep the gulch clear", detail: "Win 5 frontier fights.", target: 5, stat: "monstersDefeated", reward: 85, xp: 55 },
  { id: "ironjaw", name: "A name in the ledger", detail: "Defeat Ironjaw.", target: 1, stat: "bossesDefeated", reward: 150, xp: 100 },
];

function freshState() {
  return {
    money: 85, energy: 70, health: 100, xp: 0, level: 1, day: 1, jobsDone: [],
    route: "creek", questClaimed: false, activeJob: null, encounter: null, battleLog: [],
    inventory: [
      { id: "old-revolver", quantity: 1 },
      { id: "patched-coat", quantity: 1 },
      { id: "biscuit", quantity: 2 },
    ],
    equipped: { weapon: "old-revolver", armor: "patched-coat", charm: null },
    stats: { jobsCompleted: 0, materialsGathered: 0, itemsCrafted: 0, monstersDefeated: 0, bossesDefeated: 0 },
    claimedMissions: [],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== "object") return freshState();
    const initial = freshState();
    const restored = {
      ...initial,
      ...saved,
      jobsDone: Array.isArray(saved.jobsDone) ? saved.jobsDone.filter((id) => Object.hasOwn(jobs, id)) : [],
      inventory: Array.isArray(saved.inventory) ? saved.inventory
        .filter((item) => item && typeof item.id === "string" && itemInfo(item.id) && Number.isInteger(item.quantity) && item.quantity > 0)
        .reduce((items, item) => {
          const existing = items.find((entry) => entry.id === item.id);
          if (existing) existing.quantity += item.quantity;
          else items.push({ id: item.id, quantity: item.quantity });
          return items;
        }, []) : initial.inventory,
      equipped: { ...initial.equipped, ...(saved.equipped || {}) },
      stats: { ...initial.stats, ...(saved.stats || {}) },
      claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
      activeJob: saved.activeJob && Object.hasOwn(jobs, saved.activeJob.id) && Number.isFinite(saved.activeJob.finishesAt)
        ? { ...saved.activeJob, startedAt: Number.isFinite(saved.activeJob.startedAt) ? saved.activeJob.startedAt : saved.activeJob.finishesAt - JOB_DURATION }
        : null,
      encounter: saved.encounter && Object.hasOwn(enemies, saved.encounter.id) ? saved.encounter : null,
      battleLog: Array.isArray(saved.battleLog) ? saved.battleLog.slice(0, 12) : [],
    };
    for (const slot of ["weapon", "armor", "charm"]) {
      const equippedItem = restored.equipped[slot];
      if (equippedItem && (!gear[equippedItem] || gear[equippedItem].type !== slot || !restored.inventory.some((item) => item.id === equippedItem))) {
        restored.equipped[slot] = initial.equipped[slot];
      }
    }
    return restored;
  } catch {
    window.setTimeout(() => showToast("Your old save could not be read. A fresh frontier ledger has been started."), 0);
    return freshState();
  }
}

const state = loadState();
const $ = (selector) => document.querySelector(selector);
const toast = $("#toast");
let toastTimer;
let jobTimer;
let saveWarningShown = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    if (!saveWarningShown) {
      saveWarningShown = true;
      showToast("Progress could not be saved in this browser. Keep this tab open.");
    }
  }
}

function addNote(message, time = "JUST NOW") {
  const item = document.createElement("li");
  const dot = document.createElement("span");
  dot.className = "journal-dot";
  const text = document.createElement("span");
  text.textContent = message;
  const timestamp = document.createElement("time");
  timestamp.textContent = time;
  item.append(dot, text, timestamp);
  $("#journal-list").prepend(item);
  while ($("#journal-list").children.length > 35) $("#journal-list").lastElementChild.remove();
}

function countItem(id) {
  return state.inventory.reduce((sum, item) => item.id === id ? sum + item.quantity : sum, 0);
}

function addItem(id, quantity = 1) {
  const existing = state.inventory.find((item) => item.id === id);
  if (existing) existing.quantity += quantity;
  else state.inventory.push({ id, quantity });
  return quantity;
}

function removeItem(id, quantity = 1) {
  if (countItem(id) < quantity) return false;
  for (let index = state.inventory.length - 1; index >= 0 && quantity > 0; index -= 1) {
    const item = state.inventory[index];
    if (item.id !== id) continue;
    const taken = Math.min(quantity, item.quantity);
    item.quantity -= taken;
    quantity -= taken;
    if (item.quantity === 0) state.inventory.splice(index, 1);
  }
  return true;
}

function itemInfo(id) {
  if (materials[id]) return { ...materials[id], type: "material", rarity: "material" };
  if (gear[id]) return gear[id];
  if (id === "biscuit") return { name: "Trail biscuits", icon: "▤", detail: "A little something for the long ride.", type: "consumable", rarity: "common" };
  if (id === "healing-tonic") return { name: "Frontier tonic", icon: "✿", detail: "Restore 35 health during a fight.", type: "consumable", rarity: "uncommon" };
  return null;
}

function equipmentPower() {
  return Object.values(state.equipped).reduce((total, id) => total + (id && gear[id] ? gear[id].power : 0), 0);
}

function equipped(id) {
  return Object.values(state.equipped).includes(id);
}

function renderInventory() {
  const list = $("#inventory-list");
  list.replaceChildren();
  const itemCount = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
  $("#inventory-count").textContent = `${itemCount} ${itemCount === 1 ? "ITEM" : "ITEMS"}`;

  if (!itemCount) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = "Your satchel is light. The next job might change that.";
    list.append(empty);
  }

  for (const entry of state.inventory) {
    const info = itemInfo(entry.id);
    if (!info) continue;
    const row = document.createElement("div");
    row.className = `inventory-item rarity-${info.rarity}`;
    const icon = document.createElement("span");
    icon.className = "inventory-icon";
    icon.textContent = info.icon;
    icon.setAttribute("aria-hidden", "true");
    const details = document.createElement("span");
    details.className = "inventory-details";
    const name = document.createElement("b");
    name.textContent = info.name;
    const description = document.createElement("small");
    description.textContent = info.detail;
    details.append(name, description);
    row.append(icon, details);

    if (info.type === "material") {
      const count = document.createElement("span");
      count.className = "inventory-quantity";
      count.textContent = `×${entry.quantity}`;
      row.append(count);
    } else if (info.type === "weapon" || info.type === "armor" || info.type === "charm") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "use-button";
      action.textContent = equipped(entry.id) ? "Equipped" : `Equip · +${info.power}`;
      action.disabled = equipped(entry.id);
      action.addEventListener("click", () => equipItem(entry.id));
      row.append(action);
    } else {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "use-button";
      action.textContent = entry.id === "biscuit" ? "Use" : "Use tonic";
      action.addEventListener("click", () => useItem(entry.id));
      row.append(action);
      const count = document.createElement("span");
      count.className = "inventory-quantity";
      count.textContent = `×${entry.quantity}`;
      row.append(count);
    }
    list.append(row);
  }

  const slots = $("#equipment-slots");
  slots.replaceChildren();
  for (const [slot, id] of Object.entries(state.equipped)) {
    const row = document.createElement("div");
    row.className = "equipment-slot";
    const label = document.createElement("span");
    label.className = "slot-label";
    label.textContent = slot;
    const item = document.createElement("b");
    item.textContent = id && gear[id] ? gear[id].name : "Empty";
    const power = document.createElement("span");
    power.className = "slot-power";
    power.textContent = id && gear[id] ? `+${gear[id].power}` : "—";
    row.append(label, item, power);
    slots.append(row);
  }
  $("#combat-power").textContent = `POWER ${equipmentPower()}`;
  $("#battle-power").textContent = equipmentPower();
}

function renderRecipes() {
  const list = $("#recipe-list");
  list.replaceChildren();
  for (const recipe of recipes) {
    const row = document.createElement("article");
    row.className = "recipe-card";
    const details = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = recipe.name;
    const description = document.createElement("p");
    description.textContent = recipe.description;
    const costs = document.createElement("small");
    costs.textContent = `${Object.entries(recipe.materials).map(([id, amount]) => `${materials[id].name} ${countItem(id)}/${amount}`).join(" · ")} · $${recipe.cost}`;
    details.append(title, description, costs);
    const craft = document.createElement("button");
    craft.type = "button";
    craft.className = "small-button craft-button";
    craft.textContent = "Craft";
    craft.disabled = state.money < recipe.cost || Object.entries(recipe.materials).some(([id, amount]) => countItem(id) < amount) || (gear[recipe.output] && countItem(recipe.output) > 0);
    craft.addEventListener("click", () => craftRecipe(recipe.id));
    row.append(details, craft);
    list.append(row);
  }
}

function renderMissions() {
  const list = $("#mission-list");
  list.replaceChildren();
  for (const mission of missions) {
    const progress = Math.min(state.stats[mission.stat], mission.target);
    const claimed = state.claimedMissions.includes(mission.id);
    const row = document.createElement("article");
    row.className = `mission-card${claimed ? " mission-complete" : ""}`;
    const top = document.createElement("div");
    top.className = "mission-top";
    const name = document.createElement("b");
    name.textContent = mission.name;
    const count = document.createElement("span");
    count.textContent = claimed ? "CLAIMED" : `${progress} / ${mission.target}`;
    top.append(name, count);
    const description = document.createElement("p");
    description.textContent = mission.detail;
    const meter = document.createElement("div");
    meter.className = "mission-meter";
    const fill = document.createElement("span");
    fill.style.width = `${progress / mission.target * 100}%`;
    meter.append(fill);
    const reward = document.createElement("small");
    reward.textContent = `Reward · $${mission.reward} + ${mission.xp} XP`;
    row.append(top, description, meter, reward);
    list.append(row);
  }
}

function renderBattle() {
  const list = $("#enemy-list");
  list.replaceChildren();
  for (const [id, enemy] of Object.entries(enemies)) {
    const bossReady = equipmentPower() >= 18 && state.level >= 3;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `enemy-card${enemy.boss ? " boss-card" : ""}${state.encounter?.id === id ? " enemy-selected" : ""}`;
    button.disabled = Boolean(state.encounter) || (enemy.boss && !bossReady);
    const icon = document.createElement("span");
    icon.className = "enemy-icon";
    icon.textContent = enemy.icon;
    const copy = document.createElement("span");
    copy.className = "enemy-copy";
    const name = document.createElement("b");
    name.textContent = enemy.name;
    const info = document.createElement("small");
    info.textContent = enemy.boss && !bossReady ? "Requires level 3 · power 18" : `${enemy.kind} · ${enemy.health} health`;
    copy.append(name, info);
    const arrow = document.createElement("span");
    arrow.className = "enemy-arrow";
    arrow.textContent = enemy.boss && !bossReady ? "LOCKED" : "FIGHT →";
    button.append(icon, copy, arrow);
    button.addEventListener("click", () => beginFight(id));
    list.append(button);
  }

  const encounter = state.encounter;
  const enemy = encounter ? enemies[encounter.id] : null;
  $("#battle-title").textContent = enemy ? enemy.name : "The trail is quiet.";
  $("#battle-description").textContent = enemy ? `${enemy.kind} · Victory earns $${enemy.reward} and ${enemy.xp} experience.` : "Pick a creature on the left to begin. Bosses require proper gear and a steady hand.";
  $("#battle-state").textContent = enemy ? "IN THE GULCH" : "NO ENCOUNTER";
  $("#enemy-health-label").textContent = enemy ? enemy.name.toUpperCase() : "ENEMY";
  $("#enemy-health-value").textContent = enemy ? `${encounter.health} / ${enemy.health}` : "—";
  $("#enemy-health-bar").style.width = enemy ? `${Math.max(0, encounter.health) / enemy.health * 100}%` : "0%";
  $("#battle-player-health").textContent = `${state.health} / 100`;
  $("#battle-health-bar").style.width = `${state.health}%`;
  $("#attack-button").disabled = !encounter || state.health <= 0;
  $("#retreat-button").disabled = !encounter;
  $("#attack-button").textContent = encounter ? "Strike" : "Choose a foe";
  const log = $("#battle-log");
  log.replaceChildren();
  const entries = state.battleLog.length ? state.battleLog : ["Wind stirs the sagebrush."];
  for (const message of entries.slice(0, 8)) {
    const entry = document.createElement("li");
    entry.textContent = message;
    log.append(entry);
  }
}

function render() {
  $("#money-value").textContent = `$${state.money}`;
  $("#energy-value").textContent = `${state.energy} / 100`;
  $("#health-value").textContent = `${state.health} / 100`;
  $("#energy-bar").style.width = `${state.energy}%`;
  $("#health-bar").style.width = `${state.health}%`;
  $("#level").textContent = `LVL ${state.level} · ${state.xp}/${state.level * 70} XP`;
  $("#jobs-count").textContent = `${state.jobsDone.length} / 3 JOBS TODAY`;
  $("#quest-progress").textContent = `${Math.min(state.jobsDone.length, 3)} / 3`;
  $("#quest-bar").style.width = `${Math.min(state.jobsDone.length, 3) / 3 * 100}%`;
  $("#quest-check").textContent = state.jobsDone.length >= 3 ? "✓" : "·";
  $("#quest-check").classList.toggle("complete", state.jobsDone.length >= 3);
  $("#day-label").textContent = `DAY ${String(state.day).padStart(2, "0")}`;

  for (const [id, job] of Object.entries(jobs)) {
    const button = document.querySelector(`[data-job="${id}"]`);
    const card = document.querySelector(`[data-job-card="${id}"]`);
    const completed = state.jobsDone.includes(id);
    const active = state.activeJob?.id === id;
    const activeSeconds = active ? Math.ceil(Math.max(0, state.activeJob.finishesAt - Date.now()) / 1000) : 0;
    const activeTime = `${String(Math.floor(activeSeconds / 60)).padStart(2, "0")}:${String(activeSeconds % 60).padStart(2, "0")}`;
    button.disabled = completed || state.jobsDone.length >= 3 || Boolean(state.activeJob);
    button.textContent = active ? `Working… ${activeTime}` : completed ? "Done for today" : state.jobsDone.length >= 3 ? "Board is clear" : state.activeJob ? "Another job in progress" : "Take the job →";
    card.classList.toggle("completed", completed);
    card.classList.toggle("job-active", active);
    if (!active) card.style.removeProperty("--job-progress");
    card.classList.toggle("board-closed", !completed && state.jobsDone.length >= 3);
    card.dataset.energyCost = job.cost;
  }

  $("#route-title").textContent = routes[state.route].name;
  $("#route-description").textContent = routes[state.route].description;
  $("#explore-button").disabled = state.energy < routes[state.route].cost || Boolean(state.activeJob);
  $("#explore-button").title = state.activeJob ? "Finish your current job before heading out." : state.energy < routes[state.route].cost ? "Rest at the saloon to get more energy." : "";
  $("#rest-button").disabled = state.money < 6 || (state.energy >= 100 && state.health >= 100) || Boolean(state.activeJob);
  $("#day-button").disabled = state.jobsDone.length < 3 || Boolean(state.activeJob);
  renderInventory();
  renderRecipes();
  renderMissions();
  renderBattle();
}

function addBattleNote(message) {
  state.battleLog.unshift(message);
  state.battleLog = state.battleLog.slice(0, 12);
}

function gainExperience(amount) {
  state.xp += amount;
  while (state.xp >= state.level * 70) {
    state.xp -= state.level * 70;
    state.level += 1;
    state.health = Math.min(100, state.health + 12);
    addNote(`You made level ${state.level}. The town knows your name now.`);
    showToast(`Level up! You're now level ${state.level}.`);
  }
}

function updateMissions() {
  for (const mission of missions) {
    if (state.stats[mission.stat] < mission.target || state.claimedMissions.includes(mission.id)) continue;
    state.claimedMissions.push(mission.id);
    state.money += mission.reward;
    gainExperience(mission.xp);
    addNote(`Mission complete: "${mission.name}". The ledger paid $${mission.reward}.`);
    showToast(`Mission complete: ${mission.name} · +$${mission.reward}`);
  }
}

function claimDailyBonus() {
  if (state.jobsDone.length >= 3 && !state.questClaimed) {
    state.money += 30;
    state.questClaimed = true;
    addNote("The town clerk added a $30 daily bonus to your pay.");
    showToast("Three jobs done! The clerk's $30 bonus is yours.");
  }
}

function giveJobDrop(job) {
  const roll = Math.random();
  if (roll < 0.03) {
    const rareId = "lucky-spur";
    addItem(rareId);
    return `A lucky find: ${gear[rareId].name}!`;
  }
  if (roll < 0.18) {
    const find = Math.random() < 0.5 ? "healing-tonic" : "biscuit";
    addItem(find);
    return `Found ${itemInfo(find).name}.`;
  }
  if (roll < 0.98) {
    const first = job.materials[Math.floor(Math.random() * job.materials.length)];
    const firstAmount = Math.random() < 0.35 ? 2 : 1;
    addItem(first, firstAmount);
    state.stats.materialsGathered += firstAmount;
    const second = job.materials[Math.floor(Math.random() * job.materials.length)];
    let secondDrop = "";
    if (Math.random() < 0.42) {
      addItem(second, 1);
      state.stats.materialsGathered += 1;
      secondDrop = `, ${materials[second].name} ×1`;
    }
    return `Gathered materials: ${materials[first].name} ×${firstAmount}${secondDrop}.`;
  }
  const find = Math.random() < 0.65 ? "iron-peacemaker" : "redhide-vest";
  if (countItem(find) > 0) {
    const scrap = "scrap";
    addItem(scrap, 3);
    state.stats.materialsGathered += 3;
    return `Nothing new, but you salvaged ${materials[scrap].name} ×3.`;
  }
  addItem(find);
  return `A fine find! ${gear[find].name} (${gear[find].rarity}).`;
}

function finishJob() {
  const id = state.activeJob?.id;
  if (!id) return;
  const job = jobs[id];
  state.activeJob = null;
  state.jobsDone.push(id);
  state.money += job.reward;
  state.stats.jobsCompleted += 1;
  gainExperience(job.xp);
  const drop = giveJobDrop(job);
  addNote(`Finished "${job.name}" for $${job.reward}. ${drop}`);
  updateMissions();
  claimDailyBonus();
  showToast(`Job complete: ${job.name}. ${drop}`);
  saveState();
  render();
}

function updateJobTimer() {
  if (!state.activeJob) {
    window.clearInterval(jobTimer);
    jobTimer = null;
    return;
  }
  const remaining = Math.max(0, state.activeJob.finishesAt - Date.now());
  const progress = Math.min(100, Math.max(0, (Date.now() - state.activeJob.startedAt) / JOB_DURATION * 100));
  document.querySelector(`[data-job-card="${state.activeJob.id}"]`)?.style.setProperty("--job-progress", `${progress}%`);
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const button = document.querySelector(`[data-job="${state.activeJob.id}"]`);
  if (button) button.textContent = `Working… ${minutes}:${seconds}`;
  if (remaining === 0) {
    window.clearInterval(jobTimer);
    jobTimer = null;
    finishJob();
  }
}

function takeJob(id) {
  const job = jobs[id];
  if (!job || state.jobsDone.includes(id) || state.jobsDone.length >= 3 || state.activeJob) return;
  if (state.energy < job.cost) {
    showToast("You're running low. Take a breather at the saloon first.");
    return;
  }
  state.energy -= job.cost;
  state.activeJob = { id, startedAt: Date.now(), finishesAt: Date.now() + JOB_DURATION };
  addNote(`Started "${job.name}". The work will take about one minute.`);
  showToast(`You're on the clock: ${job.name}.`);
  saveState();
  render();
  updateJobTimer();
  jobTimer = window.setInterval(updateJobTimer, 250);
}

function explore() {
  const route = routes[state.route];
  if (state.activeJob) return;
  if (state.energy < route.cost) {
    showToast("Not quite enough energy for that trail. Rest up first.");
    return;
  }
  state.energy -= route.cost;
  gainExperience(8);
  const roll = Math.random();
  let message;
  if (roll < route.danger) {
    const lostHealth = Math.min(state.health - 1, 8);
    state.health -= Math.max(0, lostHealth);
    message = "A rattlesnake sent you scrambling. You made it back, a little worse for wear.";
  } else if (roll < route.danger + 0.4) {
    const id = Math.random() < 0.5 ? "herbs" : "scrap";
    const amount = Math.random() < 0.4 ? 2 : 1;
    addItem(id, amount);
    state.stats.materialsGathered += amount;
    updateMissions();
    message = `You found ${materials[id].name} along the trail.`;
  } else {
    const [min, max] = route.coins;
    const found = Math.floor(Math.random() * (max - min + 1)) + min;
    state.money += found;
    message = `The trail paid off: you found $${found} in loose change.`;
  }
  addNote(message);
  showToast(message);
  saveState();
  render();
}

function equipItem(id) {
  const item = gear[id];
  if (!item || countItem(id) < 1) return;
  state.equipped[item.type] = id;
  addNote(`Equipped ${item.name} (${item.slot}).`);
  showToast(`${item.name} equipped.`);
  saveState();
  render();
}

function useItem(id) {
  if (!countItem(id)) return;
  if (id === "biscuit") {
    if (state.energy >= 100) {
      showToast("You're already full of energy. Save those biscuits for the trail.");
      return;
    }
    state.energy = Math.min(100, state.energy + 25);
    removeItem(id);
    addNote("A quick snack before heading back out. (+25 energy)");
    showToast("That hit the spot. +25 energy.");
  } else if (id === "healing-tonic") {
    if (!state.encounter) {
      showToast("Save the tonic for a fight. It restores health during combat.");
      return;
    }
    if (state.health >= 100) {
      showToast("You're already at full health. Save the tonic for a rougher round.");
      return;
    }
    state.health = Math.min(100, state.health + 35);
    removeItem(id);
    addBattleNote("You drank a frontier tonic and recovered 35 health.");
    addNote("Used a frontier tonic in the gulch.");
    showToast("+35 health.");
  }
  saveState();
  render();
}

function craftRecipe(id) {
  const recipe = recipes.find((entry) => entry.id === id);
  if (!recipe || state.money < recipe.cost || Object.entries(recipe.materials).some(([material, quantity]) => countItem(material) < quantity)) {
    showToast("You don't have the materials or money for that recipe yet.");
    return;
  }
  if (gear[recipe.output] && countItem(recipe.output)) {
    showToast("You already have this piece of gear.");
    return;
  }
  for (const [material, quantity] of Object.entries(recipe.materials)) removeItem(material, quantity);
  state.money -= recipe.cost;
  addItem(recipe.output);
  state.stats.itemsCrafted += 1;
  addNote(`Crafted ${itemInfo(recipe.output).name} at the workbench.`);
  updateMissions();
  showToast(`Crafted ${itemInfo(recipe.output).name}.`);
  saveState();
  render();
}

function rest() {
  if (state.activeJob || state.money < 6 || (state.energy >= 100 && state.health >= 100)) return;
  state.money -= 6;
  const recovered = Math.min(30, 100 - state.energy);
  const healed = Math.min(10, 100 - state.health);
  state.energy += recovered;
  state.health += healed;
  addNote(`Coffee at the Lantern. +${recovered} energy and +${healed} health.`);
  showToast(`A hot coffee and a quiet chair. +${recovered} energy, +${healed} health.`);
  saveState();
  render();
}

function startNewDay() {
  if (state.jobsDone.length < 3 || state.activeJob) return;
  state.day += 1;
  state.energy = Math.min(100, state.energy + 60);
  state.health = Math.min(100, state.health + 25);
  state.jobsDone = [];
  state.questClaimed = false;
  addNote(`Day ${state.day} dawned over Dry Creek. The job board is fresh again.`);
  showToast(`Good morning. Day ${state.day} begins.`);
  saveState();
  render();
}

function beginFight(id) {
  const enemy = enemies[id];
  if (!enemy || state.encounter) return;
  if (enemy.boss && (equipmentPower() < 18 || state.level < 3)) {
    showToast("Ironjaw won't budge. Reach level 3 and bring equipment power 18.");
    return;
  }
  if (state.health <= 0) {
    showToast("Rest at the Lantern before picking another fight.");
    return;
  }
  state.encounter = { id, health: enemy.health };
  state.battleLog = [`${enemy.name} squares up. You draw your ${gear[state.equipped.weapon]?.name || "fists"}.`];
  addNote(`You entered the gulch to face ${enemy.name}.`);
  saveState();
  render();
}

function winFight(enemy) {
  state.money += enemy.reward;
  gainExperience(enemy.xp);
  state.stats.monstersDefeated += 1;
  if (enemy.boss) state.stats.bossesDefeated += 1;
  const rewardRoll = Math.random();
  let loot = "";
  if (enemy.boss) {
    addItem("ironjaw-trophy");
    loot = " Ironjaw's tooth is yours.";
    if (!countItem("silver-star")) {
      addItem("silver-star");
      loot += " The marshal's silver star, too!";
    }
  } else if (rewardRoll < 0.2) {
    const id = Math.random() < 0.5 ? "hide" : "ore";
    addItem(id);
    state.stats.materialsGathered += 1;
    loot = ` Found ${materials[id].name}.`;
  } else if (rewardRoll < 0.25) {
    addItem("healing-tonic");
    loot = " Found a frontier tonic.";
  }
  state.encounter = null;
  addBattleNote(`${enemy.name} is beaten. You earned $${enemy.reward} and ${enemy.xp} XP.${loot}`);
  addNote(`Won a fight against ${enemy.name}. Earned $${enemy.reward}.${loot}`);
  updateMissions();
  showToast(`Victory! +$${enemy.reward}, +${enemy.xp} XP.${loot}`);
}

function attack() {
  const encounter = state.encounter;
  const enemy = encounter && enemies[encounter.id];
  if (!enemy || state.health <= 0) return;
  const weapon = gear[state.equipped.weapon];
  const armor = gear[state.equipped.armor];
  const charm = gear[state.equipped.charm];
  const damage = Math.max(1, (weapon?.power || 1) + Math.floor((charm?.power || 0) / 2) + Math.floor(Math.random() * 4) - 1);
  encounter.health = Math.max(0, encounter.health - damage);
  addBattleNote(`You strike for ${damage} damage.`);
  if (encounter.health <= 0) {
    winFight(enemy);
    saveState();
    render();
    return;
  }
  const incoming = Math.max(1, enemy.attack - Math.floor((armor?.power || 0) * 0.55) - Math.floor((charm?.power || 0) / 3));
  state.health = Math.max(0, state.health - incoming);
  addBattleNote(`${enemy.name} hits back for ${incoming} damage.`);
  if (state.health <= 0) {
    state.encounter = null;
    state.health = 0;
    addBattleNote("You were driven from the gulch. Ada will patch you up for $20.");
    addNote("The gulch got the better of you. Rest at the Lantern to recover.");
    showToast("Knocked out! The saloon can patch you up for $20.");
  }
  saveState();
  render();
}

function retreat() {
  if (!state.encounter) return;
  const name = enemies[state.encounter.id].name;
  state.encounter = null;
  addBattleNote(`You slipped away from ${name}.`);
  showToast("You made it out in one piece.");
  saveState();
  render();
}

function restAtZeroHealth() {
  if (state.health > 0) return false;
  if (state.money < 20) {
    showToast("You need $20 for Ada to patch you up.");
    return true;
  }
  state.money -= 20;
  state.health = 40;
  addNote("Ada patched you up and charged $20.");
  showToast("Back on your feet. Take care out there.");
  saveState();
  render();
  return true;
}

function selectTab(name) {
  document.querySelectorAll("[data-tab]").forEach((tab) => {
    const selected = tab.dataset.tab === name;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
  if (name === "combat" && state.health <= 0) $("#rest-button").focus();
  saveState();
}

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll("[data-tab]")];
    const index = tabs.indexOf(tab);
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    selectTab(next.dataset.tab);
  });
});

document.querySelectorAll("[data-job]").forEach((button) => button.addEventListener("click", () => takeJob(button.dataset.job)));
document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => {
    state.route = button.dataset.route;
    document.querySelectorAll("[data-route]").forEach((routeButton) => {
      const selected = routeButton === button;
      routeButton.classList.toggle("selected", selected);
      routeButton.setAttribute("aria-pressed", String(selected));
    });
    saveState();
    render();
  });
});

$("#explore-button").addEventListener("click", explore);
$("#rest-button").addEventListener("click", () => {
  if (!restAtZeroHealth()) rest();
});
$("#day-button").addEventListener("click", startNewDay);
$("#attack-button").addEventListener("click", attack);
$("#retreat-button").addEventListener("click", retreat);

if (state.activeJob) {
  if (state.activeJob.finishesAt <= Date.now()) finishJob();
  else {
    updateJobTimer();
    jobTimer = window.setInterval(updateJobTimer, 250);
  }
}
render();
