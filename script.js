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
  planks: { name: "Sawmill planks", shortName: "Planks", icon: "▤", detail: "Straight, kiln-dried boards sold by the builder's yard." },
  stone: { name: "Quarried fieldstone", shortName: "Stone", icon: "◈", detail: "Heavy blocks for foundations and fireproof walls." },
  nails: { name: "Iron nail keg", shortName: "Nails", icon: "⌁", detail: "A keg of square-cut nails, bought from the builder's yard." },
  ingot: { name: "Copper ingot", shortName: "Copper ingot", icon: "▰", detail: "Copper ore smelted down with iron scrap." },
  leather: { name: "Cured leather", shortName: "Leather", icon: "▧", detail: "Hide worked soft and weatherproof in the tannery." },
  ironheart: { name: "Ironjaw's ironheart", shortName: "Ironheart", icon: "◆", detail: "A dense, ore-veined core recovered from Ironjaw. The assay shed can be rebuilt around it." },
  temperedIngot: { name: "Tempered railsteel", shortName: "Railsteel", icon: "▰", detail: "Copper alloy tempered in the Ironheart Forge; required for a weapon that can challenge Vane." },
  ridgebackMark: { name: "Ridgeback trail mark", shortName: "Trail mark", icon: "♧", detail: "A sign the sheriff can use to follow the coyote trail toward Ironjaw's den." },
  freightToken: { name: "Vane freight token", shortName: "Freight token", icon: "♠", detail: "A stamped token taken from Vane's road-agent. Its rail code leads to Ironjaw's den." },
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
  "vane-signet": { name: "Vane's silver signet", type: "charm", slot: "Charm", power: 16, armor: 4, damageBonus: 7, aim: 5, rarity: "epic", icon: "✦", detail: "A heavy ring stamped with the mark of a railroad empire." },
  "railbreaker-rifle": { name: "Railbreaker rifle", type: "weapon", slot: "Weapon", power: 26, damage: [20, 29], damageBonus: 16, aim: 10, set: "deadeye", rarity: "epic", icon: "▰", detail: "A rifle rebuilt around Ironjaw-tempered railsteel. The only weapon sturdy enough to face Silas Vane." },
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
    slots: ["iron-peacemaker", "ranger-duster", "longshot-rifle", "scattergun", "railbreaker-rifle", "gunslingers-gloves", "deadeye-hat"],
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
  { id: "iron-peacemaker", name: "Deadeye Peacemaker", description: "A dependable Deadeye-set revolver with improved damage and aim.", cost: 25, level: 1, materials: { scrap: 5, timber: 2 }, output: "iron-peacemaker" },
  { id: "redhide-vest", name: "Redhide vest", description: "Protection against claws and bad decisions.", cost: 30, level: 1, materials: { hide: 4, scrap: 2 }, output: "redhide-vest" },
  { id: "healing-tonic", name: "Frontier tonic", description: "Restore 35 health during a fight.", cost: 12, level: 1, materials: { herbs: 3 }, output: "healing-tonic" },
  { id: "scout-hat", name: "Trailblazer's broadbrim", description: "A practical all-around set piece.", cost: 48, level: 2, materials: { hide: 3, timber: 3, ore: 1 }, output: "scout-hat" },
  { id: "trail-boots", name: "Ironbark trail boots", description: "Armor and dodge for the Ironbark set.", cost: 55, level: 3, materials: { hide: 5, scrap: 3 }, output: "trail-boots" },
  { id: "ranger-duster", name: "Deadeye's long duster", description: "Damage and aim for the Deadeye set. Requires cured leather and smelted copper.", cost: 90, level: 4, materials: { leather: 4, ingot: 2, scrap: 3 }, stations: ["tannery", "smelter"], output: "ranger-duster" },
  { id: "gunslingers-gloves", name: "Deadeye draw gloves", description: "Quicker hands; steadier shots, sewn from cured leather.", cost: 115, level: 5, materials: { leather: 3, ore: 3, timber: 4 }, stations: ["tannery"], output: "gunslingers-gloves" },
  { id: "longshot-rifle", name: "Deadeye Longshot", description: "A long-range upgrade built around smelted copper.", cost: 160, level: 6, materials: { ingot: 5, scrap: 8, timber: 6 }, stations: ["smelter"], output: "longshot-rifle" },
  { id: "trailblazer-boots", name: "Trailblazer's riding boots", description: "Balanced protection for the Trailblazer set.", cost: 105, level: 3, materials: { hide: 5, timber: 3, scrap: 2 }, output: "trailblazer-boots" },
  { id: "trailblazer-gloves", name: "Trailblazer's work gloves", description: "A balanced set piece for any kind of work.", cost: 115, level: 4, materials: { hide: 5, timber: 4, scrap: 2 }, output: "trailblazer-gloves" },
  { id: "deadeye-hat", name: "Deadeye's sightline hat", description: "A precise hat with a leather crown and copper sights.", cost: 150, level: 5, materials: { leather: 2, ingot: 1, timber: 2 }, stations: ["tannery", "smelter"], output: "deadeye-hat" },
  { id: "ironbark-hood", name: "Ironbark scout hood", description: "Armor and dodge for the Ironbark set, cut from cured hide.", cost: 155, level: 5, materials: { leather: 3, scrap: 4, ore: 2 }, stations: ["tannery"], output: "ironbark-hood" },
  { id: "ironbark-gloves", name: "Ironbark guard gloves", description: "The final piece for a sturdy Ironbark kit.", cost: 225, level: 7, materials: { leather: 4, ingot: 2, scrap: 6 }, stations: ["tannery", "smelter"], output: "ironbark-gloves" },
  { id: "railbreaker-rifle", name: "Railbreaker rifle", description: "A campaign weapon forged with Ironjaw-tempered railsteel. Required to challenge Silas Vane.", cost: 480, level: 8, materials: { temperedIngot: 3, leather: 4, scrap: 8 }, stations: ["heartforge"], output: "railbreaker-rifle" },
  { id: "marshal-coat", name: "Ironbark marshal's coat", description: "A reinforced coat with forged copper plates.", cost: 280, level: 7, materials: { leather: 6, ingot: 4, scrap: 8 }, stations: ["tannery", "smelter"], output: "marshal-coat" },
  { id: "scattergun", name: "Deadeye Gulch scattergun", description: "A hard-hitting weapon built with a forged barrel.", cost: 360, level: 8, materials: { ingot: 6, timber: 8, scrap: 10 }, stations: ["smelter"], output: "scattergun" },
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

