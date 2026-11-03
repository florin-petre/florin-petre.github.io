const cart = new Map();
const dialog = document.querySelector(".inquiry-dialog");
const cartCount = document.querySelector(".cart-count");
const inquiryItems = document.querySelector(".inquiry-items");
const emptyMessage = document.querySelector(".empty-message");
const toast = document.querySelector(".toast");
const form = document.querySelector("#inquiry-form");
const nav = document.querySelector("#main-nav");
const menuToggle = document.querySelector(".menu-toggle");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function updateCart() {
  const totalCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
  inquiryItems.replaceChildren();

  for (const [name, item] of cart) {
    const row = document.createElement("div");
    row.className = "inquiry-item";

    const details = document.createElement("div");
    const title = document.createElement("div");
    title.className = "item-name";
    title.textContent = name;
    const price = document.createElement("div");
    price.className = "item-price";
    price.textContent = `${item.price} lei / buc.`;
    details.append(title, price);

    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    const decrement = document.createElement("button");
    decrement.type = "button";
    decrement.textContent = "−";
    decrement.setAttribute("aria-label", `Scade cantitatea pentru ${name}`);
    decrement.addEventListener("click", () => changeQuantity(name, -1));
    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;
    const increment = document.createElement("button");
    increment.type = "button";
    increment.textContent = "+";
    increment.setAttribute("aria-label", `Crește cantitatea pentru ${name}`);
    increment.addEventListener("click", () => changeQuantity(name, 1));
    controls.append(decrement, quantity, increment);
    row.append(details, controls);
    inquiryItems.append(row);
  }

  emptyMessage.classList.toggle("visible", cart.size === 0);
}

function changeQuantity(name, amount) {
  const item = cart.get(name);
  if (!item) return;

  item.quantity += amount;
  if (item.quantity <= 0) cart.delete(name);
  updateCart();
}

document.querySelectorAll("[data-product-card]").forEach((card) => {
  card.querySelector("[data-add]").addEventListener("click", () => {
    const { name, price } = card.dataset;
    const item = cart.get(name);
    if (item) item.quantity += 1;
    else cart.set(name, { price: Number(price), quantity: 1 });
    updateCart();
    showToast(`${name} a fost adăugat în cererea ta.`);
  });
});

document.querySelectorAll("[data-open-inquiry]").forEach((button) => {
  button.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    dialog.showModal();
  });
});

document.querySelector("[data-close-inquiry]").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cart.size === 0) {
    showToast("Adaugă cel puțin un model în cerere.");
    return;
  }
  form.querySelector(".form-success").hidden = false;
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
updateCart();
