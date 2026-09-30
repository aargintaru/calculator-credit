document.addEventListener("DOMContentLoaded", () => {
    // Referințe elemente DOM
    const fields = [
        { id: "initial", min: 400000, max: 800000 },
        { id: "monthly", min: 3000, max: 6000 },
        { id: "rate", min: 3, max: 9 },
        { id: "years", min: 5, max: 30 }
    ];

    const elements = {};
    fields.forEach(f => {
        elements[f.id] = {
            range: document.getElementById(`${f.id}Range`),
            input: document.getElementById(`${f.id}Input`)
        };

        // Sincronizare bidirecțională Range <-> Number Input
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

    // Elemente de sumar
    const sumInitial = document.getElementById("sumInitial");
    const sumRate = document.getElementById("sumRate");
    const sumBalance = document.getElementById("sumBalance");

    // Inițializare Chart.js
    const ctx = document.getElementById("creditChart").getContext("2d");
    let creditChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Scenariul nou (Sold rămas)",
                data: [],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                fill: true,
                tension: 0.2,
                borderWidth: 2,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Ani scurgi'
                    },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sold (lei)'
                    },
                    grid: { color: '#f1f5f9' }
                }
            }
        }
    });

    function formatCurrency(val) {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(val);
    }

    function updateSimulation() {
        const initial = parseFloat(elements.initial.input.value) || 0;
        const monthly = parseFloat(elements.monthly.input.value) || 0;
        const rate = parseFloat(elements.rate.input.value) || 0;
        const years = parseInt(elements.years.input.value) || 0;

        const labels = [];
        const dataPoints = [];

        const monthlyRate = rate / 100 / 12;

        for (let t = 0; t <= years; t++) {
            labels.push(`Anul ${t}`);
            let monthsPassed = t * 12;
            
            // Calcul sold rămas în timp cu dobândă compusă și rate scăzute
            let balance;
            if (monthsPassed === 0) {
                balance = initial;
            } else {
                balance = initial * Math.pow(1 + monthlyRate, monthsPassed) - 
                          monthly * ((Math.pow(1 + monthlyRate, monthsPassed) - 1) / monthlyRate);
            }
            dataPoints.push(Math.max(0, Math.round(balance)));
        }

        // Actualizare carduri de sumar
        sumInitial.textContent = formatCurrency(initial);
        sumRate.textContent = rate.toFixed(2) + "%";
        sumBalance.textContent = formatCurrency(dataPoints[dataPoints.length - 1]);

        // Actualizare grafic
        creditChart.data.labels = labels;
        creditChart.data.datasets[0].data = dataPoints;
        creditChart.update();
    }

    // Rulare inițială la încărcare
    updateSimulation();
});
