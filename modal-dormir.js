// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 MODAL DE SUEÑO - Versión modular
// ═══════════════════════════════════════════════════════════════════════════════

class ModalSueno {
  constructor(distraccionesGenerales, distraccionesEspecificas, configSueno, afirmacionesConfig, tp) {
    this.DISTRACCIONES_GENERALES = distraccionesGenerales;
    this.DISTRACCIONES_ESPECIFICAS = distraccionesEspecificas;
    this.CONFIG_SUENO = configSueno;
    this.AFIRMACIONES_CONFIG = afirmacionesConfig;
    this.tp = tp;
  }

  async seleccionarDistraccionesConIntensidad(todasDistracciones) {
    const distraccionesSeleccionadas = [];
    new Notice("📋 Selección de distracciones");
    let continuarSeleccion = true;
    const yaSeleccionadas = new Set();

    while (continuarSeleccion) {
      const opciones = [];
      const valores = [];

      todasDistracciones.forEach((dis) => {
        if (!yaSeleccionadas.has(dis.id)) {
          opciones.push(`${dis.emoji} ${dis.nombre}`);
          valores.push(dis);
        }
      });

      if (yaSeleccionadas.size > 0) {
        opciones.unshift(`✅ Finalizar (${yaSeleccionadas.size} seleccionadas)`);
        valores.unshift(null);
      } else {
        opciones.push("✅ Finalizar sin agregar distracciones");
        valores.push(null);
      }

      const seleccion = await this.tp.system.suggester(
        opciones,
        valores,
        true,
        "🎯 Seleccionar Distracciones"
      );

      if (!seleccion) {
        continuarSeleccion = false;
        break;
      }

      yaSeleccionadas.add(seleccion.id);
      distraccionesSeleccionadas.push(seleccion);
      new Notice(`➕ ${seleccion.emoji} ${seleccion.nombre}`);
    }

    return distraccionesSeleccionadas;
  }

