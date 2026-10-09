const { $, node, setEmpty, request, formatDate } = window.ProdutorApp;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
let records = [];
let chart;

function selectedRecords() {
  const product = $("#marketProduct").value;
  return records.filter((entry) => product && entry.produto === product)
    .sort((a, b) => a.data.localeCompare(b.data));
}

function renderMarket() {
  const rows = $("#marketRows");
  const empty = $("#marketEmpty");
  const selected = selectedRecords();
  rows.replaceChildren();
  if (!selected.length) {
    $("#latestPrice").textContent = "—";
    $("#latestPriceDate").textContent = "Sem registro no período";
    $("#latestDemand").textContent = "—";
    $("#latestUnit").textContent = "Sem informação de demanda";
    $("#marketChartNote").textContent = "Nenhuma série disponível.";
    empty.hidden = false;
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update("none");
    const row = node("tr");
    row.append(node("td", "", "Nenhum registro encontrado."));
    row.firstChild.colSpan = 5;
    rows.append(row);
    return;
  }
  empty.hidden = true;
  const newest = selected[selected.length - 1];
  $("#latestPrice").textContent = currency.format(newest.preco);
  $("#latestPriceDate").textContent = `${newest.produto} · ${formatDate(newest.data)}`;
  $("#latestDemand").textContent = newest.demanda || "Não informada";
  $("#latestUnit").textContent = newest.unidadePreco ? `Unidade: ${newest.unidadePreco}` : "Unidade de preço não informada";
  $("#marketChartNote").textContent = `${selected.length} registro(s) de ${newest.produto} no período.`;
  chart.data.labels = selected.map((entry) => formatDate(entry.data, { day: "2-digit", month: "short" }));
  chart.data.datasets[0].data = selected.map((entry) => entry.preco);
  chart.data.datasets[0].label = `Preço (${newest.unidadePreco || "R$"})`;
  chart.update("none");
  [...selected].reverse().slice(0, 20).forEach((entry) => {
    const row = node("tr");
    row.append(node("td", "", formatDate(entry.data)), node("td", "", entry.produto), node("td", "pe-price", currency.format(entry.preco)), node("td", "", entry.unidadePreco || "—"), node("td", "", entry.demanda || "Não informada"));
    rows.append(row);
  });
}

async function loadMarket() {
  const rows = $("#marketRows");
  rows.replaceChildren();
  try {
    const { data } = await request(`market-data?dias=${$("#marketDays").value}`);
    records = data;
    const products = [...new Set(records.map((entry) => entry.produto))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const select = $("#marketProduct");
    const previous = select.value;
    select.replaceChildren(new Option("Selecione um produto", ""));
    products.forEach((product) => select.add(new Option(product, product)));
    select.value = products.includes(previous) ? previous : products[0] || "";
    if (!records.length) {
      $("#latestPrice").textContent = "—";
      $("#latestPriceDate").textContent = "Sem registro no período";
      $("#latestDemand").textContent = "—";
      $("#latestUnit").textContent = "Sem informação de demanda";
      $("#marketChartNote").textContent = "Sem dados para desenhar o gráfico.";
      $("#marketEmpty").hidden = false;
      const row = node("tr");
      row.append(node("td", "", "Nenhum registro encontrado."));
      row.firstChild.colSpan = 5;
      rows.append(row);
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
      return;
    }
    renderMarket();
  } catch (error) {
    $("#marketChartNote").textContent = error.message || "Não foi possível carregar os dados de mercado.";
    $("#marketEmpty").hidden = false;
    rows.replaceChildren();
    const row = node("tr");
    row.append(node("td", "", error.message || "Não foi possível carregar os registros."));
    row.firstChild.colSpan = 5;
    rows.append(row);
  }
}

function marketChartColors() {
  const dark = document.documentElement.classList.contains("dark-theme");
  return dark
    ? { text: "#a4b09e", grid: "#414e40" }
    : { text: "#687365", grid: "#d4ddca" };
}

const initialChartColors = marketChartColors();
chart = new Chart($("#marketChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "Preço", data: [], borderColor: "#547547", backgroundColor: "#c6d78d55", fill: true, tension: 0.28, pointRadius: 3, pointHoverRadius: 5 }] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    color: initialChartColors.text,
    interaction: { intersect: false, mode: "index" },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => currency.format(context.parsed.y) } } },
    scales: {
      y: { beginAtZero: false, ticks: { color: initialChartColors.text, callback: (value) => currency.format(value) }, grid: { color: initialChartColors.grid } },
      x: { ticks: { color: initialChartColors.text }, grid: { display: false } }
    }
  }
});

new MutationObserver(() => {
  const colors = marketChartColors();
  chart.options.color = colors.text;
  chart.options.scales.x.ticks.color = colors.text;
  chart.options.scales.y.ticks.color = colors.text;
  chart.options.scales.y.grid.color = colors.grid;
  chart.update("none");
}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

$("#marketProduct").addEventListener("change", renderMarket);
$("#marketDays").addEventListener("change", loadMarket);
loadMarket();
