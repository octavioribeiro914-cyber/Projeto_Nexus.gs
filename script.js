/* ==========================================================================
   NEXUS — script.js
   Comportamentos comuns a todas as páginas:
   1. Menu hambúrguer (abrir/fechar no mobile)
   2. Cabeçalho que muda de estilo ao rolar a página
   3. Animação de entrada dos elementos (.reveal)
   4. Contadores animados (números de impacto)
   5. Ano atual no rodapé
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initHeaderOnScroll();
  initRevealOnScroll();
  initCounters();
  setFooterYear();
});

/* 1. Menu hambúrguer ------------------------------------------------------ */
function initMobileMenu() {
  const toggleButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (!toggleButton || !nav) return;

  const openMenu = () => {
    nav.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
    toggleButton.setAttribute("aria-label", "Fechar menu");
    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
  };

  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  // Fecha ao clicar em um link do menu
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  // Fecha com a tecla Esc
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      toggleButton.focus();
    }
  });

  // Se a tela voltar para o tamanho desktop, garante o menu fechado
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

/* 2. Cabeçalho ao rolar --------------------------------------------------- */
function initHeaderOnScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* 3. Elementos surgem ao entrar na tela ----------------------------------- */
function initRevealOnScroll() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  // Navegadores antigos: mostra tudo direto
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("is-visible");
          observer.unobserve(el); // anima só uma vez
          // Depois de aparecer, remove os atrasos para o hover responder na hora
          el.addEventListener(
            "transitionend",
            () => el.classList.remove("reveal", "is-visible", "delay-1", "delay-2", "delay-3"),
            { once: true }
          );
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* 4. Contadores animados -------------------------------------------------- */
/* Uso no HTML: <strong data-counter="100" data-suffix="%">0</strong> */
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = Number(el.dataset.counter);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // desaceleração suave
      el.textContent = prefix + Math.round(target * eased).toLocaleString("pt-BR") + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* 5. Ano no rodapé -------------------------------------------------------- */
function setFooterYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