  async abrir() {
    return new Promise(resolve => {
      const afirmacionesSeleccionadas = {
        preDormir: new Set(),
        duranteDormir: new Set(),
        postDormir: new Set(),
        suenos: new Set()
      };

      let distraccionesAgregadas = [];
      let tiempoSuenoHoras = 0;
      let tiempoTotalManual = 0;

      let selecciones = {
        calidad: "normal",
        tiempoDormirse: "normal"
      };

      // Preparar todas las distracciones
      const todasDistracciones = [];
      Object.entries(this.DISTRACCIONES_GENERALES).forEach(([id, data]) => {
        todasDistracciones.push({ ...data, id, tipo: 'general' });
      });
      Object.entries(this.DISTRACCIONES_ESPECIFICAS).forEach(([id, data]) => {
        todasDistracciones.push({ ...data, id, tipo: 'especifica' });
      });

      // Estilos globales
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: scale(0.9) translateY(-20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes fadeOut { to { opacity: 0; transform: scale(0.95); } }
        .sue-btn-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .sue-cancel:hover { background: rgba(0,0,0,0.6) !important; transform: scale(1.1); }
        .slider-horizontal {
          width: 100%; height: 6px; border-radius: 3px;
          background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
          outline: none; -webkit-appearance: none; cursor: pointer;
        }
        .slider-horizontal::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;
        }
        .slider-horizontal::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: none;
          cursor: pointer;
        }
        .distraccion-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 8px; margin: 3px 0;
          background: rgba(255,255,255,0.2); border-radius: 4px;
          font-size: 11px; border: 1px solid rgba(255,255,255,0.3);
        }
        .distraccion-controles { display: flex; gap: 4px; }
        .distraccion-btn {
          background: rgba(0,0,0,0.3); border: none; color: white;
          width: 20px; height: 20px; border-radius: 3px;
          cursor: pointer; font-size: 10px; padding: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .distraccion-btn:hover { background: rgba(0,0,0,0.5); }
        .slider-controles { display: flex; gap: 4px; justify-content: center; margin-top: 6px; }
        .slider-btn {
          background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
          color: white; padding: 4px 8px; border-radius: 4px;
          cursor: pointer; font-size: 10px; font-weight: 600;
          transition: all 0.2s;
        }
        .slider-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }
        .checkbox-item {
          display: flex; align-items: center; gap: 8px;
          padding: 6px; border-radius: 6px;
          cursor: pointer; transition: background 0.2s;
          margin-bottom: 4px;
          background: rgba(255,255,255,0.05);
        }
        .checkbox-item:hover { background: rgba(255,255,255,0.15); }
        .select-field {
          width: 100%; padding: 8px; border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.15);
          color: white; font-size: 12px; font-weight: 500;
          margin-bottom: 8px; cursor: pointer;
        }
        .select-field option { background: #1f2937; color: white; }
      `;
      document.head.appendChild(style);

      // Overlay
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75); display: flex; justify-content: center; align-items: center;
        z-index: 10000; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
      `;

      // Container principal
      const container = document.createElement('div');
      container.style.cssText = `
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%);
        color: white; padding: 20px; border-radius: 16px;
        width: 98vw; max-width: 1600px; max-height: 90vh;
        overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideIn 0.3s ease;
      `;

      // === HEADER ===
      const header = document.createElement('div');
      header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;`;

      const titulo = document.createElement('h2');
      titulo.innerHTML = '🌙 Sueño';
      titulo.style.cssText = `margin: 0; font-size: 20px; font-weight: 600; text-shadow: 0 2px 10px rgba(0,0,0,0.3);`;
      header.appendChild(titulo);

      const btnCancelar = document.createElement('button');
      btnCancelar.innerHTML = '❌';
      btnCancelar.className = 'sue-cancel';
      btnCancelar.style.cssText = `
        padding: 6px 10px; background: rgba(0,0,0,0.3); color: white; border: none;
        border-radius: 50%; cursor: pointer; font-size: 14px; width: 32px; height: 32px;
        transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
      `;
      btnCancelar.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
          document.body.removeChild(modal);
          document.head.removeChild(style);
          resolve(null);
        }, 200);
      });
      header.appendChild(btnCancelar);
      container.appendChild(header);

      // === GRID SUPERIOR: 2 COLUMNAS (SLIDERS + DISTRACCIONES) ===
      const gridSuperior = document.createElement('div');
      gridSuperior.style.cssText = `display: grid; grid-template-columns: 250px 1fr; gap: 12px; margin-bottom: 12px;`;

      // ==== COLUMNA SUPERIOR 1: SLIDERS ====
      const colSliders = document.createElement('div');
      colSliders.style.cssText = `background: rgba(255,255,255,0.15); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);`;

      const tituloSliders = document.createElement('h3');
      tituloSliders.innerHTML = '⏱️ Duración';
      tituloSliders.style.cssText = `margin: 0 0 10px 0; font-size: 13px; font-weight: 600;`;
      colSliders.appendChild(tituloSliders);

      // Slider 1: Sueño
      const labelSueno = document.createElement('label');
      labelSueno.innerHTML = '🌙 Sueño:';
      labelSueno.style.cssText = `display: block; margin-bottom: 4px; font-size: 11px; font-weight: 500;`;
      colSliders.appendChild(labelSueno);

      const displaySueno = document.createElement('div');
      displaySueno.style.cssText = `text-align: center; font-size: 18px; font-weight: 700; margin: 6px 0;`;
      displaySueno.textContent = '0h';
      colSliders.appendChild(displaySueno);

      const sliderSueno = document.createElement('input');
      sliderSueno.type = 'range';
      sliderSueno.min = '0';
      sliderSueno.max = '12';
      sliderSueno.step = '0.5';
      sliderSueno.value = '0';
      sliderSueno.className = 'slider-horizontal';
      sliderSueno.style.cssText = `width: 100%; margin-bottom: 6px;`;
      sliderSueno.addEventListener('input', (e) => {
        tiempoSuenoHoras = parseFloat(e.target.value);
        actualizarDisplays(true);
      });
      colSliders.appendChild(sliderSueno);

      // Controles Slider Sueño
      const controlesSueno = document.createElement('div');
      controlesSueno.className = 'slider-controles';

      const btnSuenoMenos1 = document.createElement('button');
      btnSuenoMenos1.className = 'slider-btn';
      btnSuenoMenos1.textContent = '-1h';
      btnSuenoMenos1.addEventListener('click', () => {
        tiempoSuenoHoras = Math.max(0, tiempoSuenoHoras - 1);
        actualizarDisplays(true);
      });
      controlesSueno.appendChild(btnSuenoMenos1);

      const btnSuenoMenos05 = document.createElement('button');
      btnSuenoMenos05.className = 'slider-btn';
      btnSuenoMenos05.textContent = '-30m';
      btnSuenoMenos05.addEventListener('click', () => {
        tiempoSuenoHoras = Math.max(0, tiempoSuenoHoras - 0.5);
        actualizarDisplays(true);
      });
      controlesSueno.appendChild(btnSuenoMenos05);

      const btnSuenoMas05 = document.createElement('button');
      btnSuenoMas05.className = 'slider-btn';
      btnSuenoMas05.textContent = '+30m';
      btnSuenoMas05.addEventListener('click', () => {
        tiempoSuenoHoras = Math.min(12, tiempoSuenoHoras + 0.5);
        actualizarDisplays(true);
      });
      controlesSueno.appendChild(btnSuenoMas05);

      const btnSuenoMas1 = document.createElement('button');
      btnSuenoMas1.className = 'slider-btn';
      btnSuenoMas1.textContent = '+1h';
      btnSuenoMas1.addEventListener('click', () => {
        tiempoSuenoHoras = Math.min(12, tiempoSuenoHoras + 1);
        actualizarDisplays(true);
      });
      controlesSueno.appendChild(btnSuenoMas1);

      colSliders.appendChild(controlesSueno);

      // Separador
      const separador = document.createElement('div');
      separador.style.cssText = `border-top: 1px solid rgba(255,255,255,0.3); margin: 12px 0;`;
      colSliders.appendChild(separador);

      // Slider 2: Total
      const labelTotal = document.createElement('label');
      labelTotal.innerHTML = '⏰ Total:';
      labelTotal.style.cssText = `display: block; margin-bottom: 4px; font-size: 11px; font-weight: 500;`;
      colSliders.appendChild(labelTotal);

      const displayTotal = document.createElement('div');
      displayTotal.style.cssText = `text-align: center; font-size: 18px; font-weight: 700; margin: 6px 0;`;
      displayTotal.textContent = '0h';
      colSliders.appendChild(displayTotal);

      const sliderTotal = document.createElement('input');
      sliderTotal.type = 'range';
      sliderTotal.min = '0';
      sliderTotal.max = '12';
      sliderTotal.step = '0.5';
      sliderTotal.value = '0';
      sliderTotal.className = 'slider-horizontal';
      sliderTotal.style.cssText = `width: 100%; margin-bottom: 6px;`;
      sliderTotal.addEventListener('input', (e) => {
        tiempoTotalManual = parseFloat(e.target.value);
        actualizarDisplays(false);
      });
      colSliders.appendChild(sliderTotal);

      // Controles Slider Total
      const controlesTotal = document.createElement('div');
      controlesTotal.className = 'slider-controles';

      const btnTotalMenos1 = document.createElement('button');
      btnTotalMenos1.className = 'slider-btn';
      btnTotalMenos1.textContent = '-1h';
      btnTotalMenos1.addEventListener('click', () => {
        tiempoTotalManual = Math.max(0, tiempoTotalManual - 1);
        actualizarDisplays(false);
      });
      controlesTotal.appendChild(btnTotalMenos1);

      const btnTotalMenos05 = document.createElement('button');
      btnTotalMenos05.className = 'slider-btn';
      btnTotalMenos05.textContent = '-30m';
      btnTotalMenos05.addEventListener('click', () => {
        tiempoTotalManual = Math.max(0, tiempoTotalManual - 0.5);
        actualizarDisplays(false);
      });
      controlesTotal.appendChild(btnTotalMenos05);

      const btnTotalMas05 = document.createElement('button');
      btnTotalMas05.className = 'slider-btn';
      btnTotalMas05.textContent = '+30m';
      btnTotalMas05.addEventListener('click', () => {
        tiempoTotalManual = Math.min(12, tiempoTotalManual + 0.5);
        actualizarDisplays(false);
      });
      controlesTotal.appendChild(btnTotalMas05);

      const btnTotalMas1 = document.createElement('button');
      btnTotalMas1.className = 'slider-btn';
      btnTotalMas1.textContent = '+1h';
      btnTotalMas1.addEventListener('click', () => {
        tiempoTotalManual = Math.min(12, tiempoTotalManual + 1);
        actualizarDisplays(false);
      });
      controlesTotal.appendChild(btnTotalMas1);

      colSliders.appendChild(controlesTotal);
      gridSuperior.appendChild(colSliders);

      // ==== COLUMNA SUPERIOR 2: DISTRACCIONES (3 SUBCOLUMNAS) ====
      const colDistracciones = document.createElement('div');
      colDistracciones.style.cssText = `
        background: rgba(255,255,255,0.15); padding: 12px;
        border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
        display: flex; flex-direction: column;
      `;

      const headerDistr = document.createElement('div');
      headerDistr.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`;