const cabinTiers = [
  null,
  { name: "A one-room cabin", plots: 5, cost: { planks: 5, stone: 3, nails: 2 }, money: 90, level: 1, comfort: 0 },
  { name: "The Quinn homestead", plots: 8, cost: { planks: 8, stone: 7, nails: 4 }, money: 220, level: 3, comfort: 1, bonus: { armor: 1 } },
  { name: "A proper ranch house", plots: 12, cost: { planks: 12, stone: 12, nails: 7 }, money: 450, level: 5, comfort: 2, bonus: { armor: 2, dodge: 2 } },
  { name: "The Dry Creek homestead", plots: 20, cost: { planks: 18, stone: 18, nails: 10 }, money: 850, level: 7, comfort: 3, bonus: { armor: 3, dodge: 3 } },
];

const homesteadBuildings = {
  garden: { name: "Kitchen garden", icon: "✿", description: "A neat herb patch tended behind the house.", plots: 2, level: 1, cost: { planks: 2, stone: 1, nails: 1 }, money: 55, production: { herbs: 2 }, comfort: 1 },
  timberYard: { name: "Woodlot", icon: "♧", description: "A fenced stand of young trees for a steady timber harvest.", plots: 3, level: 2, cost: { planks: 4, stone: 2, nails: 2 }, money: 110, production: { timber: 2 }, comfort: 0 },
  pasture: { name: "Small pasture", icon: "▧", description: "A few hardy goats provide hides for the workbench.", plots: 3, level: 3, cost: { planks: 4, stone: 3, nails: 2 }, money: 145, production: { hide: 1 }, comfort: 1 },
  smelter: { name: "Assay shed", icon: "◆", description: "A stone furnace and anvil to turn ore into usable copper.", plots: 3, level: 3, cost: { planks: 4, stone: 6, nails: 3 }, money: 190, station: "smelter", comfort: 0 },
  heartforge: { name: "Ironheart Forge", icon: "▰", description: "Rebuild the assay shed around Ironjaw's ironheart to temper railsteel. Requires the assay shed and the boss's unique core.", plots: 0, level: 6, cost: { ironheart: 1, planks: 6, stone: 8, nails: 6 }, money: 420, station: "heartforge", prerequisite: "smelter", comfort: 0 },
  tannery: { name: "Tanning shed", icon: "▤", description: "A covered rack for curing hides into sturdy leather.", plots: 2, level: 4, cost: { planks: 5, stone: 2, nails: 3 }, money: 185, station: "tannery", comfort: 0 },
  watchtower: { name: "Ridge watchtower", icon: "⚑", description: "A clear view of the road makes you quicker to spot danger.", plots: 3, level: 4, cost: { planks: 7, stone: 4, nails: 4 }, money: 250, bonus: { aim: 4 }, comfort: 0 },
  palisade: { name: "Rough palisade", icon: "▰", description: "A stout fence makes the homestead safer and steadies your nerves.", plots: 4, level: 5, cost: { planks: 7, stone: 6, nails: 6 }, money: 300, bonus: { armor: 3, dodge: 2 }, comfort: 0 },
};

const builderStock = [
  { id: "planks", price: 18 },
  { id: "stone", price: 14 },
  { id: "nails", price: 22 },
];

const refinements = [
  { id: "copper", name: "Smelt copper", station: "smelter", input: { ore: 3, scrap: 1 }, output: { ingot: 1 } },
  { id: "leather", name: "Cure leather", station: "tannery", input: { hide: 3, herbs: 1 }, output: { leather: 1 } },
  { id: "railsteel", name: "Temper railsteel", station: "heartforge", input: { ingot: 2, scrap: 3 }, output: { temperedIngot: 1 } },
];

