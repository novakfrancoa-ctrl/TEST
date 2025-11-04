<%*
try {
// ═══════════════════════════════════════════════════════════════════════════════
// 🌙 TEMPLATE: SUEÑO (versión simplificada que llama al modal externo)
// ═══════════════════════════════════════════════════════════════════════════════

// === CARGAR CONFIGURACIONES DESDE JSON ===
const distraccionesGeneralesPath = "03 - RECURSOS/CONFIGURACIONES_TEMPLATES/distracciones-generales.json";
const configSuenoPath = "03 - RECURSOS/CONFIGURACIONES_TEMPLATES/config-sueno.json";
const modalSuenoPath = "03 - RECURSOS/TEMPLATES/02 - HABITOS DEL SISTEMA/H - SALUD/DORMIR/modal-dormir.js"; // ⚠️ Ajustar ruta

let DISTRACCIONES_GENERALES, CONFIG_SUENO_JSON;

try {
  const distraccionesFile = app.vault.getAbstractFileByPath(distraccionesGeneralesPath);
  if (!distraccionesFile) {
    throw new Error("No se encontró el archivo JSON de distracciones generales");
  }
  const distraccionesContent = await app.vault.read(distraccionesFile);
  DISTRACCIONES_GENERALES = JSON.parse(distraccionesContent);

  const configSuenoFile = app.vault.getAbstractFileByPath(configSuenoPath);
  if (!configSuenoFile) {
    throw new Error("No se encontró el archivo JSON de configuración de sueño");
  }
  const configSuenoContent = await app.vault.read(configSuenoFile);
  CONFIG_SUENO_JSON = JSON.parse(configSuenoContent);

} catch (error) {
  new Notice("❌ Error cargando configuración: " + error.message);
  throw error;
}

// === EXTRAER DATOS DEL JSON ===
const CONFIG_SUENO = CONFIG_SUENO_JSON.caracteristicas;
const AFIRMACIONES_CONFIG = CONFIG_SUENO_JSON.afirmaciones;
const DISTRACCIONES_ESPECIFICAS = CONFIG_SUENO_JSON.distracciones_especificas;

// === CARGAR CLASE DEL MODAL ===
const modalFile = app.vault.getAbstractFileByPath(modalSuenoPath);
if (!modalFile) {
throw new Error("No se encontró el archivo del modal");
}
const modalCode = await app.vault.read(modalFile);
const ModalSueno = eval(modalCode + "; ModalSueno;");

// === EJECUCIÓN PRINCIPAL ===
new Notice("🌙 Iniciando registro de sueño...");

const modal = new ModalSueno(
  DISTRACCIONES_GENERALES,
  DISTRACCIONES_ESPECIFICAS,
  CONFIG_SUENO,
  AFIRMACIONES_CONFIG,
  tp
);

const datos = await modal.abrir();

if (!datos) {
  new Notice("⚠️ Registro cancelado", 2000);
  tR = "";
  return;
}

// === GENERACIÓN DE YAML ===
let yaml = `calidad_sueno: "${datos.selecciones.calidad}"\n`;
yaml += `tiempo_dormirse: "${datos.selecciones.tiempoDormirse}"\n`;
yaml += `duracion_sueno: ${datos.duracionMinutos}\n\n`;  // ✅ Ahora en minutos

// Afirmaciones
Object.entries(AFIRMACIONES_CONFIG).forEach(([categoria, config]) => {
  Object.values(config.opciones).forEach(opcion => {
    yaml += `${opcion.id}: ${datos.afirmaciones[categoria].has(opcion.id)}\n`;
  });
});

// Distracciones
yaml += `\n`;
const distraccionesGenerales = datos.distracciones.filter(d => d.tipo === 'general');
const distraccionesEspecificas = datos.distracciones.filter(d => d.tipo === 'especifica');

if (distraccionesGenerales.length > 0) {
  yaml += `distracciones_generales:\n`;
  distraccionesGenerales.forEach(dis => {
    yaml += `  - ${dis.nombre}\n`;
  });
  yaml += `cantidad_distracciones_generales: ${distraccionesGenerales.length}\n`;
} else {
  yaml += `distracciones_generales: []\n`;
  yaml += `cantidad_distracciones_generales: 0\n`;
}

if (distraccionesEspecificas.length > 0) {
  yaml += `distracciones_especificas:\n`;
  distraccionesEspecificas.forEach(dis => {
    yaml += `  - ${dis.nombre}\n`;
  });
  yaml += `cantidad_distracciones_especificas: ${distraccionesEspecificas.length}\n`;
} else {
  yaml += `distracciones_especificas: []\n`;
  yaml += `cantidad_distracciones_especificas: 0\n`;
}

yaml += `\ntags:\n  - SUENO\n  - BIENESTAR\n`;

tR += yaml;

const totalAfirmaciones = Array.from(datos.afirmaciones.preDormir).length +
  Array.from(datos.afirmaciones.duranteDormir).length +
  Array.from(datos.afirmaciones.postDormir).length +
  Array.from(datos.afirmaciones.suenos).length;
const totalDistracciones = datos.distracciones.length;

new Notice(`✅ Sueño registrado: ${datos.selecciones.calidad} | ${totalAfirmaciones} afirmaciones | ${totalDistracciones} distracciones | ${datos.duracionMinutos}min`, 4000);

} catch(error) {
  console.error("❌ Error en template de sueño:", error);
  new Notice(`❌ Error: ${error.message}`, 3000);
  tR += `error_sueno: "${error.message}"\n`;
}
%>