      const tituloDistr = document.createElement('h3');
      tituloDistr.innerHTML = '🎯 Distracciones';
      tituloDistr.style.cssText = `margin: 0; font-size: 13px; font-weight: 600;`;
      headerDistr.appendChild(tituloDistr);

      const btnAgregarDistracciones = document.createElement('button');
      btnAgregarDistracciones.innerHTML = '➕ Agregar';
      btnAgregarDistracciones.className = 'sue-btn-hover';
      btnAgregarDistracciones.style.cssText = `
        padding: 6px 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white; border: none; border-radius: 6px; cursor: pointer;
        font-size: 11px; font-weight: 600; transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      `;
      btnAgregarDistracciones.addEventListener('click', async () => {
        modal.style.display = 'none';
        const nuevas = await this.seleccionarDistraccionesConIntensidad(todasDistracciones);
        nuevas.forEach(d => {
          if (!distraccionesAgregadas.find(da => da.id === d.id)) {
            distraccionesAgregadas.push({ ...d, intensidad: 1 });
          }
        });
        actualizarVisualizacionDistracciones();
        actualizarDisplays(true);
        modal.style.display = 'flex';
      });
      headerDistr.appendChild(btnAgregarDistracciones);
      colDistracciones.appendChild(headerDistr);

      // Grid 3 columnas de intensidad
      const grid3Intensidad = document.createElement('div');
      grid3Intensidad.style.cssText = `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; flex: 1;`;