const storyChapters = [
  { title: "A Place to Begin", scene: "The deed was tucked inside your father's last letter. The Bell place is little more than a fence line and a collapsed roof, but the land is yours if you can make it livable.", reward: 70, xp: 35, requirements: [{ kind: "land", label: "Claim the old Bell homestead" }, { kind: "cabin", target: 1, label: "Raise the first cabin" }] },
  { title: "Neighbors at the Rail", scene: "A repaired roof changes how Dry Creek looks at you. Ada remembers your family, and the postmaster has a name for the stranger who bought your father's debts: Silas Vane.", reward: 100, xp: 55, requirements: [{ kind: "level", target: 2, label: "Reach level 2" }, { kind: "jobs", target: 5, label: "Complete 5 jobs" }, { kind: "explorations", target: 2, label: "Ride 2 trails" }] },
  { title: "The Red Hill Assay", scene: "A copper sample hidden beneath the cabin bears the mark of an abandoned claim. The old assay book says the vein is worthless until someone can smelt it.", reward: 125, xp: 70, requirements: [{ kind: "building", key: "smelter", label: "Build an assay shed" }, { kind: "refined", target: 2, label: "Smelt 2 copper ingots" }] },
  { title: "A Hand Worth Trusting", scene: "The assay book belonged to Ada's brother, who vanished the same winter your father died. She gives you his last ledger page: Vane paid the railroad to keep the claim quiet.", reward: 150, xp: 85, requirements: [{ kind: "level", target: 3, label: "Reach level 3" }, { kind: "crafted", target: 2, label: "Craft 2 workbench items" }, { kind: "cabin", target: 2, label: "Expand the cabin once" }] },
  { title: "Roots and Roof Beams", scene: "The land starts giving back. Ada trades you seed, and Old Man Bell brings a pair of goats. A home can be more than shelter; it can keep the whole town going.", reward: 175, xp: 100, requirements: [{ kind: "building", key: "garden", label: "Plant the kitchen garden" }, { kind: "building", key: "pasture", label: "Fence a small pasture" }, { kind: "productionDays", target: 3, label: "Harvest from your homestead on 3 mornings" }] },
  { title: "A Name on the Wanted Board", scene: "Vane's riders have started leaning on the ranches. The sheriff is short-handed. Prove you can protect the trail by driving off a ridgeback and capturing a road-agent; the outlaw's freight token points to Ironjaw's den.", reward: 200, xp: 120, requirements: [{ kind: "level", target: 4, label: "Reach level 4" }, { kind: "enemyWins", key: "coyote", target: 1, label: "Defeat a Ridgeback coyote" }, { kind: "enemyWins", key: "outlaw", target: 1, label: "Defeat a Gulch road-agent" }, { kind: "building", key: "palisade", label: "Protect the homestead" }] },
  { title: "The Lantern's Ledger", scene: "A rescued rider recognizes the name in Ada's ledger. Vane's outfit has been shipping stolen ore on the night train. The proof is somewhere in the freight cars.", reward: 240, xp: 140, requirements: [{ kind: "cabin", target: 3, label: "Build a proper ranch house" }, { kind: "buildings", target: 4, label: "Raise 4 homestead buildings" }, { kind: "level", target: 5, label: "Reach level 5" }] },
  { title: "Last Train to Dry Creek", scene: "You board the night train with the sheriff. The crew scatters, but their foreman leaves a trail of copper dust toward the old mine—and a warning: Vane is coming himself.", reward: 280, xp: 160, requirements: [{ kind: "job", key: "railguard", target: 2, label: "Stand watch on 2 night trains" }, { kind: "job", key: "mine", target: 2, label: "Work the old copper seam twice" }, { kind: "building", key: "tannery", label: "Build a tanning shed" }] },
  { title: "Ironjaw's Trail", scene: "Ironjaw's ironheart can turn the assay shed into a forge no ordinary furnace could match. Temper railsteel there, then build the Railbreaker rifle. Vane won't face you until you bring proof you can finish what you started.", reward: 350, xp: 200, requirements: [{ kind: "boss", key: "ironjaw", target: 1, label: "Defeat Ironjaw and claim his ironheart" }, { kind: "building", key: "heartforge", label: "Build the Ironheart Forge" }, { kind: "refinedMaterial", key: "temperedIngot", target: 3, label: "Temper 3 railsteel ingots" }, { kind: "craftedItem", key: "railbreaker-rifle", target: 1, label: "Craft the Railbreaker rifle" }] },
  { title: "A Town Worth Saving", scene: "Vane arrives in person to take the valley. Your Railbreaker rifle is proof that Ironjaw's strength, the town's craft, and your own hard work are finally one. Face Vane and save the homestead.", reward: 500, xp: 300, requirements: [{ kind: "level", target: 8, label: "Reach level 8" }, { kind: "cabin", target: 4, label: "Finish the homestead" }, { kind: "buildings", target: 7, label: "Complete 7 homestead improvements" }, { kind: "equipped", key: "railbreaker-rifle", label: "Equip the Railbreaker rifle" }, { kind: "boss", key: "vane", target: 1, label: "Defeat Silas Vane" }] },
];

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
  coyote: { name: "Ridgeback coyote", kind: "BEAST · COMMON", purpose: "First proof for the sheriff. Defeat one to open the Ironjaw trail.", health: 25, attack: 5, evasion: 6, reward: 18, xp: 18, icon: "♧", boss: false },
  outlaw: { name: "Gulch road-agent", kind: "OUTLAW · TOUGH", purpose: "Recover Vane's freight token. One victory is required to locate Ironjaw.", health: 48, attack: 10, evasion: 12, reward: 42, xp: 36, icon: "♠", boss: false },
  ironjaw: { name: "Ironjaw, the old bear", kind: "BOSS · LEGENDARY", purpose: "The ironheart from this fight rebuilds your assay shed into the only forge that can temper railsteel.", health: 125, attack: 18, evasion: 8, reward: 180, xp: 120, icon: "◆", boss: true, level: 3, power: 18, storyChapter: 6, requiredWins: { coyote: 1, outlaw: 1 }, requiredItems: { ridgebackMark: 1, freightToken: 1 } },
  vane: { name: "Silas Vane", kind: "BOSS · RAILROAD TYCOON", purpose: "Campaign finale. Bring the equipped Railbreaker rifle forged from Ironjaw's ironheart.", health: 240, attack: 22, evasion: 18, reward: 850, xp: 450, icon: "♠", boss: true, level: 8, power: 45, storyChapter: 9, requiredWeapon: "railbreaker-rifle" },
};

const missions = [
  { id: "steady-work", name: "A steady hand", detail: "Complete 3 jobs.", target: 3, stat: "jobsCompleted", reward: 45, xp: 25 },
  { id: "supply-run", name: "Stock the workbench", detail: "Gather 12 raw materials.", target: 12, stat: "materialsGathered", reward: 55, xp: 30 },
  { id: "craftsman", name: "Make something of it", detail: "Craft 2 recipes.", target: 2, stat: "itemsCrafted", reward: 70, xp: 40 },
  { id: "gulch-clear", name: "Keep the gulch clear", detail: "Win 5 frontier fights.", target: 5, stat: "monstersDefeated", reward: 85, xp: 55 },
  { id: "ironjaw", name: "A name in the ledger", detail: "Defeat Ironjaw.", target: 1, stat: "bossesById", enemyId: "ironjaw", reward: 150, xp: 100 },
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
  if (id === "ironheart") return "Required to build the Ironheart Forge · guaranteed Ironjaw reward";
  if (id === "temperedIngot") return "Required to craft the Railbreaker rifle · need 3";
  if (id === "ridgebackMark" || id === "freightToken") {
    return "Campaign evidence · proves the trail to Ironjaw's den";
  }
  if (["planks", "stone", "nails"].includes(id)) {
    return "Builder's Yard material · used for homestead construction";
  }
  const usingRecipes = recipes.filter((recipe) => recipe.materials[id]);
  const total = usingRecipes.reduce((sum, recipe) => sum + recipe.materials[id], 0);
  return `Used in ${usingRecipes.length} ${usingRecipes.length === 1 ? "recipe" : "recipes"} · ${total} needed`;
}

