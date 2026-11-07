const state = {
  money: 85,
  energy: 70,
  health: 100,
  xp: 0,
  level: 1,
  day: 1,
  jobsDone: [],
  route: "creek",
  questClaimed: false,
  inventory: [{ id: "biscuit", name: "Trail biscuits", detail: "A little something for the long ride.", icon: "▤", quantity: 1, usable: true }],
};

const jobs = {
  mail: { name: "Letters for Red Mesa", cost: 12, reward: 24, xp: 18, chance: 0.1 },
  ranch: { name: "Fence-line trouble", cost: 20, reward: 39, xp: 28, chance: 0.38 },
  saloon: { name: "Last call at the Lantern", cost: 26, reward: 52, xp: 36, chance: 0.48 },
};

const routes = {
  creek: { name: "Take the creek path", description: "A short ramble with a chance of pocket change or something useful.", cost: 10, danger: 0.04, coins: [4, 17] },
  mesa: { name: "Ride for Red Mesa", description: "A longer ride, but the old trail has a way of giving things back.", cost: 18, danger: 0.12, coins: [10, 32] },
  pines: { name: "Wander the pines", description: "Keep your ears open. The quiet trails can hide a surprise or two.", cost: 15, danger: 0.19, coins: [7, 26] },
};

const $ = (selector) => document.querySelector(selector);
const toast = $("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
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
}

function addItem(item) {
  const existing = state.inventory.find((entry) => entry.id === item.id);
  if (existing) existing.quantity += 1;
  else state.inventory.push({ ...item, quantity: 1 });
}

function renderInventory() {
  const list = $("#inventory-list");
  list.replaceChildren();
  $("#inventory-count").textContent = `${state.inventory.reduce((sum, item) => sum + item.quantity, 0)} ${state.inventory.length === 1 ? "ITEM" : "ITEMS"}`;

  if (state.inventory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = "Your satchel is light. The next trail might change that.";
    list.append(empty);
    return;
  }

  for (const item of state.inventory) {
    const row = document.createElement("div");
    row.className = "inventory-item";
    const icon = document.createElement("span");
    icon.className = "inventory-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icon;
    const details = document.createElement("span");
    details.className = "inventory-details";
    const name = document.createElement("b");
    name.textContent = item.name;
    const description = document.createElement("small");
    description.textContent = item.detail;
    details.append(name, description);
    const count = document.createElement("span");
    count.className = "inventory-quantity";
    count.textContent = `×${item.quantity}`;
    row.append(icon, details, count);

    if (item.usable) {
      const use = document.createElement("button");
      use.type = "button";
      use.className = "use-button";
      use.textContent = "Use";
      use.setAttribute("aria-label", `Use ${item.name}`);
      use.addEventListener("click", () => useItem(item.id));
      row.append(use);
    }
    list.append(row);
  }
}

function render() {
  $("#money-value").textContent = `$${state.money}`;
  $("#energy-value").textContent = `${state.energy} / 100`;
  $("#health-value").textContent = `${state.health} / 100`;
  $("#energy-bar").style.width = `${state.energy}%`;
  $("#health-bar").style.width = `${state.health}%`;
  $("#level").textContent = `LVL ${state.level}`;
  $("#jobs-count").textContent = `${state.jobsDone.length} / 3 JOBS TAKEN`;
  $("#quest-progress").textContent = `${Math.min(state.jobsDone.length, 3)} / 3`;
  $("#quest-bar").style.width = `${Math.min(state.jobsDone.length, 3) / 3 * 100}%`;
  $("#quest-check").textContent = state.jobsDone.length >= 3 ? "✓" : "·";
  $("#quest-check").classList.toggle("complete", state.jobsDone.length >= 3);
  $("#day-label").textContent = `DAY ${String(state.day).padStart(2, "0")}`;

  for (const [id, job] of Object.entries(jobs)) {
    const button = document.querySelector(`[data-job="${id}"]`);
    const card = document.querySelector(`[data-job-card="${id}"]`);
    const completed = state.jobsDone.includes(id);
    button.disabled = completed || state.jobsDone.length >= 3;
    button.textContent = completed ? "Done for today" : state.jobsDone.length >= 3 ? "Board is clear" : "Take the job →";
    card.classList.toggle("completed", completed);
    card.classList.toggle("board-closed", !completed && state.jobsDone.length >= 3);
    card.dataset.energyCost = job.cost;
  }

  $("#route-title").textContent = routes[state.route].name;
  $("#route-description").textContent = routes[state.route].description;
  $("#explore-button").disabled = state.energy < routes[state.route].cost;
  $("#explore-button").title = state.energy < routes[state.route].cost ? "Rest at the saloon to get more energy." : "";
  $("#rest-button").disabled = state.money < 6 || state.energy >= 100;
  $("#day-button").disabled = state.energy === 100 && state.jobsDone.length === 0;
  renderInventory();
}

