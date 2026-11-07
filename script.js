const SAVE_KEY = "dust-and-daybreak-save-v2";
const JOB_DURATION = 60_000;
const JOB_DROP_CHANCES = { rare: 0.03, supply: 0.15, materials: 0.8, fine: 0.02 };
const EXTRA_MATERIAL_CHANCE = 0.42;
const materials = {
  timber: { name: "Rough-cut timber", shortName: "Timber", icon: "▤", detail: "Useful wood, cut from whatever will burn." },
  scrap: { name: "Iron scrap", shortName: "Scrap", icon: "⌁", detail: "Bent nails, old fittings, and workable iron." },
  hide: { name: "Tanned hide", shortName: "Hide", icon: "▧", detail: "Tough leather, still carrying the smell of the trail." },
  ore: { name: "Copper ore", shortName: "Copper ore", icon: "◆", detail: "A few bright veins from the red hills." },
  herbs: { name: "Wild herbs", shortName: "Herbs", icon: "✿", detail: "Bitter leaves with a knack for closing a wound." },
};

const gear = {
  "old-revolver": { name: "Old revolver", type: "weapon", slot: "Weapon", power: 3, damage: [4, 7], rarity: "common", icon: "♧", detail: "A faithful six-shooter with a loose sight." },
  "patched-coat": { name: "Patched trail coat", type: "armor", slot: "Coat", power: 2, armor: 2, rarity: "common", icon: "▤", detail: "More patches than original cloth. Still keeps the wind off." },
  "iron-peacemaker": { name: "Deadeye Peacemaker", type: "weapon", slot: "Weapon", power: 8, damage: [7, 11], damageBonus: 8, aim: 5, set: "deadeye", rarity: "uncommon", icon: "♧", detail: "A hand-fitted revolver with a steady pull." },
  "redhide-vest": { name: "Trailblazer's field vest", type: "armor", slot: "Coat", power: 7, armor: 5, damageBonus: 3, aim: 2, dodge: 2, set: "trailblazer", rarity: "uncommon", icon: "▧", detail: "A balanced hide vest for long days on the open trail." },
  "lucky-spur": { name: "Prospector's lucky spur", type: "charm", slot: "Charm", power: 3, damageBonus: 4, aim: 3, rarity: "rare", icon: "✧", detail: "Adds a little bite to your strikes and a little luck." },
  "ironjaw-trophy": { name: "Ironjaw's tooth", type: "charm", slot: "Charm", power: 5, damageBonus: 5, armor: 2, set: "ironbark", rarity: "epic", icon: "◆", detail: "A heavy trophy from a very bad-tempered bear." },
  "silver-star": { name: "Ironbark ranger's badge", type: "charm", slot: "Charm", power: 12, armor: 5, dodge: 5, set: "ironbark", rarity: "epic", icon: "✦", detail: "A marshal's badge worn by the toughest trail wardens." },
  "scout-hat": { name: "Trailblazer's broadbrim", type: "hat", slot: "Hat", power: 4, armor: 2, damageBonus: 2, aim: 3, dodge: 2, set: "trailblazer", rarity: "uncommon", icon: "♧", detail: "A practical hat for the all-around traveler." },
  "ranger-duster": { name: "Deadeye's long duster", type: "armor", slot: "Coat", power: 11, armor: 2, damageBonus: 9, aim: 8, set: "deadeye", rarity: "rare", icon: "▧", detail: "A gunslinger's coat, cut for a clean sightline." },
  "trail-boots": { name: "Ironbark trail boots", type: "boots", slot: "Boots", power: 5, armor: 4, dodge: 8, set: "ironbark", rarity: "uncommon", icon: "⌁", detail: "Heavy-soled boots with a sure, stubborn stance." },
  "longshot-rifle": { name: "Deadeye Longshot", type: "weapon", slot: "Weapon", power: 15, damage: [12, 18], damageBonus: 10, aim: 12, set: "deadeye", rarity: "rare", icon: "♧", detail: "A tuned rifle that rewards a patient shot." },
  "marshal-coat": { name: "Ironbark marshal's coat", type: "armor", slot: "Coat", power: 18, armor: 16, dodge: 5, set: "ironbark", rarity: "epic", icon: "✦", detail: "Heavy frontier armor built to hold a line." },
  "scattergun": { name: "Deadeye Gulch scattergun", type: "weapon", slot: "Weapon", power: 22, damage: [17, 25], damageBonus: 15, aim: 4, set: "deadeye", rarity: "epic", icon: "♧", detail: "An up-close answer to a very large problem." },
  "gunslingers-gloves": { name: "Deadeye draw gloves", type: "gloves", slot: "Gloves", power: 9, damageBonus: 8, aim: 8, set: "deadeye", rarity: "rare", icon: "✧", detail: "Supple leather for a steadier draw." },
  "trailblazer-boots": { name: "Trailblazer's riding boots", type: "boots", slot: "Boots", power: 5, armor: 3, damageBonus: 2, aim: 2, dodge: 3, set: "trailblazer", rarity: "uncommon", icon: "⌁", detail: "Comfortable, reliable boots for every kind of country." },
  "trailblazer-gloves": { name: "Trailblazer's work gloves", type: "gloves", slot: "Gloves", power: 4, armor: 2, damageBonus: 2, aim: 2, dodge: 2, set: "trailblazer", rarity: "uncommon", icon: "✧", detail: "A little protection and a sure grip, wherever the road leads." },
  "deadeye-hat": { name: "Deadeye's sightline hat", type: "hat", slot: "Hat", power: 7, damageBonus: 5, aim: 12, set: "deadeye", rarity: "rare", icon: "♧", detail: "A low crown and a wide brim help keep your eye on the mark." },
  "ironbark-hood": { name: "Ironbark scout hood", type: "hat", slot: "Hat", power: 6, armor: 5, dodge: 5, set: "ironbark", rarity: "uncommon", icon: "▤", detail: "Reinforced leather that turns brush and blows alike." },
  "ironbark-gloves": { name: "Ironbark guard gloves", type: "gloves", slot: "Gloves", power: 7, armor: 4, dodge: 6, set: "ironbark", rarity: "rare", icon: "✧", detail: "Thick hide and a firm grip; built to stay standing." },
};