      const containerBaja = document.createElement('div');
      containerBaja.style.cssText = `background: rgba(16, 185, 129, 0.15); padding: 8px; border-radius: 6px; border: 1px solid #10b981;`;
      const tituloBaja = document.createElement('div');
      tituloBaja.innerHTML = '🟢 Baja<br><span style="font-size:9px; opacity:0.8;">5m-10m</span>';
      tituloBaja.style.cssText = `font-size: 11px; font-weight: 600; margin-bottom: 6px; text-align: center;`;
      containerBaja.appendChild(tituloBaja);
      const listaBaja = document.createElement('div');
      listaBaja.id = 'lista-baja';
      listaBaja.style.cssText = `min-height: 80px;`;
      containerBaja.appendChild(listaBaja);

      const containerMedia = document.createElement('div');
      containerMedia.style.cssText = `background: rgba(245, 158, 11, 0.15); padding: 8px; border-radius: 6px; border: 1px solid #f59e0b;`;
      const tituloMedia = document.createElement('div');
      tituloMedia.innerHTML = '🟡 Media<br><span style="font-size:9px; opacity:0.8;">10m-20m</span>';
      tituloMedia.style.cssText = `font-size: 11px; font-weight: 600; margin-bottom: 6px; text-align: center;`;
      containerMedia.appendChild(tituloMedia);
      const listaMedia = document.createElement('div');
      listaMedia.id = 'lista-media';
      listaMedia.style.cssText = `min-height: 80px;`;
      containerMedia.appendChild(listaMedia);

