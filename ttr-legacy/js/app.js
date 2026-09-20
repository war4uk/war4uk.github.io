import { optimizeTickets, remainderBonus } from "./solver.js";
import { renderMap } from "./map.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  data: null,
  regionSet: new Set(["ec"]),
  result: null,
};

function yearMeta() {
  const year = Number($("#year").value);
  return state.data.years.find((y) => y.year === year);
}

function syncYearDefaults() {
  const y = yearMeta();
  $("#trains").value = y.trains;
  $("#trainsOut").textContent = y.trains;
  $("#yearNote").textContent = y.note;
  readRegions();
}

function readRegions() {
  state.regionSet = new Set(
    [...document.querySelectorAll(".region-box:checked")].map((b) => b.value)
  );
}

function keepBounds() {
  const y = yearMeta();
  const mode = document.querySelector("input[name=mode]:checked").value;
  if (mode === "opening") return { minKeep: y.keepMin, maxKeep: y.deal };
  return { minKeep: 1, maxKeep: state.data.tickets.length };
}

function solve() {
  readRegions();
  const trains = Number($("#trains").value);
  const { minKeep, maxKeep } = keepBounds();
  const t0 = performance.now();
  state.result = optimizeTickets({
    data: state.data,
    regionSet: state.regionSet,
    trains,
    minKeep,
    maxKeep,
  });
  state.result.elapsed = Math.round(performance.now() - t0);
  render();
}

function render() {
  const y = yearMeta();
  const players = Number($("#players").value);
  const trains = Number($("#trains").value);
  const r = state.result;
  const bonus = remainderBonus(r.trainsLeft, state.data.trainRemainderBonus);
  $("#statTickets").textContent = `$${r.value}`;
  $("#statTrains").textContent = `${r.cost} / ${trains}`;
  $("#statLeft").textContent = `${r.trainsLeft} (бонус $${bonus})`;
  $("#statCount").textContent = String(r.tickets.length);
  const mode = document.querySelector("input[name=mode]:checked").value;
  const modeNote =
    mode === "opening"
      ? `стартовая рука: лучшие ${yearMeta().deal} из всей колоды, не случайная раздача`
      : "с добором: все билеты колоды, пока хватает вагонов";
  $("#availMeta").textContent =
    `${r.availableTickets} достижимых билетов · ${r.cityCount} городов · ${r.routeCount} путей · ${r.elapsed} мс · ${modeNote}`;

  const warn = $("#regionWarn");
  if (r.unreachableTickets) {
    warn.hidden = false;
    warn.textContent =
      `${r.unreachableTickets} билетов выбранных регионов недостижимы: нет стыка с Восточным побережьем. ` +
      `Badlands и Haunted Wastes стыкуются через Great Plains; Cascadia — через Badlands или Haunted Wastes; ` +
      `California — через Cascadia (Sacramento—Portland); Sierra Madre — через Open Range.`;
  } else {
    warn.hidden = true;
    warn.textContent = "";
  }

  const papers = state.data.rules.newspapers[players];
  const doubles =
    players <= state.data.rules.doubleRoutesLockedIfPlayersAtMost
      ? "из двойных путей доступен только один"
      : "оба пути двойного маршрута в игре";
  $("#playerNote").textContent =
    `${players} игрока: в раздаче ${y.deal} билета, оставить не меньше ${y.keepMin}. Газет в колоде поездов: ${papers}. ${doubles}.`;

  $("#tickets").innerHTML = r.tickets.length
    ? r.tickets
        .map(
          (t) => `<li>
            <span class="badge">${t.id}</span>
            <span>${t.a} → ${t.b} <small style="color:#6b5d4d">кратчайший ${t.sp}</small></span>
            <span class="money">$${t.value}</span>
          </li>`
        )
        .join("")
    : "<li>Нет набора, который помещается в бюджет вагонов.</li>";

  $("#routes").innerHTML = r.routes.length
    ? r.routes
        .map(
          (route) => `<li>
            <span class="badge">${route.length}</span>
            <span>${route.a} — ${route.b}</span>
            <span>${route.region.toUpperCase()}</span>
          </li>`
        )
        .join("")
    : "<li>Маршруты не выбраны.</li>";

  renderMap($("#board"), state.data, state);
}

function fillControls() {
  $("#year").innerHTML = state.data.years
    .map((y) => `<option value="${y.year}">${y.year} · партия ${y.game}</option>`)
    .join("");
  $("#regions").innerHTML = state.data.regions
    .map(
      (r) => `<label class="chk">
        <input class="region-box" type="checkbox" value="${r.id}" ${r.locked ? "checked disabled" : ""}>
        <span>${r.name}</span>
      </label>`
    )
    .join("");
}

async function main() {
  state.data = await fetch("./data.json").then((r) => r.json());
  fillControls();
  $("#year").addEventListener("change", () => {
    syncYearDefaults();
    solve();
  });
  $("#players").addEventListener("change", solve);
  $("#trains").addEventListener("input", () => {
    $("#trainsOut").textContent = $("#trains").value;
  });
  $("#trains").addEventListener("change", solve);
  $("#regions").addEventListener("change", solve);
  document.querySelectorAll("input[name=mode]").forEach((el) => el.addEventListener("change", solve));
  syncYearDefaults();
  solve();
}

main();