function homesteadPlotsUsed() {
  return state.homestead.buildings.reduce((sum, id) => sum + homesteadBuildings[id].plots, 0);
}

function homesteadComfort() {
  const cabin = cabinTiers[state.homestead.cabin];
  return (cabin?.comfort || 0) + state.homestead.buildings.reduce((sum, id) => sum + homesteadBuildings[id].comfort, 0);
}

function homesteadStatBonuses() {
  const bonuses = { armor: 0, dodge: 0, aim: 0 };
  const sources = [
    cabinTiers[state.homestead.cabin]?.bonus,
    ...state.homestead.buildings.map((id) => homesteadBuildings[id].bonus),
  ].filter(Boolean);
  for (const bonus of sources) {
    for (const [stat, value] of Object.entries(bonus)) bonuses[stat] += value;
  }
  return bonuses;
}

function hasStation(station) {
  return state.homestead.buildings.some((id) => homesteadBuildings[id].station === station);
}

function storyRequirementProgress(requirement) {
  switch (requirement.kind) {
    case "land": return Number(state.homestead.landClaimed);
    case "cabin": return state.homestead.cabin;
    case "level": return state.level;
    case "jobs": return state.stats.jobsCompleted;
    case "explorations": return state.stats.explorations;
    case "building": return Number(state.homestead.buildings.includes(requirement.key));
    case "refined": return state.stats.refined;
    case "crafted": return state.stats.itemsCrafted;
    case "productionDays": return state.stats.productionDays;
    case "wins": return state.stats.monstersDefeated;
    case "bosses": return state.stats.bossesDefeated;
    case "boss": return state.stats.bossesById[requirement.key] || 0;
    case "enemyWins": return state.stats.enemyWins[requirement.key] || 0;
    case "refinedMaterial": return state.stats.refinedById[requirement.key] || 0;
    case "craftedItem": return state.stats.craftedById[requirement.key] || 0;
    case "equipped": return Number(state.equipped.weapon === requirement.key);
    case "buildings": return state.homestead.buildings.length;
    case "job": return state.stats.jobsById[requirement.key] || 0;
    default: return 0;
  }
}

function storyRequirementComplete(requirement) {
  const target = requirement.target || 1;
  return storyRequirementProgress(requirement) >= target;
}

function formatMaterialCosts(costs) {
  return Object.entries(costs).map(([id, amount]) => `${materials[id].shortName} ${countItem(id)}/${amount}`).join(" · ");
}

