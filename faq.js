/* ==========================================================================
   NEXUS — faq.js
   FAQ com perguntas expansíveis (acordeão), busca por texto e filtro
   por categoria.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const items = Array.from(document.querySelectorAll(".faq-item"));
  const searchInput = document.getElementById("faq-search");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const emptyMessage = document.getElementById("faq-empty");
  const resultCount = document.getElementById("faq-count");

  if (!items.length) return;

  let activeCategory = "todas";

  /* Acordeão: abre/fecha a pergunta clicada ------------------------------ */
  items.forEach((item) => {
    const button = item.querySelector(".faq-question");

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Fecha as outras para manter a lista organizada
      items.forEach((other) => setItemOpen(other, false));
      setItemOpen(item, !isOpen);
    });
  });

  function setItemOpen(item, open) {
    item.classList.toggle("is-open", open);
    item.querySelector(".faq-question").setAttribute("aria-expanded", String(open));
  }

  /* Busca e filtro ------------------------------------------------------ */
  // Remove acentos para a busca funcionar com "mesh", "Mésh", "LORA" etc.
  const normalize = (text) =>
    text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function applyFilters() {
    const term = normalize(searchInput ? searchInput.value.trim() : "");
    let visible = 0;

    items.forEach((item) => {
      const matchesCategory = activeCategory === "todas" || item.dataset.category === activeCategory;
      const matchesText = !term || normalize(item.textContent).includes(term);
      const show = matchesCategory && matchesText;

      item.hidden = !show;
      if (show) visible++;
    });

    if (emptyMessage) emptyMessage.hidden = visible > 0;
    if (resultCount) {
      resultCount.textContent = `${visible} ${visible === 1 ? "pergunta encontrada" : "perguntas encontradas"}`;
    }
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter;
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      applyFilters();
    });
  });

  applyFilters();
});