const gearSets = {
  trailblazer: {
    name: "Trailblazer set",
    pieceThreshold: 2,
    twoPiece: { armor: 2, damageBonus: 2, aim: 2, dodge: 2 },
    fullSet: { armor: 4, damageBonus: 4, aim: 4, dodge: 4 },
    slots: ["redhide-vest", "scout-hat", "trailblazer-boots", "trailblazer-gloves"],
  },
  deadeye: {
    name: "Deadeye set",
    pieceThreshold: 2,
    twoPiece: { damageBonus: 8, aim: 6 },
    fullSet: { damageBonus: 12, aim: 10 },
    slots: ["iron-peacemaker", "ranger-duster", "longshot-rifle", "scattergun", "gunslingers-gloves", "deadeye-hat"],
  },
  ironbark: {
    name: "Ironbark set",
    pieceThreshold: 2,
    twoPiece: { armor: 4, dodge: 6 },
    fullSet: { armor: 7, dodge: 10 },
    slots: ["silver-star", "trail-boots", "marshal-coat", "ironbark-hood", "ironbark-gloves"],
  },
};

const recipes = [
  { id: "iron-peacemaker", name: "Iron Peacemaker", description: "A dependable upgrade for the gulch.", cost: 25, level: 1, materials: { scrap: 5, timber: 2 }, output: "iron-peacemaker" },
  { id: "redhide-vest", name: "Redhide vest", description: "Protection against claws and bad decisions.", cost: 30, level: 1, materials: { hide: 4, scrap: 2 }, output: "redhide-vest" },
  { id: "healing-tonic", name: "Frontier tonic", description: "Restore 35 health during a fight.", cost: 12, level: 1, materials: { herbs: 3 }, output: "healing-tonic" },
  { id: "scout-hat", name: "Trailblazer's broadbrim", description: "A practical all-around set piece.", cost: 48, level: 2, materials: { hide: 3, timber: 3, ore: 1 }, output: "scout-hat" },
  { id: "trail-boots", name: "Ironbark trail boots", description: "Armor and dodge for the Ironbark set.", cost: 55, level: 3, materials: { hide: 5, scrap: 3 }, output: "trail-boots" },
  { id: "ranger-duster", name: "Deadeye's long duster", description: "Damage and aim for the Deadeye set.", cost: 90, level: 4, materials: { hide: 8, ore: 4, scrap: 5 }, output: "ranger-duster" },
  { id: "gunslingers-gloves", name: "Deadeye draw gloves", description: "Quicker hands; steadier shots.", cost: 115, level: 5, materials: { hide: 7, ore: 5, timber: 4 }, output: "gunslingers-gloves" },
  { id: "longshot-rifle", name: "Deadeye Longshot", description: "A long-range upgrade for a sure eye.", cost: 160, level: 6, materials: { ore: 10, scrap: 8, timber: 6 }, output: "longshot-rifle" },
  { id: "trailblazer-boots", name: "Trailblazer's riding boots", description: "Balanced protection for the Trailblazer set.", cost: 105, level: 3, materials: { hide: 5, timber: 3, scrap: 2 }, output: "trailblazer-boots" },
  { id: "trailblazer-gloves", name: "Trailblazer's work gloves", description: "A balanced set piece for any kind of work.", cost: 115, level: 4, materials: { hide: 5, timber: 4, scrap: 2 }, output: "trailblazer-gloves" },
  { id: "deadeye-hat", name: "Deadeye's sightline hat", description: "A precise hat for the Deadeye set.", cost: 150, level: 5, materials: { hide: 5, ore: 4, timber: 2 }, output: "deadeye-hat" },
  { id: "ironbark-hood", name: "Ironbark scout hood", description: "Armor and dodge for the Ironbark set.", cost: 155, level: 5, materials: { hide: 6, scrap: 4, ore: 2 }, output: "ironbark-hood" },
  { id: "ironbark-gloves", name: "Ironbark guard gloves", description: "The final piece for a sturdy Ironbark kit.", cost: 225, level: 7, materials: { hide: 8, scrap: 6, ore: 4 }, output: "ironbark-gloves" },
];

