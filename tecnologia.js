/* ==========================================================================
   NEXUS — tecnologia.js
   Sistema de abas acessível (LoRa, Satélite, Mesh das antenas, GPS).
   Funciona com clique e com as setas do teclado.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = document.querySelectorAll(".tab-panel");

  if (!tabs.length) return;

  function activateTab(tab, moveFocus = false) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });

    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));

    // Navegação pelas setas (padrão de acessibilidade para abas)
    tab.addEventListener("keydown", (event) => {
      let newIndex = null;
      if (event.key === "ArrowRight") newIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") newIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") newIndex = 0;
      if (event.key === "End") newIndex = tabs.length - 1;

      if (newIndex !== null) {
        event.preventDefault();
        activateTab(tabs[newIndex], true);
      }
    });
  });
});
