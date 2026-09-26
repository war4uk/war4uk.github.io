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
  $("#ticketCount").value = y.deal;
  $("#ticketCountOut").textContent = y.deal;
  $("#yearNote").textContent = y.note;
  readRegions();
}

function readRegions() {
  state.regionSet = new Set(
    [...document.querySelectorAll(".region-box:checked")].map((b) => b.value)
  );
}

function keepBounds() {
  const n = Math.max(1, Number($("#ticketCount").value) || 1);
  return { minKeep: 1, maxKeep: n };
}

function ticketsWord(n, form) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (form === "genitive") {
    return n10 === 1 && n100 !== 11 ? "билета" : "билетов";
  }
  if (n10 === 1 && n100 !== 11) return "билет";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "билета";
  return "билетов";
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
  const wanted = Number($("#ticketCount").value);
  const got = r.tickets.length;
  const countNote =
    got === wanted
      ? `набор из ${got} ${ticketsWord(got, "genitive")}`
      : `набор из ${got} ${ticketsWord(got, "genitive")} (запрошено ${wanted}, в вагоны больше не влезает)`;
  $("#availMeta").textContent =
    `${r.availableTickets} достижимых билетов · ${r.cityCount} городов · ${r.routeCount} путей · ${r.elapsed} мс · ${countNote}`;

  const warn = $("#regionWarn");
  if (r.unreachableTickets) {
    warn.hidden = false;
    warn.textContent =
      `${r.unreachableTickets} билетов выбранных регионов недостижимы: нет стыка с Восточным побережьем. ` +
      `Badlands и Haunted Wastes стыкуются через Great Plains; Cascadia — через Badlands или Haunted Wastes; ` +
      `California — через Cascadia (Sacramento—Portland), Haunted Wastes (Nuevos Angeles—Phoenix) или Sierra Madre (Baja—Hermosillo); Sierra Madre — через Open Range.`;
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
    `${players} игрока: в раздаче ${y.deal} ${ticketsWord(y.deal)}, оставить не меньше ${y.keepMin}. Газет в колоде поездов: ${papers}. ${doubles}.`;

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
  $("#ticketCount").addEventListener("input", () => {
    $("#ticketCountOut").textContent = $("#ticketCount").value;
  });
  $("#ticketCount").addEventListener("change", solve);
  $("#regions").addEventListener("change", solve);
  syncYearDefaults();
  solve();
}

main();