      const containerAlta = document.createElement('div');
      containerAlta.style.cssText = `background: rgba(239, 68, 68, 0.15); padding: 8px; border-radius: 6px; border: 1px solid #ef4444;`;
      const tituloAlta = document.createElement('div');
      tituloAlta.innerHTML = '🔴 Alta<br><span style="font-size:9px; opacity:0.8;">20m-30m</span>';
      tituloAlta.style.cssText = `font-size: 11px; font-weight: 600; margin-bottom: 6px; text-align: center;`;
      containerAlta.appendChild(tituloAlta);
      const listaAlta = document.createElement('div');
      listaAlta.id = 'lista-alta';
      listaAlta.style.cssText = `min-height: 80px;`;
      containerAlta.appendChild(listaAlta);

      grid3Intensidad.appendChild(containerBaja);
      grid3Intensidad.appendChild(containerMedia);
      grid3Intensidad.appendChild(containerAlta);
      colDistracciones.appendChild(grid3Intensidad);

      function calcularTiempoDistraccion(intensidad) {
        if (intensidad === 1) return 7.5 / 60; // 7.5 min en horas
        if (intensidad === 2) return 15 / 60; // 15 min en horas
        if (intensidad === 3) return 25 / 60; // 25 min en horas
        return 0;
      }

      function calcularTiempoTotalDistracciones() {
        let total = 0;
        distraccionesAgregadas.forEach(d => {
          total += calcularTiempoDistraccion(d.intensidad);
        });
        return total;
      }

