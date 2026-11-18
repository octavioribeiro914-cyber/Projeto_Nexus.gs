/* ==========================================================================
   NEXUS — mesh.js
   Simulação VISUAL da rede NEXUS (não transmite mensagens reais).

   Como funciona:
   - A rede é um grafo: NODES são os dispositivos e EDGES as conexões.
   - O SOS sai do dispositivo direto para uma antena LoRa ou para o
     satélite (sem celulares intermediários e sem Bluetooth).
   - As antenas LoRa formam uma malha (Mesh): se o link de uma cair,
     outra antena assume. O satélite é o canal reserva.
   - Para achar o caminho, usamos o algoritmo de Dijkstra (menor custo).
   - O botão "Simular falha" derruba uma conexão do caminho e a rede
     recalcula uma rota alternativa, mesmo com a mensagem em trânsito.
   - Também é possível clicar em uma conexão para derrubá-la/restaurá-la.
   ========================================================================== */

(() => {
  "use strict";

  /* Dados da rede --------------------------------------------------------- */
  // Não há celulares intermediários: o SOS sai do dispositivo direto para
  // uma antena LoRa ou para o satélite. A malha (Mesh) é formada pelas antenas.
  const NODES = [
    { id: "O", label: "Dispositivo NEXUS", short: "SOS", x: 90, y: 290, type: "origin" },
    { id: "L1", label: "Antena LoRa 1", short: "L1", x: 330, y: 230, type: "antenna" },
    { id: "L2", label: "Antena LoRa 2", short: "L2", x: 320, y: 400, type: "antenna" },
    { id: "L3", label: "Antena LoRa 3", short: "L3", x: 575, y: 330, type: "antenna" },
    { id: "S", label: "Satélite", short: "SAT", x: 450, y: 70, type: "satellite" },
    { id: "R", label: "Central de resgate", short: "+", x: 815, y: 270, type: "rescue" },
  ];

  // [origem, destino, canal usado naquele trecho]
  const EDGES = [
    ["O", "L1", "LoRa"],
    ["O", "L2", "LoRa"],
    ["O", "S", "Satélite"],
    ["L1", "R", "LoRa"],
    ["L1", "L2", "Mesh LoRa"],
    ["L1", "L3", "Mesh LoRa"],
    ["L2", "L3", "Mesh LoRa"],
    ["L3", "R", "LoRa"],
    ["S", "R", "Satélite"],
  ];

  // Tempo médio simulado por trecho, apenas para fins didáticos (segundos)
  const HOP_TIME = { LoRa: 2, "Mesh LoRa": 1, "Satélite": 25 };
  // O satélite é reserva: o peso extra faz o caminho preferir as antenas
  const CHANNEL_WEIGHT = { LoRa: 1, "Mesh LoRa": 1, "Satélite": 1.6 };
  const HOP_DURATION_MS = 1300; // duração da animação de cada trecho

  const ORIGIN = "O";
  const RESCUE = "R";
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* Elementos da página --------------------------------------------------- */
  const svg = document.getElementById("mesh-svg");
  if (!svg) return;

  const btnSend = document.getElementById("btn-send");
  const btnFail = document.getElementById("btn-fail");
  const btnReset = document.getElementById("btn-reset");
  const statusEl = document.getElementById("sim-status");
  const channelEl = document.getElementById("sim-channel");
  const timeEl = document.getElementById("sim-time");
  const routeEl = document.getElementById("sim-route");
  const logEl = document.getElementById("sim-log");

  /* Estado da simulação --------------------------------------------------- */
  const nodeById = new Map(NODES.map((n) => [n.id, n]));
  const nodeEls = new Map(); // id -> <g>
  const edgeEls = new Map(); // "A-B" -> <line>
  const failedEdges = new Set();

  let isRunning = false;
  let runId = 0; // muda a cada reinício para cancelar animações antigas
  let currentPath = []; // caminho planejado atual
  let currentIndex = 0; // posição da mensagem dentro do caminho
  let packet = null;

  /* Utilitários ----------------------------------------------------------- */
  const edgeKey = (a, b) => [a, b].sort().join("-");
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const getEdge = (a, b) => EDGES.find(([x, y]) => edgeKey(x, y) === edgeKey(a, b));
  const labelOf = (id) => nodeById.get(id).label;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* Desenho do SVG -------------------------------------------------------- */
  function createSvg(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function drawNetwork() {
    const edgesGroup = createSvg("g");
    const nodesGroup = createSvg("g");

    EDGES.forEach(([a, b, tech]) => {
      const n1 = nodeById.get(a);
      const n2 = nodeById.get(b);
      const key = edgeKey(a, b);

      const line = createSvg("line", {
        x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y,
        class: "sim-edge",
      });

      // Linha invisível mais grossa para facilitar o clique na conexão
      const hit = createSvg("line", {
        x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y,
        class: "sim-edge-hit",
      });
      const title = createSvg("title");
      title.textContent = `${labelOf(a)} ↔ ${labelOf(b)} (${tech}) — clique para derrubar/restaurar`;
      hit.appendChild(title);
      hit.addEventListener("click", () => toggleEdge(key));

      edgeEls.set(key, line);
      edgesGroup.append(line, hit);
    });

    NODES.forEach((node) => {
      const radius = node.type === "antenna" ? 22 : 26;
      const g = createSvg("g", { class: "sim-node" });
      if (node.type) g.classList.add(`is-${node.type}`);

      const circle = createSvg("circle", { cx: node.x, cy: node.y, r: radius });
      const inner = createSvg("text", {
        x: node.x, y: node.y + 5, class: "sim-node-icon",
      });
      inner.textContent = node.short;

      // Rótulo abaixo do nó (acima para os nós da parte de baixo)
      const below = node.y < 430;
      const label = createSvg("text", {
        x: node.x, y: below ? node.y + radius + 20 : node.y - radius - 10,
      });
      label.textContent = node.label;
      // Nas pontas, alinha o texto para dentro para não ser cortado
      if (node.type === "origin") {
        label.setAttribute("x", node.x - radius);
        label.classList.add("anchor-start");
      }
      if (node.type === "rescue") {
        label.setAttribute("x", node.x + radius);
        label.classList.add("anchor-end");
      }

      g.append(circle, inner, label);
      nodeEls.set(node.id, g);
      nodesGroup.appendChild(g);
    });

    packet = createSvg("circle", { r: 0, class: "sim-packet" });

    svg.append(edgesGroup, nodesGroup, packet);
  }

  /* Algoritmo de Dijkstra ------------------------------------------------- */
  // Retorna o caminho mais curto (lista de ids) ignorando conexões com falha
  function findPath(start, end) {
    const dist = new Map(NODES.map((n) => [n.id, Infinity]));
    const previous = new Map();
    const unvisited = new Set(NODES.map((n) => n.id));
    dist.set(start, 0);

    while (unvisited.size) {
      // Pega o nó não visitado com menor distância acumulada
      let current = null;
      unvisited.forEach((id) => {
        if (current === null || dist.get(id) < dist.get(current)) current = id;
      });

      if (dist.get(current) === Infinity) break; // o resto é inalcançável
      if (current === end) break;
      unvisited.delete(current);

      EDGES.forEach(([a, b]) => {
        if (failedEdges.has(edgeKey(a, b))) return;
        const neighbor = a === current ? b : b === current ? a : null;
        if (!neighbor || !unvisited.has(neighbor)) return;

        const weight = CHANNEL_WEIGHT[getEdge(current, neighbor)[2]];
        const alt = dist.get(current) + distance(nodeById.get(current), nodeById.get(neighbor)) * weight;
        if (alt < dist.get(neighbor)) {
          dist.set(neighbor, alt);
          previous.set(neighbor, current);
        }
      });
    }

    if (dist.get(end) === Infinity) return null;

    const path = [end];
    while (path[0] !== start) path.unshift(previous.get(path[0]));
    return path;
  }

  /* Interface: status, métricas e registro -------------------------------- */
  const STATUS_TEXT = {
    idle: "Aguardando envio",
    sending: "Transmitindo...",
    rerouting: "Recalculando rota...",
    delivered: "Entregue à central",
    blocked: "Sem rota disponível",
  };

  function setStatus(status) {
    statusEl.dataset.status = status;
    statusEl.textContent = STATUS_TEXT[status];
  }

  function log(message, type = "info") {
    const time = new Date().toLocaleTimeString("pt-BR");
    const li = document.createElement("li");
    const timeSpan = document.createElement("span");
    const textSpan = document.createElement("span");

    timeSpan.className = "log-time";
    timeSpan.textContent = `[${time}] `;
    textSpan.className = `log-${type}`;
    textSpan.textContent = message;

    li.append(timeSpan, textSpan);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateMetrics(traveled) {
    let seconds = 0;
    for (let i = 0; i < traveled.length - 1; i++) {
      seconds += HOP_TIME[getEdge(traveled[i], traveled[i + 1])[2]];
    }
    // Canal = como o alerta saiu do dispositivo (LoRa ou satélite)
    channelEl.textContent = traveled.length > 1 ? getEdge(traveled[0], traveled[1])[2] : "—";
    timeEl.textContent = `${seconds} s`;
    routeEl.innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = "Caminho: ";
    routeEl.append(strong, traveled.length ? traveled.map(labelOf).join(" → ") : "—");
  }

  function updateButtons() {
    btnSend.disabled = isRunning;
    btnFail.disabled = !canFail();
  }

  // Só faz sentido derrubar conexões que ainda estão no caminho à frente
  function canFail() {
    if (isRunning) return currentPath.length - currentIndex > 2;
    const plan = findPath(ORIGIN, RESCUE);
    return Boolean(plan && plan.length > 1);
  }

  /* Limpa o desenho do caminho anterior (mantém as falhas) */
  function clearPathVisuals() {
    edgeEls.forEach((line) => line.classList.remove("is-active", "is-done"));
    nodeEls.forEach((g) => g.classList.remove("is-visited", "is-current"));
    packet.setAttribute("r", 0);
  }

  function highlightPlannedRoute(path, fromIndex) {
    edgeEls.forEach((line) => line.classList.remove("is-active"));
    for (let i = fromIndex; i < path.length - 1; i++) {
      edgeEls.get(edgeKey(path[i], path[i + 1])).classList.add("is-active");
    }
  }

  /* Animação do pacote entre dois nós ------------------------------------- */
  function movePacket(fromId, toId, myRun) {
    const from = nodeById.get(fromId);
    const to = nodeById.get(toId);
    const start = performance.now();

    return new Promise((resolve) => {
      function frame(now) {
        if (myRun !== runId) return resolve(false); // simulação reiniciada
        const t = Math.min((now - start) / HOP_DURATION_MS, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        packet.setAttribute("cx", from.x + (to.x - from.x) * eased);
        packet.setAttribute("cy", from.y + (to.y - from.y) * eased);
        if (t < 1) requestAnimationFrame(frame);
        else resolve(true);
      }
      requestAnimationFrame(frame);
    });
  }

  /* Envio da mensagem ----------------------------------------------------- */
  async function sendMessage() {
    if (isRunning) return;

    const myRun = ++runId;
    clearPathVisuals();
    logEl.innerHTML = "";

    const path = findPath(ORIGIN, RESCUE);
    if (!path) {
      setStatus("blocked");
      updateMetrics([]);
      log("Nenhuma antena nem satélite disponível. O alerta fica guardado no dispositivo e será reenviado quando um canal voltar.", "error");
      updateButtons();
      return;
    }

    isRunning = true;
    currentPath = path;
    currentIndex = 0;
    const traveled = [ORIGIN];

    setStatus("sending");
    updateMetrics(traveled);
    log("SOS acionado: \"Pessoa ilhada, precisa de resgate\" + localização GPS.", "info");
    log(`Rota calculada: ${path.map(labelOf).join(" → ")}`, "info");

    nodeEls.get(ORIGIN).classList.add("is-current");
    const origin = nodeById.get(ORIGIN);
    packet.setAttribute("cx", origin.x);
    packet.setAttribute("cy", origin.y);
    packet.setAttribute("r", 8);
    highlightPlannedRoute(currentPath, 0);
    updateButtons();

    // Percorre o caminho salto a salto
    while (currentPath[currentIndex] !== RESCUE) {
      const from = currentPath[currentIndex];
      const to = currentPath[currentIndex + 1];

      // A conexão à frente caiu? Recalcula a partir de onde a mensagem está
      if (failedEdges.has(edgeKey(from, to))) {
        setStatus("rerouting");
        log(`Conexão ${labelOf(from)} ↔ ${labelOf(to)} indisponível. Procurando outra antena ou o satélite...`, "warn");
        await wait(650);
        if (myRun !== runId) return;

        const newPath = findPath(from, RESCUE);
        if (!newPath) {
          setStatus("blocked");
          log(`Sem caminho a partir de ${labelOf(from)}. O alerta fica guardado e aguarda um canal disponível.`, "error");
          finishRun();
          return;
        }

        currentPath = newPath;
        currentIndex = 0;
        highlightPlannedRoute(currentPath, 0);
        log(`Nova rota: ${newPath.map(labelOf).join(" → ")}`, "ok");
        setStatus("sending");
        updateButtons();
        continue;
      }

      const tech = getEdge(from, to)[2];
      log(`${labelOf(from)} → ${labelOf(to)} via ${tech}`, "info");

      const finished = await movePacket(from, to, myRun);
      if (!finished) return;

      // Marca o salto como concluído
      const edge = edgeEls.get(edgeKey(from, to));
      edge.classList.remove("is-active");
      edge.classList.add("is-done");
      nodeEls.get(from).classList.remove("is-current");
      nodeEls.get(from).classList.add("is-visited");
      nodeEls.get(to).classList.add("is-current");

      currentIndex++;
      traveled.push(to);
      updateMetrics(traveled);
      updateButtons();
    }

    setStatus("delivered");
    log(`Alerta entregue à central de resgate via ${getEdge(traveled[0], traveled[1])[2]}. Confirmação enviada ao dispositivo.`, "ok");
    finishRun();
  }

  function finishRun() {
    isRunning = false;
    updateButtons();
  }

  /* Simular falha --------------------------------------------------------- */
  function simulateFailure() {
    if (isRunning) {
      // A mensagem está atravessando (atual -> próximo). Derruba a conexão
      // SEGUINTE, para a rede ter tempo de mostrar o desvio.
      const next = currentPath[currentIndex + 1];
      const afterNext = currentPath[currentIndex + 2];
      if (!afterNext) return;
      failEdge(edgeKey(next, afterNext));
      return;
    }

    // Parada: derruba uma conexão do melhor caminho e envia de novo
    const path = findPath(ORIGIN, RESCUE);
    if (!path) return;
    const index = Math.floor(Math.random() * (path.length - 1));
    failEdge(edgeKey(path[index], path[index + 1]));
    log("Reenviando o alerta para mostrar o caminho alternativo...", "warn");
    setTimeout(sendMessage, 500);
  }

  function failEdge(key) {
    if (failedEdges.has(key)) return;
    failedEdges.add(key);
    const line = edgeEls.get(key);
    line.classList.remove("is-active", "is-done");
    line.classList.add("is-failed");
    const [a, b] = key.split("-");
    log(`Falha simulada: conexão ${labelOf(a)} ↔ ${labelOf(b)} caiu.`, "error");
    updateButtons();
  }

  // Clique direto em uma conexão (derruba ou restaura)
  function toggleEdge(key) {
    if (failedEdges.has(key)) {
      failedEdges.delete(key);
      edgeEls.get(key).classList.remove("is-failed");
      const [a, b] = key.split("-");
      log(`Conexão ${labelOf(a)} ↔ ${labelOf(b)} restaurada.`, "ok");
      updateButtons();
    } else {
      failEdge(key);
    }
  }

  /* Reiniciar ------------------------------------------------------------- */
  function resetSimulation() {
    runId++; // cancela qualquer animação em andamento
    isRunning = false;
    failedEdges.clear();
    edgeEls.forEach((line) => line.classList.remove("is-failed"));
    clearPathVisuals();
    currentPath = [];
    currentIndex = 0;
    logEl.innerHTML = "";
    setStatus("idle");
    updateMetrics([]);
    log("Rede restaurada. Antenas LoRa e satélite disponíveis.", "ok");
    updateButtons();
  }

  /* Inicialização --------------------------------------------------------- */
  drawNetwork();
  btnSend.addEventListener("click", sendMessage);
  btnFail.addEventListener("click", simulateFailure);
  btnReset.addEventListener("click", resetSimulation);
  resetSimulation();
})();