const jobs = {
  mail: { name: "Letters for Red Mesa", description: "Ride the ridge trail and bring the postmaster's reply back safe.", category: "DELIVERY · EASY", icon: "✉", cost: 12, reward: 24, xp: 18, level: 1, materials: ["timber", "herbs"], materialAmount: [2, 3], supplies: ["biscuit"], rare: ["lucky-spur"], fine: ["scout-hat"] },
  ranch: { name: "Fence-line trouble", description: "Old Man Bell says coyotes found a gap in the south pasture.", category: "RANCH HAND · STEADY", icon: "✳", cost: 20, reward: 39, xp: 28, level: 1, materials: ["hide", "timber", "scrap"], materialAmount: [1, 2], supplies: ["biscuit"], rare: ["ironbark-hood"], fine: ["redhide-vest"] },
  saloon: { name: "Last call at the Lantern", description: "Help Ada close up before the piano player starts another round.", category: "TOWN DUTY · LIVELY", icon: "♠", cost: 26, reward: 52, xp: 36, level: 1, materials: ["scrap", "herbs"], materialAmount: [1, 3], supplies: ["healing-tonic"], rare: ["trailblazer-boots"], fine: ["iron-peacemaker"] },
  stagecoach: { name: "Stagecoach escort", description: "Ride shotgun through the canyon and keep the passengers calm.", category: "ESCORT · DANGEROUS", icon: "⚑", cost: 30, reward: 72, xp: 48, level: 2, materials: ["scrap", "hide", "ore"], materialAmount: [2, 3], supplies: ["healing-tonic"], rare: ["lucky-spur"], fine: ["ranger-duster"] },
  mine: { name: "The old copper seam", description: "Help the miners shore up a tunnel and haul out the bright stuff.", category: "MINING · HARD WORK", icon: "◆", cost: 34, reward: 86, xp: 56, level: 3, materials: ["ore", "timber", "scrap"], materialAmount: [1, 2], supplies: ["biscuit", "healing-tonic"], rare: ["trail-boots"], fine: ["longshot-rifle"] },
  bounty: { name: "A name on the wanted board", description: "Track a road-agent to his hideout. Bring him back breathing.", category: "BOUNTY · COMBAT", icon: "♧", cost: 38, reward: 108, xp: 70, level: 4, materials: ["hide", "scrap", "ore"], materialAmount: [2, 3], supplies: ["healing-tonic"], rare: ["lucky-spur"], fine: ["gunslingers-gloves"] },
  railguard: { name: "Night train watch", description: "Walk the freight cars after dark. Something's been stealing cargo.", category: "RAILROAD · EXPERT", icon: "▰", cost: 42, reward: 138, xp: 88, level: 5, materials: ["scrap", "ore", "hide"], materialAmount: [3, 4], supplies: ["healing-tonic", "biscuit"], rare: ["ironjaw-trophy"], fine: ["marshal-coat", "scattergun"] },
  telegram: { name: "Wire to the territory", description: "Repair a downed telegraph line before the storm rolls in.", category: "TERRITORY · MASTER", icon: "⌁", cost: 46, reward: 175, xp: 110, level: 6, materials: ["timber", "ore", "scrap"], materialAmount: [1, 2], supplies: ["healing-tonic"], rare: ["silver-star"], fine: ["scattergun"] },
};

const shopStock = [
  { id: "biscuit", name: "Trail biscuits", description: "+25 energy", price: 8, level: 1, icon: "▤", consumable: true },
  { id: "healing-tonic", name: "Frontier tonic", description: "Restore 35 health in combat", price: 24, level: 1, icon: "✿", consumable: true },
  { id: "scout-hat", name: "Trailblazer's broadbrim", description: "Balanced set · +2% damage, +2 armor, +3% aim, +2% dodge", price: 95, level: 2, icon: "♧" },
  { id: "trail-boots", name: "Ironbark trail boots", description: "Ironbark set · +4 armor · +8% dodge", price: 125, level: 3, icon: "⌁" },
  { id: "trailblazer-boots", name: "Trailblazer's riding boots", description: "Balanced set · +2% damage, +3 armor, +2% aim, +3% dodge", price: 145, level: 3, icon: "⌁" },
  { id: "ranger-duster", name: "Deadeye's long duster", description: "Deadeye set · +9% damage · +8% aim", price: 240, level: 4, icon: "▧" },
  { id: "trailblazer-gloves", name: "Trailblazer's work gloves", description: "Balanced set · +2% damage, +2 armor, +2% aim, +2% dodge", price: 160, level: 4, icon: "✧" },
  { id: "gunslingers-gloves", name: "Deadeye draw gloves", description: "Deadeye set · +8% damage · +8% aim", price: 285, level: 5, icon: "✧" },
  { id: "deadeye-hat", name: "Deadeye's sightline hat", description: "Deadeye set · +5% damage · +12% aim", price: 320, level: 5, icon: "♧" },
  { id: "ironbark-hood", name: "Ironbark scout hood", description: "Ironbark set · +5 armor · +5% dodge", price: 330, level: 5, icon: "▤" },
  { id: "longshot-rifle", name: "Deadeye Longshot", description: "12-18 damage · +10% damage · +12% aim", price: 420, level: 6, icon: "♧" },
  { id: "marshal-coat", name: "Ironbark marshal's coat", description: "Ironbark set · +16 armor · +5% dodge", price: 550, level: 7, icon: "✦" },
  { id: "ironbark-gloves", name: "Ironbark guard gloves", description: "Ironbark set · +4 armor · +6% dodge", price: 580, level: 7, icon: "✧" },
  { id: "scattergun", name: "Deadeye Gulch scattergun", description: "17-25 damage · +15% damage · Deadeye set", price: 720, level: 8, icon: "♧" },
];

const routes = {
  creek: { name: "Take the creek path", description: "A short ramble with a chance of pocket change or something useful.", cost: 10, danger: 0.04, coins: [4, 17] },
  mesa: { name: "Ride for Red Mesa", description: "A longer ride, but the old trail has a way of giving things back.", cost: 18, danger: 0.12, coins: [10, 32] },
  pines: { name: "Wander the pines", description: "Keep your ears open. The quiet trails can hide a surprise or two.", cost: 15, danger: 0.19, coins: [7, 26] },
};