function canPayMaterials(costs) {
  return Object.entries(costs).every(([id, amount]) => countItem(id) >= amount);
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
    stats: { jobsCompleted: 0, materialsGathered: 0, itemsCrafted: 0, craftedById: {}, monstersDefeated: 0, bossesDefeated: 0, bossesById: {}, enemyWins: {}, explorations: 0, refined: 0, refinedById: {}, productionDays: 0, jobsById: {} },
    claimedMissions: [],
    homestead: { landClaimed: false, cabin: 0, buildings: [] },
    story: { chapter: 0, completed: [] },
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
      stats: {
        ...initial.stats,
        ...(saved.stats || {}),
        jobsById: Object.fromEntries(Object.keys(jobs).map((id) => [id, Number(saved.stats?.jobsById?.[id]) || 0])),
        bossesById: Object.fromEntries(Object.keys(enemies).map((id) => [id, Number(saved.stats?.bossesById?.[id]) || 0])),
        enemyWins: Object.fromEntries(Object.keys(enemies).map((id) => [id, Number(saved.stats?.enemyWins?.[id]) || 0])),
        refinedById: Object.fromEntries(Object.keys(materials).map((id) => [id, Number(saved.stats?.refinedById?.[id]) || 0])),
        craftedById: Object.fromEntries(Object.keys(gear).map((id) => [id, Number(saved.stats?.craftedById?.[id]) || 0])),
      },
      homestead: {
        ...initial.homestead,
        ...(saved.homestead || {}),
        cabin: Number.isInteger(saved.homestead?.cabin) ? Math.min(cabinTiers.length - 1, Math.max(0, saved.homestead.cabin)) : 0,
        buildings: Array.isArray(saved.homestead?.buildings) ? [...new Set(saved.homestead.buildings.filter((id) => Object.hasOwn(homesteadBuildings, id)))] : [],
      },
      story: {
        ...initial.story,
        ...(saved.story || {}),
        chapter: Number.isInteger(saved.story?.chapter) ? Math.min(storyChapters.length, Math.max(0, saved.story.chapter)) : 0,
        completed: Array.isArray(saved.story?.completed) ? saved.story.completed.filter((chapter) => Number.isInteger(chapter) && chapter > 0 && chapter <= storyChapters.length) : [],
      },
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

function bossRequirements(enemy) {
  return { level: enemy.level || 3, power: enemy.power || 18 };
}

function canChallengeBoss(enemy) {
  const requirements = bossRequirements(enemy);
  const requiredWinsMet = Object.entries(enemy.requiredWins || {}).every(([id, count]) => (state.stats.enemyWins[id] || 0) >= count);
  const requiredItemsMet = Object.entries(enemy.requiredItems || {}).every(([id, count]) => countItem(id) >= count);
  return requiredWinsMet
    && requiredItemsMet
    && (enemy.storyChapter === undefined || state.story.chapter >= enemy.storyChapter)
    && state.level >= requirements.level
    && equipmentPower() >= requirements.power
    && (!enemy.requiredWeapon || state.equipped.weapon === enemy.requiredWeapon);
}

function bossLockReason(enemy) {
  for (const [id, count] of Object.entries(enemy.requiredWins || {})) {
    const wins = state.stats.enemyWins[id] || 0;
    if (wins < count) return `Defeat ${enemies[id].name} (${wins}/${count})`;
  }
  for (const [id, count] of Object.entries(enemy.requiredItems || {})) {
    const quantity = countItem(id);
    if (quantity < count) return `Recover ${materials[id].name} (${quantity}/${count})`;
  }
  if (enemy.storyChapter !== undefined && state.story.chapter < enemy.storyChapter) {
    return `Continue the Vane Ledger to chapter ${enemy.storyChapter + 1}`;
  }
  if (enemy.requiredWeapon && state.equipped.weapon !== enemy.requiredWeapon) {
    return `Equip the ${gear[enemy.requiredWeapon].name}`;
  }
  const requirements = bossRequirements(enemy);
  if (state.level < requirements.level) return `Reach level ${requirements.level}`;
  if (equipmentPower() < requirements.power) return `Bring equipment power ${requirements.power}`;
  return `Requires level ${requirements.level} · power ${requirements.power}`;
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
  for (const [stat, value] of Object.entries(homesteadStatBonuses())) stats[stat] += value;
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
    const missingStations = (recipe.stations || []).filter((station) => !hasStation(station));
    costs.textContent = recipe.level > state.level
      ? `Unlocks at level ${recipe.level}`
      : `${formatMaterialCosts(recipe.materials)} · $${recipe.cost}${missingStations.length ? ` · Requires ${missingStations.map((station) => homesteadBuildings[station].name).join(" and ")}` : ""}`;
    const stats = document.createElement("small");
    stats.className = "recipe-stats";
    stats.textContent = itemStats(gear[recipe.output] || {}) || "Useful supplies for the road";
    details.append(title, description, costs, stats);
    const craft = document.createElement("button");
    craft.type = "button";
    craft.className = "small-button craft-button";
    craft.textContent = "Craft";
    craft.disabled = recipe.level > state.level || missingStations.length > 0 || state.money < recipe.cost || !canPayMaterials(recipe.materials) || (gear[recipe.output] && countItem(recipe.output) > 0);
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
    const progressValue = mission.enemyId ? state.stats.bossesById[mission.enemyId] || 0 : state.stats[mission.stat];
    const progress = Math.min(progressValue, mission.target);
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

function storyReady(chapter) {
  return chapter.requirements.every(storyRequirementComplete);
}

function renderStory() {
  const content = $("#story-content");
  content.replaceChildren();
  const chapter = storyChapters[state.story.chapter];
  if (!chapter) {
    const finished = document.createElement("p");
    finished.className = "story-scene";
    finished.textContent = "The deed is safe, Dry Creek is standing, and the valley is yours to shape. Keep building, crafting, and taking work from the board.";
    content.append(finished);
    $("#story-count").textContent = `CAMPAIGN COMPLETE · ${storyChapters.length}/${storyChapters.length}`;
    return;
  }

  $("#story-count").textContent = `CHAPTER ${state.story.chapter + 1} OF ${storyChapters.length}`;
  const title = document.createElement("h3");
  title.textContent = chapter.title;
  const scene = document.createElement("p");
  scene.className = "story-scene";
  scene.textContent = chapter.scene;
  const requirements = document.createElement("ul");
  requirements.className = "story-requirements";
  for (const requirement of chapter.requirements) {
    const complete = storyRequirementComplete(requirement);
    const row = document.createElement("li");
    row.className = complete ? "story-requirement complete" : "story-requirement";
    const check = document.createElement("span");
    check.textContent = complete ? "✓" : "·";
    const label = document.createElement("span");
    label.textContent = requirement.label;
    const progress = document.createElement("b");
    progress.textContent = requirement.kind === "building" || requirement.kind === "land"
      ? complete ? "DONE" : "TODO"
      : `${Math.min(storyRequirementProgress(requirement), requirement.target)}/${requirement.target}`;
    row.append(check, label, progress);
    requirements.append(row);
  }
  const reward = document.createElement("small");
  reward.className = "story-reward";
  reward.textContent = `Chapter reward · $${chapter.reward} + ${chapter.xp} XP`;
  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "small-button story-complete-button";
  completeButton.dataset.storyComplete = "true";
  completeButton.textContent = "Continue the story →";
  completeButton.disabled = !storyReady(chapter);
  content.append(title, scene, requirements, reward, completeButton);
}

function buildingCostLabel(costs, money) {
  return `${formatMaterialCosts(costs)} · $${money}`;
}

function buildingBlockReason(buildingId, building) {
  if (!state.homestead.landClaimed) return "Claim the homestead first";
  if (!state.homestead.cabin) return "Build a cabin first";
  if (state.level < building.level) return `Unlocks at level ${building.level}`;
  if (state.homestead.buildings.includes(buildingId)) return "Already built";
  if (building.prerequisite && !state.homestead.buildings.includes(building.prerequisite)) {
    return `Requires ${homesteadBuildings[building.prerequisite].name}`;
  }
  if (homesteadPlotsUsed() + building.plots > (cabinTiers[state.homestead.cabin]?.plots || 0)) return "Expand your cabin to free more plots";
  if (state.money < building.money || !canPayMaterials(building.cost)) return "Gather funds and supplies";
  return "";
}

function renderHomestead() {
  renderStory();
  const home = state.homestead;
  const status = $("#homestead-status");
  status.textContent = !home.landClaimed ? "No deed yet · the old Bell place is waiting" : home.cabin
    ? cabinTiers[home.cabin].name
    : "Bell homestead · land claimed";
  const plotLimit = cabinTiers[home.cabin]?.plots || 0;
  $("#homestead-capacity").textContent = `${homesteadPlotsUsed()} / ${plotLimit} plots used`;
  const comfort = homesteadComfort();
  const bonusParts = [];
  if (comfort) bonusParts.push(`+${Math.min(20, comfort * 4)} sleep energy`);
  const bonuses = homesteadStatBonuses();
  if (bonuses.armor || bonuses.dodge || bonuses.aim) bonusParts.push(`Home defense: +${bonuses.armor} armor · +${bonuses.dodge}% dodge · +${bonuses.aim}% aim`);
  $("#homestead-buffs").textContent = bonusParts.length ? bonusParts.join(" · ") : "A roof over your head will improve sleep and help you hold the line.";

  const claimButton = $("#claim-land");
  claimButton.hidden = home.landClaimed;
  claimButton.disabled = home.landClaimed;
  const nextTier = cabinTiers[home.cabin + 1];
  const cabinButton = $("#upgrade-cabin");
  if (!nextTier) {
    cabinButton.textContent = "Homestead complete";
    cabinButton.disabled = true;
    $("#cabin-cost").textContent = "The largest home and full plot are yours.";
  } else {
    cabinButton.textContent = home.cabin ? "Expand the house" : "Build the cabin";
    cabinButton.disabled = !home.landClaimed || state.level < nextTier.level || state.money < nextTier.money || !canPayMaterials(nextTier.cost);
    $("#cabin-cost").textContent = `Next: ${nextTier.name} · ${buildingCostLabel(nextTier.cost, nextTier.money)} · Level ${nextTier.level}`;
  }

  const supplyList = $("#builder-stock");
  supplyList.replaceChildren();
  for (const stock of builderStock) {
    const row = document.createElement("div");
    row.className = "builder-stock-row";
    const label = document.createElement("span");
    label.textContent = `${materials[stock.id].icon} ${materials[stock.id].name} · owned ${countItem(stock.id)}`;
    const actions = document.createElement("div");
    actions.className = "builder-stock-actions";
    for (const quantity of [1, 5]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "small-button";
      button.dataset.buySupply = stock.id;
      button.dataset.quantity = String(quantity);
      button.textContent = `Buy ${quantity} · $${stock.price * quantity}`;
      button.disabled = state.money < stock.price * quantity;
      actions.append(button);
    }
    row.append(label, actions);
    supplyList.append(row);
  }

  const buildingList = $("#building-list");
  buildingList.replaceChildren();
  for (const [id, building] of Object.entries(homesteadBuildings)) {
    const card = document.createElement("article");
    card.className = `building-card${home.buildings.includes(id) ? " building-complete" : ""}`;
    const details = document.createElement("div");
    const heading = document.createElement("b");
    heading.textContent = `${building.icon} ${building.name}`;
    const description = document.createElement("p");
    description.textContent = building.description;
    const cost = document.createElement("small");
    const reason = buildingBlockReason(id, building);
    cost.textContent = home.buildings.includes(id) ? building.production
      ? `Daily yield on sleep · ${Object.entries(building.production).map(([item, amount]) => `+${amount} ${materials[item].shortName}`).join(" · ")}`
      : building.station ? "Crafting station · unlocks refined recipes" : `Home bonus · ${formatSetStats(building.bonus)}`
      : `${building.plots} plots · ${reason || buildingCostLabel(building.cost, building.money)}`;
    details.append(heading, description, cost);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "small-button";
    button.dataset.build = id;
    button.textContent = home.buildings.includes(id) ? "Built" : "Build";
    button.disabled = Boolean(reason);
    card.append(details, button);
    buildingList.append(card);
  }

  const refinementList = $("#refinement-list");
  refinementList.replaceChildren();
  for (const recipe of refinements) {
    const row = document.createElement("div");
    row.className = "refinement-row";
    const details = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = recipe.name;
    const description = document.createElement("small");
    description.textContent = `${formatMaterialCosts(recipe.input)} → ${Object.entries(recipe.output).map(([id, amount]) => `${materials[id].shortName} ×${amount}`).join(", ")}`;
    details.append(title, description);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "small-button";
    button.dataset.refine = recipe.id;
    const built = hasStation(recipe.station);
    button.textContent = built ? "Refine" : `Needs ${homesteadBuildings[recipe.station].name}`;
    button.disabled = !built || !canPayMaterials(recipe.input);
    row.append(details, button);
    refinementList.append(row);
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

function renderCombatPath() {
  const path = $("#combat-path");
  path.replaceChildren();
  const coyoteWins = state.stats.enemyWins.coyote || 0;
  const outlawWins = state.stats.enemyWins.outlaw || 0;
  const ironjawWins = state.stats.bossesById.ironjaw || 0;
  const ironjawUnlocked = canChallengeBoss(enemies.ironjaw) || ironjawWins > 0;
  const forgeBuilt = state.homestead.buildings.includes("heartforge");
  const railsteel = state.stats.refinedById.temperedIngot || 0;
  const railbreakerCrafted = state.stats.craftedById["railbreaker-rifle"] || 0;
  const vaneWins = state.stats.bossesById.vane || 0;
  const finaleUnlocked = canChallengeBoss(enemies.vane) || vaneWins > 0;
  const stages = [
    {
      title: "1. Earn the sheriff's trust",
      status: coyoteWins && outlawWins ? "COMPLETE" : "REQUIRED",
      complete: coyoteWins > 0 && outlawWins > 0,
      detail: `Defeat a Ridgeback coyote (${Math.min(coyoteWins, 1)}/1) and a Gulch road-agent (${Math.min(outlawWins, 1)}/1). Their trail clues are required to open Ironjaw's den.`,
    },
    {
      title: "2. Bring down Ironjaw",
      status: ironjawWins ? "COMPLETE" : ironjawUnlocked ? "UNLOCKED" : "LOCKED",
      complete: ironjawWins > 0,
      detail: ironjawWins
        ? "Ironjaw's ironheart is yours. Build the Ironheart Forge upgrade at your homestead."
        : "Requires both victories and their trail-mark/freight-token clues, chapter 7, level 3, and power 18. His ironheart is the key to the special forge.",
    },
    {
      title: "3. Forge the Railbreaker",
      status: railbreakerCrafted ? "COMPLETE" : forgeBuilt ? "IN PROGRESS" : "LOCKED",
      complete: railbreakerCrafted > 0,
      detail: `Build the Ironheart Forge, temper 3 railsteel (each uses 2 copper ingots + 3 scrap; ${Math.min(railsteel, 3)}/3 made), then craft the rifle with 4 leather, 8 scrap, and $480 (${Math.min(railbreakerCrafted, 1)}/1).`,
    },
    {
      title: "4. Stop Silas Vane",
      status: vaneWins ? "COMPLETE" : finaleUnlocked ? "UNLOCKED" : "LOCKED",
      complete: vaneWins > 0,
      detail: finaleUnlocked
        ? "Defeat Vane to finish the campaign and claim his signet."
        : "Reach chapter 10, level 8, and equipment power 45; equip the Railbreaker rifle. Vane cannot be challenged with another weapon.",
    },
  ];
  for (const stage of stages) {
    const card = document.createElement("article");
    card.className = `combat-stage${stage.complete ? " combat-stage-complete" : ""}`;
    const header = document.createElement("div");
    header.className = "combat-stage-heading";
    const title = document.createElement("b");
    title.textContent = stage.title;
    const status = document.createElement("span");
    status.textContent = stage.status;
    header.append(title, status);
    const detail = document.createElement("p");
    detail.textContent = stage.detail;
    card.append(header, detail);
    path.append(card);
  }
}

function renderBattle() {
  renderCombatPath();
  const list = $("#enemy-list");
  list.replaceChildren();
  for (const [id, enemy] of Object.entries(enemies)) {
    const bossReady = !enemy.boss || canChallengeBoss(enemy);
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
    info.textContent = enemy.boss && !bossReady ? bossLockReason(enemy) : `${enemy.kind} · ${enemy.health} health`;
    const purpose = document.createElement("small");
    purpose.className = "enemy-purpose";
    purpose.textContent = enemy.purpose;
    copy.append(name, info, purpose);
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
  $("#battle-description").textContent = enemy
    ? `${enemy.kind} · Victory earns $${enemy.reward} and ${enemy.xp} XP. ${enemy.purpose}`
    : "Combat is part of the Vane Ledger campaign. Defeat the coyote and outlaw to track Ironjaw; his ironheart unlocks the forge and the Railbreaker rifle needed to face Vane.";
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
  renderHomestead();
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
    const progress = mission.enemyId ? state.stats.bossesById[mission.enemyId] || 0 : state.stats[mission.stat];
    if (progress < mission.target || state.claimedMissions.includes(mission.id)) continue;
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
  state.stats.jobsById[id] = (state.stats.jobsById[id] || 0) + 1;
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
  state.stats.explorations += 1;
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
  const missingStations = recipe ? (recipe.stations || []).filter((station) => !hasStation(station)) : [];
  if (recipe && missingStations.length) {
    showToast(`Build the ${missingStations.map((station) => homesteadBuildings[station].name).join(" and ")} before crafting this.`);
    return;
  }
  if (!recipe || recipe.level > state.level || state.money < recipe.cost || !canPayMaterials(recipe.materials)) {
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
  state.stats.craftedById[recipe.output] = (state.stats.craftedById[recipe.output] || 0) + 1;
  addNote(`Crafted ${itemInfo(recipe.output).name} at the workbench.`);
  updateMissions();
  showToast(`Crafted ${itemInfo(recipe.output).name}.`);
  saveState();
  render();
}

function claimHomestead() {
  if (state.homestead.landClaimed) return;
  state.homestead.landClaimed = true;
  addNote("You signed the deed to the old Bell place. The land is yours; now it needs a roof.");
  showToast("Homestead claimed. Visit the Builder's Yard for supplies.");
  saveState();
  render();
}

function upgradeCabin() {
  const nextTier = cabinTiers[state.homestead.cabin + 1];
  if (!state.homestead.landClaimed || !nextTier || state.level < nextTier.level || state.money < nextTier.money || !canPayMaterials(nextTier.cost)) return;
  for (const [id, amount] of Object.entries(nextTier.cost)) removeItem(id, amount);
  state.money -= nextTier.money;
  state.homestead.cabin += 1;
  addNote(`Built ${nextTier.name}. The homestead now holds ${nextTier.plots} building plots.`);
  showToast(`${nextTier.name} raised.`);
  saveState();
  render();
}

function buildHomesteadBuilding(id) {
  const building = homesteadBuildings[id];
  if (!building || buildingBlockReason(id, building)) return;
  for (const [material, amount] of Object.entries(building.cost)) removeItem(material, amount);
  state.money -= building.money;
  state.homestead.buildings.push(id);
  addNote(`Built ${building.name} on the homestead.`);
  showToast(`${building.name} is ready.`);
  saveState();
  render();
}

function buyBuildingSupply(id, quantity) {
  const stock = builderStock.find((entry) => entry.id === id);
  if (!stock || !Number.isInteger(quantity) || quantity < 1 || state.money < stock.price * quantity) return;
  state.money -= stock.price * quantity;
  addItem(stock.id, quantity);
  addNote(`Bought ${quantity} ${materials[id].name} from the Builder's Yard for $${stock.price * quantity}.`);
  showToast(`Bought ${materials[id].shortName} ×${quantity}.`);
  saveState();
  render();
}

function refineMaterial(id) {
  const recipe = refinements.find((entry) => entry.id === id);
  if (!recipe || !hasStation(recipe.station) || !canPayMaterials(recipe.input)) return;
  for (const [material, amount] of Object.entries(recipe.input)) removeItem(material, amount);
  for (const [material, amount] of Object.entries(recipe.output)) addItem(material, amount);
  state.stats.refined += Object.values(recipe.output).reduce((sum, amount) => sum + amount, 0);
  for (const [material, amount] of Object.entries(recipe.output)) {
    state.stats.refinedById[material] = (state.stats.refinedById[material] || 0) + amount;
  }
  addNote(`Refined materials at the ${homesteadBuildings[recipe.station].name}: ${Object.entries(recipe.output).map(([item, amount]) => `${materials[item].name} ×${amount}`).join(", ")}.`);
  updateMissions();
  showToast(`${recipe.name} complete.`);
  saveState();
  render();
}

function completeStoryChapter() {
  const chapter = storyChapters[state.story.chapter];
  if (!chapter || !storyReady(chapter)) return;
  state.story.completed.push(state.story.chapter + 1);
  state.story.chapter += 1;
  state.money += chapter.reward;
  gainExperience(chapter.xp);
  addNote(`Chapter complete: "${chapter.title}". Dry Creek paid $${chapter.reward} for the work.`);
  showToast(`Chapter complete: ${chapter.title} · +$${chapter.reward} · +${chapter.xp} XP`);
  saveState();
  render();
}

function applyHomesteadProduction() {
  const produced = {};
  for (const id of state.homestead.buildings) {
    for (const [material, amount] of Object.entries(homesteadBuildings[id].production || {})) {
      produced[material] = (produced[material] || 0) + amount;
    }
  }
  const entries = Object.entries(produced);
  if (!entries.length) return;
  for (const [material, amount] of entries) {
    addItem(material, amount);
    state.stats.materialsGathered += amount;
    state.dailyProgress.materials += amount;
  }
  state.stats.productionDays += 1;
  addNote(`The homestead produced ${entries.map(([id, amount]) => `${materials[id].shortName} ×${amount}`).join(", ")} overnight.`);
  updateMissions();
}

function storyAction(event) {
  const target = event.target.closest("[data-story-complete], [data-build], [data-buy-supply], [data-refine]");
  if (!target) return;
  if (target.hasAttribute("data-story-complete")) completeStoryChapter();
  else if (target.hasAttribute("data-build")) buildHomesteadBuilding(target.dataset.build);
  else if (target.hasAttribute("data-buy-supply")) buyBuildingSupply(target.dataset.buySupply, Number(target.dataset.quantity));
  else if (target.hasAttribute("data-refine")) refineMaterial(target.dataset.refine);
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
  const comfort = homesteadComfort();
  const energyRecovered = 60 + Math.min(20, comfort * 4);
  const healthRecovered = 25 + Math.min(15, comfort * 3);
  const actualEnergy = Math.min(energyRecovered, 100 - state.energy);
  const actualHealth = Math.min(healthRecovered, 100 - state.health);
  state.energy = Math.min(100, state.energy + energyRecovered);
  state.health = Math.min(100, state.health + healthRecovered);
  state.jobsDone = [];
  state.questClaimed = false;
  state.dailyProgress = freshDailyProgress();
  applyHomesteadProduction();
  addNote(`Day ${state.day} dawned over Dry Creek. The job board is fresh again.`);
  showToast(`Good morning. Day ${state.day} begins. +${actualEnergy} energy, +${actualHealth} health.`);
  saveState();
  render();
}

function beginFight(id) {
  const enemy = enemies[id];
  if (!enemy || state.encounter) return;
  if (enemy.boss && !canChallengeBoss(enemy)) {
    showToast(`${enemy.name} is out of reach. ${bossLockReason(enemy)}.`);
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
  const enemyId = state.encounter?.id;
  state.money += enemy.reward;
  gainExperience(enemy.xp);
  state.stats.monstersDefeated += 1;
  state.stats.enemyWins[enemyId] = (state.stats.enemyWins[enemyId] || 0) + 1;
  state.dailyProgress.fights += 1;
  if (enemy.boss) {
    state.stats.bossesDefeated += 1;
    state.stats.bossesById[enemyId] = (state.stats.bossesById[enemyId] || 0) + 1;
  }
  const rewardRoll = Math.random();
  let loot = "";
  if (enemyId === "ironjaw") {
    const rewards = [];
    if (!countItem("ironjaw-trophy")) {
      addItem("ironjaw-trophy");
      rewards.push("tooth");
    }
    if (!countItem("ironheart") && !state.homestead.buildings.includes("heartforge")) {
      addItem("ironheart");
      rewards.push("ironheart");
    }
    if (rewards.includes("ironheart")) {
      loot = ` You recovered Ironjaw's ${rewards.join(" and ")}; the ironheart unlocks the Ironheart Forge.`;
    } else if (rewards.length) {
      loot = ` You recovered Ironjaw's ${rewards[0]}.`;
    }
    if (!countItem("silver-star")) {
      addItem("silver-star");
      loot += " The marshal's silver star, too!";
    }
  } else if (enemyId === "vane") {
    if (!countItem("vane-signet")) {
      addItem("vane-signet");
      loot = " You claimed Vane's silver signet.";
    }
  } else if (enemyId === "coyote" || enemyId === "outlaw") {
    const clue = enemyId === "coyote" ? "ridgebackMark" : "freightToken";
    if (!countItem(clue)) {
      addItem(clue);
      loot = ` You recovered the ${materials[clue].name}; it points the sheriff toward Ironjaw's den.`;
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
  if (enemyId === "ironjaw" && !countItem("silver-star")) {
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
$("#claim-land").addEventListener("click", claimHomestead);
$("#upgrade-cabin").addEventListener("click", upgradeCabin);
$("#homestead-panel").addEventListener("click", storyAction);
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