      function actualizarVisualizacionDistracciones() {
        listaBaja.innerHTML = '';
        listaMedia.innerHTML = '';
        listaAlta.innerHTML = '';

        const baja = distraccionesAgregadas.filter(d => d.intensidad === 1);
        const media = distraccionesAgregadas.filter(d => d.intensidad === 2);
        const alta = distraccionesAgregadas.filter(d => d.intensidad === 3);

        function crearItem(item) {
          const div = document.createElement('div');
          div.className = 'distraccion-item';

          const nombre = document.createElement('span');
          nombre.textContent = `${item.emoji} ${item.nombre}`;
          nombre.style.cssText = `flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
          div.appendChild(nombre);

          const controles = document.createElement('div');
          controles.className = 'distraccion-controles';

          if (item.intensidad > 1) {
            const btnIzq = document.createElement('button');
            btnIzq.className = 'distraccion-btn';
            btnIzq.innerHTML = '◀';
            btnIzq.addEventListener('click', () => {
              item.intensidad--;
              actualizarVisualizacionDistracciones();
              actualizarDisplays(true);
            });
            controles.appendChild(btnIzq);
          }

          if (item.intensidad < 3) {
            const btnDer = document.createElement('button');
            btnDer.className = 'distraccion-btn';
            btnDer.innerHTML = '▶';
            btnDer.addEventListener('click', () => {
              item.intensidad++;
              actualizarVisualizacionDistracciones();
              actualizarDisplays(true);
            });
            controles.appendChild(btnDer);
          }

          const btnElim = document.createElement('button');
          btnElim.className = 'distraccion-btn';
          btnElim.innerHTML = '×';
          btnElim.style.cssText += 'color: #ef4444;';
          btnElim.addEventListener('click', () => {
            distraccionesAgregadas = distraccionesAgregadas.filter(d => d.id !== item.id);
            actualizarVisualizacionDistracciones();
            actualizarDisplays(true);
          });
          controles.appendChild(btnElim);

          div.appendChild(controles);
          return div;
        }

        baja.forEach(item => listaBaja.appendChild(crearItem(item)));
        media.forEach(item => listaMedia.appendChild(crearItem(item)));
        alta.forEach(item => listaAlta.appendChild(crearItem(item)));

        if (baja.length === 0) {
          const vacio = document.createElement('div');
          vacio.style.cssText = `text-align: center; color: rgba(255,255,255,0.5); font-size: 10px; font-style: italic; margin-top: 10px;`;
          vacio.textContent = 'Vacío';
          listaBaja.appendChild(vacio);
        }
        if (media.length === 0) {
          const vacio = document.createElement('div');
          vacio.style.cssText = `text-align: center; color: rgba(255,255,255,0.5); font-size: 10px; font-style: italic; margin-top: 10px;`;
          vacio.textContent = 'Vacío';
          listaMedia.appendChild(vacio);
        }
        if (alta.length === 0) {
          const vacio = document.createElement('div');
          vacio.style.cssText = `text-align: center; color: rgba(255,255,255,0.5); font-size: 10px; font-style: italic; margin-top: 10px;`;
          vacio.textContent = 'Vacío';
          listaAlta.appendChild(vacio);
        }
      }

      function formatearHoras(horas) {
        const h = Math.floor(horas);
        const m = Math.round((horas - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
      }

      function actualizarDisplays(actualizarTotal = false) {
        const tiempoDistraccionesCalculado = calcularTiempoTotalDistracciones();

        if (actualizarTotal) {
          tiempoTotalManual = tiempoSuenoHoras + tiempoDistraccionesCalculado;
        }

        displaySueno.textContent = formatearHoras(tiempoSuenoHoras);
        displayTotal.textContent = formatearHoras(tiempoTotalManual);

        sliderSueno.value = tiempoSuenoHoras;
        sliderTotal.value = tiempoTotalManual;
      }

      gridSuperior.appendChild(colDistracciones);
      container.appendChild(gridSuperior);

      // === GRID INFERIOR: 2 COLUMNAS (CARACTERÍSTICAS + AFIRMACIONES) ===
      const gridInferior = document.createElement('div');
      gridInferior.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 12px;
        background: rgba(255,255,255,0.1);
        padding: 12px;
        border-radius: 10px;
        margin-bottom: 12px;
      `;

      // === COLUMNA 1: CARACTERÍSTICAS ===
      const colCaracteristicas = document.createElement('div');
      colCaracteristicas.style.cssText = `background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;`;

      const tituloCaracteristicas = document.createElement('h4');
      tituloCaracteristicas.innerHTML = '📊 Características';
      tituloCaracteristicas.style.cssText = `margin: 0 0 10px 0; font-size: 14px; font-weight: 600;`;
      colCaracteristicas.appendChild(tituloCaracteristicas);

      Object.entries(this.CONFIG_SUENO).forEach(([key, config]) => {
        const div = document.createElement('div');
        div.style.cssText = `margin-bottom: 10px;`;

        const label = document.createElement('label');
        label.innerHTML = config.titulo;
        label.style.cssText = `display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;`;
        div.appendChild(label);

        const select = document.createElement('select');
        select.className = 'select-field';
        Object.values(config.opciones).forEach(opcion => {
          const opt = document.createElement('option');
          opt.value = opcion.id;
          opt.textContent = opcion.display;
          select.appendChild(opt);
        });

        select.value = selecciones[key];
        select.addEventListener('change', (e) => {
          selecciones[key] = e.target.value;
        });

        div.appendChild(select);
        colCaracteristicas.appendChild(div);
      });

      gridInferior.appendChild(colCaracteristicas);

      // === COLUMNA 2: AFIRMACIONES (3 subcolumnas) ===
      const colAfirmaciones = document.createElement('div');
      colAfirmaciones.style.cssText = `background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;`;

      const tituloAfirmaciones = document.createElement('h4');
      tituloAfirmaciones.innerHTML = '✅ Afirmaciones';
      tituloAfirmaciones.style.cssText = `margin: 0 0 10px 0; font-size: 14px; font-weight: 600;`;
      colAfirmaciones.appendChild(tituloAfirmaciones);

      const gridAfirmaciones = document.createElement('div');
      gridAfirmaciones.style.cssText = `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;`;

      function crearSeccionAfirmacion(categoria, config) {
        const div = document.createElement('div');
        div.style.cssText = `
          background: rgba(0,0,0,0.1);
          padding: 10px;
          border-radius: 6px;
          max-height: 300px;
          overflow-y: auto;
        `;

        const subtitulo = document.createElement('h5');
        subtitulo.innerHTML = config.titulo;
        subtitulo.style.cssText = `margin: 0 0 8px 0; font-size: 12px; font-weight: 600;`;
        div.appendChild(subtitulo);

        Object.values(config.opciones).forEach(opcion => {
          const item = document.createElement('div');
          item.className = 'checkbox-item';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `afirm_${categoria}_${opcion.id}`;
          checkbox.style.cssText = `width: 14px; height: 14px; cursor: pointer;`;
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              afirmacionesSeleccionadas[categoria].add(opcion.id);
            } else {
              afirmacionesSeleccionadas[categoria].delete(opcion.id);
            }
          });

          const label = document.createElement('label');
          label.htmlFor = `afirm_${categoria}_${opcion.id}`;
          label.textContent = opcion.display;
          label.style.cssText = `cursor: pointer; flex: 1; font-size: 11px;`;

          item.appendChild(checkbox);
          item.appendChild(label);

          item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
              checkbox.checked = !checkbox.checked;
              checkbox.dispatchEvent(new Event('change'));
            }
          });

          div.appendChild(item);
        });

        return div;
      }

      // Columna 1: preDormir + duranteDormir
      const col1Afirmaciones = document.createElement('div');
      col1Afirmaciones.appendChild(crearSeccionAfirmacion('preDormir', this.AFIRMACIONES_CONFIG.preDormir));
      col1Afirmaciones.appendChild(crearSeccionAfirmacion('duranteDormir', this.AFIRMACIONES_CONFIG.duranteDormir));
      gridAfirmaciones.appendChild(col1Afirmaciones);

      // Columna 2: postDormir
      const col2Afirmaciones = document.createElement('div');
      col2Afirmaciones.appendChild(crearSeccionAfirmacion('postDormir', this.AFIRMACIONES_CONFIG.postDormir));
      gridAfirmaciones.appendChild(col2Afirmaciones);

      // Columna 3: suenos
      const col3Afirmaciones = document.createElement('div');
      col3Afirmaciones.appendChild(crearSeccionAfirmacion('suenos', this.AFIRMACIONES_CONFIG.suenos));
      gridAfirmaciones.appendChild(col3Afirmaciones);

      colAfirmaciones.appendChild(gridAfirmaciones);
      gridInferior.appendChild(colAfirmaciones);
      container.appendChild(gridInferior);

      // === BOTÓN CONFIRMAR ===
      const btnConfirmar = document.createElement('button');
      btnConfirmar.innerHTML = '✅ Confirmar y Continuar';
      btnConfirmar.className = 'sue-btn-hover';
      btnConfirmar.style.cssText = `
        width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; border: none; border-radius: 10px; cursor: pointer;
        font-size: 14px; font-weight: 600; transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      `;
      btnConfirmar.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
          document.body.removeChild(modal);
          document.head.removeChild(style);
          resolve({
            selecciones,
            afirmaciones: afirmacionesSeleccionadas,
            distracciones: distraccionesAgregadas,
            duracionMinutos: Math.round(tiempoTotalManual * 60)  // ✅ AQUÍ: convertir a minutos
          });
        }, 200);
      });
      container.appendChild(btnConfirmar);

      modal.appendChild(container);
      document.body.appendChild(modal);

      actualizarVisualizacionDistracciones();
      actualizarDisplays(false);
    });
  }
}

module.exports = ModalSueno;