const enemies = {
  coyote: { name: "Ridgeback coyote", kind: "BEAST · COMMON", health: 25, attack: 5, evasion: 6, reward: 18, xp: 18, icon: "♧", boss: false },
  outlaw: { name: "Gulch road-agent", kind: "OUTLAW · TOUGH", health: 48, attack: 10, evasion: 12, reward: 42, xp: 36, icon: "♠", boss: false },
  ironjaw: { name: "Ironjaw, the old bear", kind: "BOSS · LEGENDARY", health: 125, attack: 18, evasion: 8, reward: 180, xp: 120, icon: "◆", boss: true },
};

const missions = [
  { id: "steady-work", name: "A steady hand", detail: "Complete 3 jobs.", target: 3, stat: "jobsCompleted", reward: 45, xp: 25 },
  { id: "supply-run", name: "Stock the workbench", detail: "Gather 12 raw materials.", target: 12, stat: "materialsGathered", reward: 55, xp: 30 },
  { id: "craftsman", name: "Make something of it", detail: "Craft 2 recipes.", target: 2, stat: "itemsCrafted", reward: 70, xp: 40 },
  { id: "gulch-clear", name: "Keep the gulch clear", detail: "Win 5 frontier fights.", target: 5, stat: "monstersDefeated", reward: 85, xp: 55 },
  { id: "ironjaw", name: "A name in the ledger", detail: "Defeat Ironjaw.", target: 1, stat: "bossesDefeated", reward: 150, xp: 100 },
];

const dailySideMissions = [
  { id: "scavenger", name: "Scrounge the countryside", detail: "Gather 4 raw materials.", progress: "materials", target: 4 },
  { id: "scout", name: "Stretch your legs", detail: "Explore 2 trails.", progress: "explorations", target: 2 },
  { id: "bounty", name: "Show some grit", detail: "Win 1 fight in the gulch.", progress: "fights", target: 1 },
];

function freshDailyProgress() {
  return { jobs: 0, materials: 0, explorations: 0, fights: 0 };
}

function materialDemand(id) {
  const usingRecipes = recipes.filter((recipe) => recipe.materials[id]);
  const total = usingRecipes.reduce((sum, recipe) => sum + recipe.materials[id], 0);
  return `Used in ${usingRecipes.length} ${usingRecipes.length === 1 ? "recipe" : "recipes"} · ${total} needed`;
}