function gainExperience(amount) {
  state.xp += amount;
  const needed = state.level * 70;
  if (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    state.health = Math.min(100, state.health + 12);
    addNote(`You made level ${state.level}. The town knows your name now.`);
    showToast(`Level up! You're now level ${state.level}.`);
  }
}

function claimDailyBonus() {
  if (state.jobsDone.length >= 3 && !state.questClaimed) {
    state.money += 30;
    state.questClaimed = true;
    addNote("The town clerk added a $30 bonus to your pay.");
    showToast("Three jobs done! The clerk's $30 bonus is yours.");
  }
}

function takeJob(id) {
  const job = jobs[id];
  if (!job || state.jobsDone.includes(id) || state.jobsDone.length >= 3) return;
  if (state.energy < job.cost) {
    showToast("You're running low. Take a breather at the saloon first.");
    return;
  }

  state.energy -= job.cost;
  state.money += job.reward;
  state.jobsDone.push(id);
  gainExperience(job.xp);
  let note = `Finished "${job.name}" and earned $${job.reward}.`;
  if (Math.random() < job.chance) {
    const find = { id: "lucky-spur", name: "Lucky spur", detail: "A little tarnished, but Ada swears by it.", icon: "✧" };
    addItem(find);
    note += " Found a lucky spur along the way.";
  }
  addNote(note);
  claimDailyBonus();
  render();
}

function explore() {
  const route = routes[state.route];
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
    message = `A rattlesnake sent you scrambling on the trail. You made it back, a little worse for wear.`;
  } else if (roll < route.danger + 0.32) {
    const item = { id: "wild-herbs", name: "Wild herbs", detail: "A handful from the shady side of the trail.", icon: "✿" };
    addItem(item);
    message = "You found wild herbs tucked beside the trail.";
  } else {
    const [min, max] = route.coins;
    const found = Math.floor(Math.random() * (max - min + 1)) + min;
    state.money += found;
    message = `The trail paid off: you found $${found} in loose change.`;
  }
  addNote(message);
  showToast(message);
  render();
}

function useItem(id) {
  const itemIndex = state.inventory.findIndex((entry) => entry.id === id);
  if (itemIndex < 0) return;
  const item = state.inventory[itemIndex];
  if (id === "biscuit") {
    if (state.energy >= 100) {
      showToast("You're already full of energy. Save those biscuits for the trail.");
      return;
    }
    state.energy = Math.min(100, state.energy + 25);
    showToast("That hit the spot. +25 energy.");
  } else {
    showToast(`${item.name} might come in handy later.`);
    return;
  }
  item.quantity -= 1;
  if (item.quantity <= 0) state.inventory.splice(itemIndex, 1);
  addNote("A quick snack before heading back out.");
  render();
}

function rest() {
  if (state.money < 6 || state.energy >= 100) return;
  state.money -= 6;
  const recovered = Math.min(30, 100 - state.energy);
  state.energy += recovered;
  addNote(`Coffee at the Lantern. You got ${recovered} energy back.`);
  showToast(`A hot coffee and a quiet chair. +${recovered} energy.`);
  render();
}

function startNewDay() {
  state.day += 1;
  state.energy = Math.min(100, state.energy + 60);
  state.health = Math.min(100, state.health + 25);
  state.jobsDone = [];
  state.questClaimed = false;
  addNote(`Day ${state.day} dawned over Dry Creek. The job board is fresh again.`);
  showToast(`Good morning. Day ${state.day} begins.`);
  render();
}

document.querySelectorAll("[data-job]").forEach((button) => {
  button.addEventListener("click", () => takeJob(button.dataset.job));
});

document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => {
    state.route = button.dataset.route;
    document.querySelectorAll("[data-route]").forEach((routeButton) => {
      const selected = routeButton === button;
      routeButton.classList.toggle("selected", selected);
      routeButton.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

$("#explore-button").addEventListener("click", explore);
$("#rest-button").addEventListener("click", rest);
$("#day-button").addEventListener("click", startNewDay);
render();
