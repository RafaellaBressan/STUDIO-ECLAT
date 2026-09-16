"use strict";
document.documentElement.classList.add("js");
(() => {
  const config = window.SITE_CONFIG || {};
  const demo =
    config.demo !== false || !/^\d{10,15}$/.test(config.whatsapp || "");
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const menu = $(".menu-toggle");
  const nav = $(".nav");
  function closeMenu() {
    if (!menu || !nav) return;
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Abrir menu");
    nav.classList.remove("is-open");
  }
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  });
  let lastFocus = null;
  function openDialog(dialog) {
    lastFocus = document.activeElement;
    closeMenu();
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  $$("dialog").forEach((dialog) => {
    $("[data-close]", dialog)?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      lastFocus?.focus();
    });
  });
  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }
  async function copyMessage(text, fallback) {
    try {
      if (!navigator.clipboard) throw new Error("clipboard");
      await navigator.clipboard.writeText(text);
      toast("Mensagem copiada.");
    } catch {
      fallback.focus();
      fallback.select();
      toast("Mensagem selecionada. Use Ctrl+C ou a opção Copiar.");
    }
  }
  function whatsappURL(message) {
    return (
      "https://wa.me/" +
      config.whatsapp +
      "?text=" +
      encodeURIComponent(message)
    );
  }
  const booking = $("#booking-dialog");
  if (booking) {
    const form = $("#booking-form");
    const date = $("#booking-date");
    const now = new Date();
    const min = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    date.min = min;
    $$("[data-booking]").forEach((button) =>
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const service = button.dataset.booking;
        if (
          service &&
          $$("#booking-service option").some((o) => o.value === service)
        )
          $("#booking-service").value = service;
        $("#booking-result").hidden = true;
        openDialog(booking);
      }),
    );
    if (!demo) {
      $("#booking-submit").textContent = "Continuar no WhatsApp";
      $("#booking-note").textContent =
        "A solicitação será confirmada pela equipe. O envio não garante disponibilidade.";
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const [y, m, d] = date.value.split("-");
      const message = `Olá, ${config.name}! Gostaria de consultar um horário para ${$("#booking-service").value}, em ${d}/${m}/${y}, no período ${$("#booking-period").value}. Poderiam confirmar a disponibilidade?`;
      if (!demo) {
        window.open(whatsappURL(message), "_blank", "noopener,noreferrer");
        return;
      }
      $("#booking-message").value = message;
      $("#booking-result").hidden = false;
      $("#booking-message").focus();
    });
    $("#copy-booking").addEventListener("click", () =>
      copyMessage($("#booking-message").value, $("#booking-message")),
    );
  }
  const lightbox = $("#lightbox-dialog");
  $$("[data-gallery]").forEach((button) =>
    button.addEventListener("click", () => {
      const img = $("img", button);
      $("#lightbox-image").src = button.dataset.gallery || img.src;
      $("#lightbox-image").alt = img.alt;
      $("#lightbox-caption").textContent = img.alt + " · Imagem ilustrativa";
      openDialog(lightbox);
    }),
  );
  const products = $$(".product");
  if (products.length) {
    const cart = new Map();
    const money = (n) =>
      n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    let orderMessage = "";
    const basket = $("#basket-dialog");
    const formatOrder = () =>
      `Olá, ${config.name}! Gostaria de consultar a disponibilidade para retirada:\n\n${[...cart.values()].map((p) => `${p.qty}× ${p.name} — ${money(p.price * p.qty)}`).join("\n")}\n\nTotal estimado: ${money([...cart.values()].reduce((s, p) => s + p.price * p.qty, 0))}.\nPodem confirmar o pedido e o horário de retirada?`;
    function renderCart() {
      const count = [...cart.values()].reduce((sum, p) => sum + p.qty, 0);
      const total = [...cart.values()].reduce(
        (sum, p) => sum + p.qty * p.price,
        0,
      );
      $$("[data-cart-count]").forEach((el) => (el.textContent = String(count)));
      $("#cart-total").textContent = money(total);
      $("#cart-empty").hidden = count > 0;
      $("#cart-summary").hidden = count === 0;
      $("#cart-next").disabled = count === 0;
      $("#order-result").hidden = true;
      const list = $("#cart-items");
      list.replaceChildren();
      for (const [id, item] of cart) {
        const row = document.createElement("li");
        row.className = "cart-row";
        const info = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = item.name;
        const price = document.createElement("span");
        price.textContent = money(item.price);
        info.append(title, price);
        const counter = document.createElement("div");
        counter.className = "quantity";
        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Remover uma unidade de " + item.name);
        const quantity = document.createElement("span");
        quantity.textContent = String(item.qty);
        quantity.setAttribute("aria-label", item.qty + " unidades");
        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute(
          "aria-label",
          "Adicionar uma unidade de " + item.name,
        );
        plus.disabled = item.qty >= 20;
        minus.addEventListener("click", () => {
          item.qty--;
          if (!item.qty) cart.delete(id);
          renderCart();
          $("#cart-next").focus();
        });
        plus.addEventListener("click", () => {
          if (item.qty < 20) item.qty++;
          renderCart();
          $("#cart-next").focus();
        });
        counter.append(minus, quantity, plus);
        row.append(info, counter);
        list.append(row);
      }
    }
    $$("[data-add]").forEach((button) =>
      button.addEventListener("click", () => {
        const product = button.closest(".product");
        const id = product.dataset.id;
        const old = cart.get(id);
        if (old?.qty >= 20) {
          toast("Limite de 20 unidades por item na demonstração.");
          return;
        }
        cart.set(id, {
          name: product.dataset.name,
          price: Number(product.dataset.price),
          qty: (old?.qty || 0) + 1,
        });
        renderCart();
        toast(product.dataset.name + " adicionado à seleção.");
      }),
    );
    $$("[data-basket]").forEach((button) =>
      button.addEventListener("click", (e) => {
        e.preventDefault();
        renderCart();
        openDialog(basket);
      }),
    );
    $$("[data-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        $$("[data-filter]").forEach((b) =>
          b.setAttribute("aria-pressed", String(b === button)),
        );
        products.forEach(
          (p) =>
            (p.hidden =
              button.dataset.filter !== "todos" &&
              p.dataset.category !== button.dataset.filter),
        );
        $("#filter-status").textContent =
          products.filter((p) => !p.hidden).length +
          " produtos na categoria selecionada.";
      }),
    );
    $("#cart-next").addEventListener("click", () => {
      if (!cart.size) return;
      orderMessage = formatOrder();
      if (!demo) {
        window.open(whatsappURL(orderMessage), "_blank", "noopener,noreferrer");
        return;
      }
      $("#order-message").value = orderMessage;
      $("#order-result").hidden = false;
      $("#order-message").focus();
    });
    $("#copy-order").addEventListener("click", () =>
      copyMessage(orderMessage, $("#order-message")),
    );
    if (!demo) {
      $("#cart-next").textContent = "Continuar no WhatsApp";
      $("#cart-note").textContent =
        "Consulte disponibilidade e confirme o valor com a equipe. Nenhum pagamento é feito neste site.";
    }
    renderCart();
  }
})();
