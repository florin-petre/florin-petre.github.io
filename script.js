const cart = new Map();
const dialog = document.querySelector(".inquiry-dialog");
const cartCount = document.querySelector(".cart-count");
const inquiryItems = document.querySelector(".inquiry-items");
const emptyMessage = document.querySelector(".empty-message");
const toast = document.querySelector(".toast");
const form = document.querySelector("#inquiry-form");
const formSuccess = form.querySelector(".form-success");
const formError = form.querySelector(".form-error");
const submitButton = form.querySelector(".submit-button");
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formSuccess.hidden = true;
  formError.hidden = true;

  if (cart.size === 0) {
    formError.textContent = "Adaugă cel puțin un model în cerere.";
    formError.hidden = false;
    return;
  }

  const chairRequest = [...cart]
    .map(([name, item]) => `${name}: ${item.quantity} buc. × ${item.price} lei`)
    .join("\n");
  const estimatedSubtotal = [...cart.values()].reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  form.querySelector("#chair-request").value = chairRequest;
  form.querySelector("#estimated-subtotal").value = `${estimatedSubtotal} lei (estimativ, fără transport și manipulare)`;

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.firstChild.textContent = "Se trimite...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      let message = `Trimiterea nu a reușit (cod ${response.status}). Încearcă din nou.`;
      try {
        const result = await response.json();
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          message = result.errors.map((error) => error.message).join(" ");
        }
      } catch {
        // Keep the explicit HTTP status message if the response isn't JSON.
      }
      throw new Error(message);
    }

    formSuccess.textContent = "Mulțumim! Cererea a fost trimisă. Te vom contacta pentru a confirma disponibilitatea.";
    formSuccess.hidden = false;
    form.reset();
    cart.clear();
    updateCart();
  } catch (error) {
    formError.textContent = error instanceof Error
      ? error.message
      : "Nu am putut trimite cererea. Verifică-ți conexiunea și încearcă din nou.";
    formError.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.firstChild.textContent = "Trimite cererea ";
  }
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
