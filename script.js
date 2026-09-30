document.addEventListener("DOMContentLoaded", () => {
  const fields = [
    { id: "initial", min: 400000, max: 800000 },
    { id: "monthly", min: 3000, max: 6000 },
    { id: "rate", min: 3, max: 9 },
    { id: "years", min: 5, max: 30 },
  ];

  const elements = {};
  fields.forEach((f) => {
    elements[f.id] = {
      range: document.getElementById(`${f.id}Range`),
      input: document.getElementById(`${f.id}Input`),
    };

    elements[f.id].range.addEventListener("input", (e) => {
      elements[f.id].input.value = e.target.value;
      updateSimulation();
    });

    elements[f.id].input.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        elements[f.id].range.value = val;
        updateSimulation();
      }
    });
  });

  const sumInitial = document.getElementById("sumInitial");
  const sumRate = document.getElementById("sumRate");
  const sumInflection = document.getElementById("sumInflection");
  const inflectionNote = document.getElementById("inflectionNote");

  const ctx = document.getElementById("creditChart").getContext("2d");
  let creditChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Sold rămas credit (lei)",
          data: [],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        x: {
          title: { display: true, text: "Ani scurgi" },
          grid: { color: "#f1f5f9" },
        },
        y: {
          title: { display: true, text: "Sold (lei)" },
          grid: { color: "#f1f5f9" },
        },
      },
    },
  });

  function formatCurrency(val) {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
      maximumFractionDigits: 0,
    }).format(val);
  }

  function updateSimulation() {
    const initial = parseFloat(elements.initial.input.value) || 0;
    const monthly = parseFloat(elements.monthly.input.value) || 0;
    const rate = parseFloat(elements.rate.input.value) || 0;
    const years = parseInt(elements.years.input.value) || 0;

    const labels = [];
    const dataPoints = [];
    const monthlyRate = rate / 100 / 12;

    let inflectionMonthFound = null;
    let currentBalance = initial;

    // Simulăm lună de lună pentru a depista exact când Principalul devine > Dobânda
    for (let m = 1; m <= years * 12; m++) {
      let interestPayment = currentBalance * monthlyRate;
      let principalPayment = monthly - interestPayment;

      if (principalPayment > interestPayment && inflectionMonthFound === null) {
        inflectionMonthFound = m;
      }

      let nextBalance = currentBalance * (1 + monthlyRate) - monthly;
      currentBalance = Math.max(0, nextBalance);
    }

    // Generăm puncte pentru grafic (din an în an)
    for (let t = 0; t <= years; t++) {
      labels.push(`Anul ${t}`);
      let monthsPassed = t * 12;
      let balance;
      if (monthsPassed === 0) {
        balance = initial;
      } else {
        balance =
          initial * Math.pow(1 + monthlyRate, monthsPassed) -
          monthly *
            ((Math.pow(1 + monthlyRate, monthsPassed) - 1) / monthlyRate);
      }
      dataPoints.push(Math.max(0, Math.round(balance)));
    }

    // Formatare afișare punct de inflexiune
    if (inflectionMonthFound !== null) {
      let infYear = Math.floor(inflectionMonthFound / 12);
      let infMonth = inflectionMonthFound % 12;
      sumInflection.textContent = `Luna ${inflectionMonthFound} (~Anul ${infYear}, luna ${infMonth})`;
      inflectionNote.textContent = `* Punctul de cotitură (Principal > Dobândă) se atinge în Luna ${inflectionMonthFound}.`;
    } else {
      sumInflection.textContent = "Nerelevant / Rata prea mică";
      inflectionNote.textContent =
        "* Rata introdusă nu acoperă dobânda sau este sub pragul de amortizare.";
    }

    sumInitial.textContent = formatCurrency(initial);
    sumRate.textContent = rate.toFixed(2) + "%";

    creditChart.data.labels = labels;
    creditChart.data.datasets[0].data = dataPoints;
    creditChart.update();
  }

  updateSimulation();
});