function freshState() {
  return {
    money: 85, energy: 70, health: 100, xp: 0, level: 1, day: 1, jobsDone: [],
    route: "creek", questClaimed: false, dailyProgress: freshDailyProgress(), activeJob: null, encounter: null, battleLog: [],
    inventory: [
      { id: "old-revolver", quantity: 1 },
      { id: "patched-coat", quantity: 1 },
      { id: "biscuit", quantity: 2 },
    ],
    equipped: { weapon: "old-revolver", armor: "patched-coat", hat: null, boots: null, charm: null, gloves: null },
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
      questClaimed: saved.dailyProgress ? Boolean(saved.questClaimed) : false,
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
      dailyProgress: { ...freshDailyProgress(), ...(saved.dailyProgress || {}) },
      claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
      activeJob: saved.activeJob && Object.hasOwn(jobs, saved.activeJob.id) && Number.isFinite(saved.activeJob.finishesAt)
        ? { ...saved.activeJob, startedAt: Number.isFinite(saved.activeJob.startedAt) ? saved.activeJob.startedAt : saved.activeJob.finishesAt - JOB_DURATION }
        : null,
      encounter: saved.encounter && Object.hasOwn(enemies, saved.encounter.id) ? saved.encounter : null,
      battleLog: Array.isArray(saved.battleLog) ? saved.battleLog.slice(0, 12) : [],
    };
    for (const slot of ["weapon", "armor", "hat", "boots", "charm", "gloves"]) {
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
  if (materials[id]) return { ...materials[id], type: "material", rarity: materials[id].rarity || "material" };
  if (gear[id]) return gear[id];
  if (id === "biscuit") return { name: "Trail biscuits", icon: "▤", detail: "A little something for the long ride.", type: "consumable", rarity: "common" };
  if (id === "healing-tonic") return { name: "Frontier tonic", icon: "✿", detail: "Restore 35 health during a fight.", type: "consumable", rarity: "uncommon" };
  return null;
}

function equipmentPower() {
  return Object.values(state.equipped).reduce((total, id) => total + (id && gear[id] ? gear[id].power : 0), 0);
}

function equipmentStats() {
  const items = Object.values(state.equipped).map((id) => id && gear[id]).filter(Boolean);
  const stats = {
    armor: items.reduce((sum, item) => sum + (item.armor || 0), 0),
    damageBonus: items.reduce((sum, item) => sum + (item.damageBonus || 0), 0),
    aim: items.reduce((sum, item) => sum + (item.aim || 0), 0),
    dodge: items.reduce((sum, item) => sum + (item.dodge || 0), 0),
  };
  for (const [id, set] of Object.entries(gearSets)) {
    const pieces = items.filter((item) => item.set === id).length;
    if (pieces >= set.pieceThreshold) {
      for (const [stat, value] of Object.entries(set.twoPiece)) stats[stat] += value;
    }
    if (pieces >= 4) {
      for (const [stat, value] of Object.entries(set.fullSet)) stats[stat] += value;
    }
  }
  return stats;
}

function equippedSetCount(setId) {
  return Object.values(state.equipped).filter((id) => id && gear[id]?.set === setId).length;
}

function itemStats(item) {
  const stats = [];
  if (item.damage) stats.push(`${item.damage[0]}-${item.damage[1]} damage`);
  if (item.damageBonus) stats.push(`+${item.damageBonus}% damage`);
  if (item.armor) stats.push(`+${item.armor} armor`);
  if (item.aim) stats.push(`+${item.aim}% aim`);
  if (item.dodge) stats.push(`+${item.dodge}% dodge`);
  return stats.join(" · ");
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
    description.textContent = info.type === "material" ? info.detail : itemStats(info) || info.detail;
    details.append(name, description);
    if (info.type === "material") {
      const demand = document.createElement("small");
      demand.className = "material-demand";
      demand.textContent = materialDemand(entry.id);
      details.append(demand);
    }
    if (info.set && gearSets[info.set]) {
      const setLabel = document.createElement("small");
      setLabel.className = "set-item-label";
      setLabel.textContent = gearSets[info.set].name;
      details.append(setLabel);
    }
    row.append(icon, details);

    if (info.type === "material") {
      const count = document.createElement("span");
      count.className = "inventory-quantity";
      count.textContent = `×${entry.quantity}`;
      row.append(count);
    } else if (["weapon", "armor", "hat", "boots", "charm", "gloves"].includes(info.type)) {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "use-button";
      action.textContent = equipped(entry.id) ? "Equipped" : `Equip · ${info.power} power`;
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
    label.textContent = slot === "armor" ? "Coat" : slot;
    const item = document.createElement("b");
    item.textContent = id && gear[id] ? gear[id].name : "Empty";
    const power = document.createElement("span");
    power.className = "slot-power";
    power.textContent = id && gear[id] ? `+${gear[id].power}` : "—";
    if (id && gear[id]?.damage) {
      const damage = document.createElement("small");
      damage.className = "slot-damage";
      damage.textContent = `${gear[id].damage[0]}-${gear[id].damage[1]} dmg`;
      row.append(label, item, power, damage);
    } else {
      row.append(label, item, power);
    }
    slots.append(row);
  }
  $("#combat-power").textContent = `POWER ${equipmentPower()}`;
  $("#battle-power").textContent = equipmentPower();
  $("#character-level").textContent = state.level;
  const statList = $("#combat-stats");
  statList.replaceChildren();
  const stats = equipmentStats();
  for (const [label, value, suffix] of [
    ["Damage bonus", stats.damageBonus, "%"],
    ["Armor", stats.armor, ""],
    ["Aim", stats.aim, "%"],
    ["Dodge", stats.dodge, "%"],
  ]) {
    const stat = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    const amount = document.createElement("b");
    amount.textContent = `+${value}${suffix}`;
    stat.append(name, amount);
    statList.append(stat);
  }
  const setSummary = $("#set-bonuses");
  setSummary.replaceChildren();
  for (const [id, set] of Object.entries(gearSets)) {
    const pieces = equippedSetCount(id);
    const row = document.createElement("div");
    row.className = `set-bonus-row${pieces >= set.pieceThreshold ? " set-bonus-active" : ""}`;
    const title = document.createElement("b");
    title.textContent = `${set.name} · ${pieces}/4`;
    const bonus = document.createElement("small");
    const active = [];
    if (pieces >= set.pieceThreshold) active.push(`2-piece: ${formatSetStats(set.twoPiece)}`);
    if (pieces >= 4) active.push(`4-piece: ${formatSetStats(set.fullSet)}`);
    bonus.textContent = active.length ? active.join(" · ") : `Wear ${set.pieceThreshold} pieces to activate set bonus`;
    row.append(title, bonus);
    setSummary.append(row);
  }
}

function formatSetStats(stats) {
  return Object.entries(stats).map(([key, value]) => {
    const labels = { armor: "armor", damageBonus: "damage", aim: "aim", dodge: "dodge" };
    const suffix = key === "armor" ? "" : "%";
    return `+${value}${suffix} ${labels[key]}`;
  }).join(", ");
}

function maximumJobs() {
  return Math.min(8, 2 + state.level);
}

function jobDropSummary(job) {
  const [minimum, maximum] = job.materialAmount;
  const expectedPrimary = Math.round(JOB_DROP_CHANCES.materials * (minimum + maximum) / 2 * 100);
  const extras = job.materials.slice(1);
  const expectedExtra = extras.length
    ? Math.round(JOB_DROP_CHANCES.materials * EXTRA_MATERIAL_CHANCE / extras.length * 100)
    : 0;
  const raw = [
    `${materials[job.materials[0]].shortName} ${expectedPrimary}%`,
    ...extras.map((id) => `${materials[id].shortName} ${expectedExtra}%`),
  ].join(" · ");
  const supplies = job.supplies.map((id) => itemInfo(id).name).join(", ");
  const rare = job.rare.map((id) => gear[id].name).join(", ");
  const fine = job.fine.map((id) => gear[id].name).join(", ");
  return `Materials: ${raw} · Supply 15%: ${supplies} · Rare 3%: ${rare} · Fine 2%: ${fine}`;
}

function renderJobs() {
  const list = $("#job-list");
  list.replaceChildren();
  const available = Object.entries(jobs).filter(([, job]) => job.level <= state.level);
  $("#jobs-count").textContent = `${state.jobsDone.length} / ${maximumJobs()} JOBS · ${available.length} UNLOCKED`;

  for (const [id, job] of available) {
    const card = document.createElement("article");
    card.className = "job-card";
    card.dataset.jobCard = id;
    const icon = document.createElement("div");
    icon.className = `job-icon${job.level > 1 ? " icon-ranch" : ""}`;
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = job.icon;

    const info = document.createElement("div");
    info.className = "job-info";
    const category = document.createElement("span");
    category.className = "job-category";
    category.textContent = `${job.category} · LV ${job.level}+`;
    const title = document.createElement("h3");
    title.textContent = job.name;
    const description = document.createElement("p");
    description.textContent = job.description;
    const tags = document.createElement("div");
    tags.className = "job-tags";
    for (const text of ["◷ 1 min", `✦ +${job.xp} XP`, `⚡ ${job.cost} energy`]) {
      const tag = document.createElement("span");
      tag.textContent = text;
      tags.append(tag);
    }
    const drops = document.createElement("small");
    drops.className = "job-drops";
    drops.textContent = jobDropSummary(job);
    info.append(category, title, description, tags, drops);

    const reward = document.createElement("div");
    reward.className = "job-reward";
    const wage = document.createElement("strong");
    wage.textContent = `$${job.reward}`;
    const aside = document.createElement("small");
    aside.textContent = "plus field finds";
    const button = document.createElement("button");
    button.className = "small-button";
    button.type = "button";
    button.dataset.job = id;
    button.textContent = "Take the job →";
    reward.append(wage, aside, button);
    card.append(icon, info, reward);
    list.append(card);
  }
}

function renderRecipes() {
  const list = $("#recipe-list");
  list.replaceChildren();
  for (const recipe of recipes) {
    const row = document.createElement("article");
    row.className = `recipe-card${recipe.level > state.level ? " locked-recipe" : ""}`;
    const details = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = recipe.name;
    const description = document.createElement("p");
    description.textContent = recipe.description;
    const costs = document.createElement("small");
    costs.textContent = recipe.level > state.level
      ? `Unlocks at level ${recipe.level}`
      : `${Object.entries(recipe.materials).map(([id, amount]) => `${materials[id].name} ${countItem(id)}/${amount}`).join(" · ")} · $${recipe.cost}`;
    const stats = document.createElement("small");
    stats.className = "recipe-stats";
    stats.textContent = itemStats(gear[recipe.output] || {}) || "Useful supplies for the road";
    details.append(title, description, costs, stats);
    const craft = document.createElement("button");
    craft.type = "button";
    craft.className = "small-button craft-button";
    craft.textContent = "Craft";
    craft.disabled = recipe.level > state.level || state.money < recipe.cost || Object.entries(recipe.materials).some(([id, amount]) => countItem(id) < amount) || (gear[recipe.output] && countItem(recipe.output) > 0);
    craft.addEventListener("click", () => craftRecipe(recipe.id));
    row.append(details, craft);
    list.append(row);
  }
}

function renderShop() {
  const list = $("#shop-list");
  list.replaceChildren();
  for (const stock of shopStock) {
    const locked = stock.level > state.level;
    const owned = !stock.consumable && countItem(stock.id) > 0;
    const row = document.createElement("article");
    row.className = `shop-item${locked ? " locked-stock" : ""}`;
    const icon = document.createElement("span");
    icon.className = "shop-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = stock.icon;
    const info = document.createElement("span");
    info.className = "shop-details";
    const name = document.createElement("b");
    name.textContent = stock.name;
    const description = document.createElement("small");
    description.textContent = locked ? `Unlocks at level ${stock.level}` : stock.description;
    info.append(name, description);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-buy";
    button.textContent = locked ? `LV ${stock.level}` : owned ? "Owned" : `Buy · $${stock.price}`;
    button.disabled = locked || owned || state.money < stock.price;
    button.addEventListener("click", () => buyStock(stock.id));
    row.append(icon, info, button);
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

function currentDailySideMission() {
  return dailySideMissions[(state.day - 1) % dailySideMissions.length];
}

function currentDailyTasks() {
  const sideMission = currentDailySideMission();
  return [
    { name: "Put in three shifts", detail: "Complete any 3 jobs before sunrise.", progress: state.dailyProgress.jobs, target: 3 },
    { name: "Ride a trail", detail: "Explore any route at least once today.", progress: state.dailyProgress.explorations, target: 1 },
    { name: sideMission.name, detail: sideMission.detail, progress: state.dailyProgress[sideMission.progress], target: sideMission.target },
  ];
}

function renderDailyMissions() {
  const list = $("#daily-mission-list");
  list.replaceChildren();
  for (const task of currentDailyTasks()) {
    const progress = Math.min(task.progress, task.target);
    const complete = progress >= task.target;
    const row = document.createElement("div");
    row.className = `daily-task${complete ? " daily-task-complete" : ""}`;
    const heading = document.createElement("div");
    heading.className = "daily-task-heading";
    const check = document.createElement("span");
    check.className = "daily-task-check";
    check.textContent = complete ? "✓" : "·";
    const title = document.createElement("b");
    title.textContent = task.name;
    const count = document.createElement("strong");
    count.textContent = `${progress}/${task.target}`;
    heading.append(check, title, count);
    const detail = document.createElement("small");
    detail.textContent = task.detail;
    const meter = document.createElement("div");
    meter.className = "daily-task-meter";
    const fill = document.createElement("span");
    fill.style.width = `${progress / task.target * 100}%`;
    meter.append(fill);
    row.append(heading, detail, meter);
    list.append(row);
  }
  $("#daily-bonus").textContent = state.questClaimed ? "CLAIMED" : `+$${dailyBonus()}`;
  $("#daily-bonus").classList.toggle("bonus-earned", state.questClaimed);
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
  const jobLimit = maximumJobs();
  $("#day-label").textContent = `DAY ${String(state.day).padStart(2, "0")}`;

  renderJobs();
  for (const [id, job] of Object.entries(jobs)) {
    const button = document.querySelector(`[data-job="${id}"]`);
    const card = document.querySelector(`[data-job-card="${id}"]`);
    if (!button || !card) continue;
    const completed = state.jobsDone.includes(id);
    const active = state.activeJob?.id === id;
    const activeSeconds = active ? Math.ceil(Math.max(0, state.activeJob.finishesAt - Date.now()) / 1000) : 0;
    const activeTime = `${String(Math.floor(activeSeconds / 60)).padStart(2, "0")}:${String(activeSeconds % 60).padStart(2, "0")}`;
    button.disabled = completed || state.jobsDone.length >= jobLimit || Boolean(state.activeJob);
    button.textContent = active ? `Working… ${activeTime}` : completed ? "Done for today" : state.jobsDone.length >= jobLimit ? "Board is clear" : state.activeJob ? "Another job in progress" : "Take the job →";
    card.classList.toggle("completed", completed);
    card.classList.toggle("job-active", active);
    if (!active) card.style.removeProperty("--job-progress");
    card.classList.toggle("board-closed", !completed && state.jobsDone.length >= jobLimit);
    card.dataset.energyCost = job.cost;
  }

  $("#route-title").textContent = routes[state.route].name;
  $("#route-description").textContent = routes[state.route].description;
  $("#explore-button").disabled = state.energy < routes[state.route].cost || Boolean(state.activeJob);
  $("#explore-button").title = state.activeJob ? "Finish your current job before heading out." : state.energy < routes[state.route].cost ? "Rest at the saloon to get more energy." : "";
  $("#rest-button").disabled = state.money < 6 || (state.energy >= 100 && state.health >= 100) || Boolean(state.activeJob);
  $("#day-button").disabled = Boolean(state.activeJob || state.encounter);
  renderInventory();
  renderRecipes();
  renderShop();
  renderMissions();
  renderDailyMissions();
  renderBattle();
}

function addBattleNote(message) {
  state.battleLog.unshift(message);
  state.battleLog = state.battleLog.slice(0, 12);
}

function gainExperience(amount) {
  state.xp += amount;
  const unlocked = [];
  while (state.xp >= state.level * 70) {
    state.xp -= state.level * 70;
    state.level += 1;
    state.health = Math.min(100, state.health + 12);
    addNote(`You made level ${state.level}. The town knows your name now.`);
    unlocked.push(state.level);
  }
  if (unlocked.length) {
    const newJobs = Object.values(jobs).filter((job) => unlocked.includes(job.level)).length;
    const newRecipes = recipes.filter((recipe) => unlocked.includes(recipe.level)).length;
    const newStock = shopStock.filter((item) => unlocked.includes(item.level)).length;
    const announcements = [];
    if (newJobs) announcements.push(`${newJobs} new job${newJobs > 1 ? "s" : ""}`);
    if (newRecipes) announcements.push(`${newRecipes} recipe${newRecipes > 1 ? "s" : ""}`);
    if (newStock) announcements.push(`${newStock} shop item${newStock > 1 ? "s" : ""}`);
    showToast(`Level ${state.level}!${announcements.length ? ` Unlocked: ${announcements.join(", ")}.` : ""}`);
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
  if (currentDailyTasks().every((task) => task.progress >= task.target) && !state.questClaimed) {
    const bonus = dailyBonus();
    state.money += bonus;
    state.questClaimed = true;
    addNote(`Daily missions complete. The clerk added a $${bonus} bonus to your pay.`);
    showToast(`Daily missions complete! The clerk's $${bonus} bonus is yours.`);
  }
}

function dailyBonus() {
  return 45 + (state.level - 1) * 12;
}

function giveJobDrop(job) {
  const roll = Math.random();
  if (roll < JOB_DROP_CHANCES.rare) {
    const rareId = (job.rare || ["lucky-spur"])[Math.floor(Math.random() * (job.rare || ["lucky-spur"]).length)];
    addItem(rareId);
    return `A lucky find: ${gear[rareId].name}!`;
  }
  if (roll < JOB_DROP_CHANCES.rare + JOB_DROP_CHANCES.supply) {
    const supplies = job.supplies || ["biscuit", "healing-tonic"];
    const find = supplies[Math.floor(Math.random() * supplies.length)];
    addItem(find);
    return `Found ${itemInfo(find).name}.`;
  }
  if (roll < JOB_DROP_CHANCES.rare + JOB_DROP_CHANCES.supply + JOB_DROP_CHANCES.materials) {
    const first = job.materials[0];
    const [minimum, maximum] = job.materialAmount;
    const firstAmount = minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    addItem(first, firstAmount);
    state.stats.materialsGathered += firstAmount;
    state.dailyProgress.materials += firstAmount;
    const extras = job.materials.slice(1);
    let secondDrop = "";
    if (extras.length && Math.random() < EXTRA_MATERIAL_CHANCE) {
      const second = extras[Math.floor(Math.random() * extras.length)];
      addItem(second, 1);
      state.stats.materialsGathered += 1;
      state.dailyProgress.materials += 1;
      secondDrop = `, ${materials[second].name} ×1`;
    }
    return `Gathered materials: ${materials[first].name} ×${firstAmount}${secondDrop}.`;
  }
  const fineItems = job.fine || ["iron-peacemaker", "redhide-vest"];
  const find = fineItems[Math.floor(Math.random() * fineItems.length)];
  if (countItem(find) > 0) {
    const salvage = job.materials[0];
    addItem(salvage, 3);
    state.stats.materialsGathered += 3;
    state.dailyProgress.materials += 3;
    return `Nothing new, but you salvaged ${materials[salvage].name} ×3.`;
  }
  addItem(find);
  return `A fine find! ${gear[find].name} (${gear[find].rarity}).`;
}

function finishJob() {
  const id = state.activeJob?.id;
  if (!id) return;
  const job = jobs[id];
  if (!job) return;
  state.activeJob = null;
  state.jobsDone.push(id);
  state.dailyProgress.jobs += 1;
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
  if (!job || job.level > state.level || state.jobsDone.includes(id) || state.jobsDone.length >= maximumJobs() || state.activeJob) return;
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
  state.dailyProgress.explorations += 1;
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
    state.dailyProgress.materials += amount;
    updateMissions();
    message = `You found ${materials[id].name} along the trail.`;
  } else {
    const [min, max] = route.coins;
    const found = Math.floor(Math.random() * (max - min + 1)) + min;
    state.money += found;
    message = `The trail paid off: you found $${found} in loose change.`;
  }
  addNote(message);
  claimDailyBonus();
  showToast(message);
  saveState();
  render();
}

function equipItem(id) {
  const item = gear[id];
  if (!item || !Object.hasOwn(state.equipped, item.type) || countItem(id) < 1) return;
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
  if (!recipe || recipe.level > state.level || state.money < recipe.cost || Object.entries(recipe.materials).some(([material, quantity]) => countItem(material) < quantity)) {
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

function buyStock(id) {
  const stock = shopStock.find((item) => item.id === id);
  if (!stock || stock.level > state.level || state.money < stock.price || (!stock.consumable && countItem(id) > 0)) return;
  state.money -= stock.price;
  addItem(id);
  addNote(`Bought ${stock.name} from Dry Creek Outfitters for $${stock.price}.`);
  showToast(`Bought ${stock.name}.`);
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
  if (state.activeJob || state.encounter) return;
  claimDailyBonus();
  if (!state.questClaimed) {
    const missing = currentDailyTasks()
      .filter((task) => task.progress < task.target)
      .map((task) => `${task.name.toLowerCase()} ${Math.min(task.target, task.progress)}/${task.target}`);
    addNote(missing.length
      ? `Turned in early. Daily bonus lost (${missing.join(", ")} unfinished).`
      : "The day's bonus was already claimed.");
  }
  state.day += 1;
  state.energy = Math.min(100, state.energy + 60);
  state.health = Math.min(100, state.health + 25);
  state.jobsDone = [];
  state.questClaimed = false;
  state.dailyProgress = freshDailyProgress();
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
  state.dailyProgress.fights += 1;
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
    state.dailyProgress.materials += 1;
    loot = ` Found ${materials[id].name}.`;
  } else if (rewardRoll < 0.25) {
    addItem("healing-tonic");
    loot = " Found a frontier tonic.";
  }
  if (state.encounter?.id === "ironjaw" && !countItem("silver-star")) {
    addItem("silver-star");
    loot += " The marshal's silver star, too!";
  }
  state.encounter = null;
  addBattleNote(`${enemy.name} is beaten. You earned $${enemy.reward} and ${enemy.xp} XP.${loot}`);
  addNote(`Won a fight against ${enemy.name}. Earned $${enemy.reward}.${loot}`);
  updateMissions();
  claimDailyBonus();
  showToast(`Victory! +$${enemy.reward}, +${enemy.xp} XP.${loot}`);
}

function attack() {
  const encounter = state.encounter;
  const enemy = encounter && enemies[encounter.id];
  if (!enemy || state.health <= 0) return;
  const weapon = gear[state.equipped.weapon];
  const stats = equipmentStats();
  const hitChance = Math.min(98, Math.max(55, 90 + stats.aim - enemy.evasion));
  if (Math.random() * 100 >= hitChance) {
    addBattleNote(`Your shot misses (${hitChance}% hit chance).`);
  } else {
    const damageRange = weapon?.damage || [1, 2];
    const baseDamage = Math.floor(Math.random() * (damageRange[1] - damageRange[0] + 1)) + damageRange[0];
    const damage = Math.max(1, Math.round(baseDamage * (1 + stats.damageBonus / 100)));
    encounter.health = Math.max(0, encounter.health - damage);
    addBattleNote(`You hit for ${damage} damage (${damageRange[0]}-${damageRange[1]} base, +${stats.damageBonus}% bonus).`);
  }
  if (encounter.health <= 0) {
    winFight(enemy);
    saveState();
    render();
    return;
  }
  if (Math.random() * 100 < stats.dodge) {
    addBattleNote(`You dodge ${enemy.name}'s attack (${stats.dodge}% dodge).`);
  } else {
    const incoming = Math.max(1, enemy.attack - stats.armor);
    state.health = Math.max(0, state.health - incoming);
    addBattleNote(`${enemy.name} hits for ${incoming} damage after ${stats.armor} armor.`);
  }
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

$("#job-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-job]");
  if (button) takeJob(button.dataset.job);
});
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
