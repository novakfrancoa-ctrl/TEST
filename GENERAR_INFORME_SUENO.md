<%*
try {
  // ═══════════════════════════════════════════════════════════════════════════════
  // 📊 TEMPLATE: GENERADOR DE INFORME DE SUEÑO
  // ═══════════════════════════════════════════════════════════════════════════════

  new Notice("📊 Iniciando generación de informe de sueño...");

  // === 1. ENCONTRAR Y PROCESAR ARCHIVOS DE SUEÑO ===
  const archivosSueno = app.vault.getMarkdownFiles().filter(file => {
    const cache = app.metadataCache.getFileCache(file);
    // Aseguramos que tags no sea undefined y que incluya #SUENO o SUENO
    return cache?.tags?.some(tag => tag.tag === '#SUENO' || tag.tag === 'SUENO');
  });

  if (archivosSueno.length === 0) {
    new Notice("❌ No se encontraron notas de sueño con el tag #SUENO.");
    return;
  }

  const datosSueno = [];
  for (const file of archivosSueno) {
    const cache = app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    // Validar que el frontmatter tiene los datos mínimos
    if (frontmatter && frontmatter.calidad_sueno && frontmatter.duracion_sueno) {
      datosSueno.push({
        fecha: file.basename, // Usamos el nombre del archivo como fecha
        calidad: frontmatter.calidad_sueno,
        duracion: frontmatter.duracion_sueno, // en minutos
        distracciones_generales: frontmatter.distracciones_generales || [],
        distracciones_especificas: frontmatter.distracciones_especificas || []
      });
    }
  }

  // Ordenar los datos por fecha (nombre de archivo)
  datosSueno.sort((a, b) => a.fecha.localeCompare(b.fecha));

  console.log(`Se procesaron ${datosSueno.length} registros de sueño.`);

  // === 2. MAPEAR DATOS PARA LOS GRÁFICOS ===

  // Labels (fechas) para los ejes X
  const labels = datosSueno.map(d => d.fecha);

  // Datos para el gráfico de Calidad
  const calidadMap = { "terrible": 1, "mala": 2, "normal": 3, "buena": 4, "excelente": 5 };
  const calidadData = datosSueno.map(d => calidadMap[d.calidad] || 0);
  const calidadNombres = datosSueno.map(d => d.calidad); // Para tooltips

  // Datos para el gráfico de Duración (en horas)
  const duracionData = datosSueno.map(d => (d.duracion / 60).toFixed(2));

  // Datos para el gráfico de Distracciones
  const conteoDistracciones = {};
  datosSueno.forEach(d => {
    const todas = [...d.distracciones_generales, ...d.distracciones_especificas];
    todas.forEach(distraccion => {
      conteoDistracciones[distraccion] = (conteoDistracciones[distraccion] || 0) + 1;
    });
  });

  // Ordenar distracciones por frecuencia y tomar el top 10
  const distraccionesOrdenadas = Object.entries(conteoDistracciones)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10);

  const distraccionesLabels = distraccionesOrdenadas.map(([nombre]) => nombre);
  const distraccionesData = distraccionesOrdenadas.map(([,conteo]) => conteo);


  // === 3. GENERAR EL CONTENIDO HTML ===
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Sueño</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #1a1a1a;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: auto;
        }
        h1 {
            text-align: center;
            color: #ffffff;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
        }
        .chart-container {
            background-color: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        h2 {
            font-size: 1.2em;
            margin-top: 0;
            color: #fafafa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 Informe de Análisis de Sueño</h1>
        <div class="grid">
            <div class="chart-container">
                <h2>📈 Evolución de la Calidad del Sueño</h2>
                <canvas id="calidadChart"></canvas>
            </div>
            <div class="chart-container">
                <h2>📊 Duración del Sueño (horas)</h2>
                <canvas id="duracionChart"></canvas>
            </div>
            <div class="chart-container">
                <h2>🎯 Distracciones Más Frecuentes (Top 10)</h2>
                <canvas id="distraccionesChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        const labels = ${JSON.stringify(labels)};
        const calidadNombres = ${JSON.stringify(calidadNombres)};

        // --- Gráfico de Calidad ---
        new Chart(document.getElementById('calidadChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Calidad del Sueño',
                    data: ${JSON.stringify(calidadData)},
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#ccc',
                            callback: function(value, index, values) {
                                const map = {1: 'Terrible', 2: 'Mala', 3: 'Normal', 4: 'Buena', 5: 'Excelente'};
                                return map[value];
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += calidadNombres[context.dataIndex];
                                return label;
                            }
                        }
                    },
                    legend: { labels: { color: '#ccc' } }
                }
            }
        });

        // --- Gráfico de Duración ---
        new Chart(document.getElementById('duracionChart'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Horas Dormidas',
                    data: ${JSON.stringify(duracionData)},
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                },
                plugins: { legend: { labels: { color: '#ccc' } } }
            }
        });

        // --- Gráfico de Distracciones ---
        new Chart(document.getElementById('distraccionesChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(distraccionesLabels)},
                datasets: [{
                    label: 'Frecuencia',
                    data: ${JSON.stringify(distraccionesData)},
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)'
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top', labels: { color: '#ccc' } } }
            }
        });
    </script>
</body>
</html>
  `;

  // === 4. ESCRIBIR EL ARCHIVO HTML ===
  const filePath = 'informe-sueno.html';
  await app.vault.adapter.write(filePath, htmlContent);

  new Notice(`✅ Informe de sueño guardado en ${filePath}`, 5000);

} catch(error) {
  console.error("❌ Error generando el informe de sueño:", error);
  new Notice(`❌ Error: ${error.message}`, 5000);
}
%>
