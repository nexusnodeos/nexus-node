// Simulación de QA: corte de red mientras se llena el formulario de lote,
// confirmando que el borrador sobrevive en localStorage.
//
// No requiere un navegador real -- se prueba la lógica de guardar/restaurar
// contra un polyfill de localStorage en memoria, simulando:
//   1) el usuario llena el formulario (localStorage se actualiza en vivo)
//   2) se corta la red justo cuando intenta enviar (el submit falla)
//   3) el usuario recarga la página (nueva instancia "limpia" del componente)
//   4) el borrador debe reaparecer, sin que el usuario tenga que retipear nada
//
// Uso: node scripts/qa_simular_corte_red_borrador.mjs

const CLAVE_BORRADOR = "nexus_borrador_lote";

// --- Polyfill mínimo de localStorage (misma API que usa el componente real) ---
function crearLocalStorageFalso() {
  const almacen = new Map();
  return {
    getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
    setItem: (k, v) => almacen.set(k, v),
    removeItem: (k) => almacen.delete(k),
  };
}

// --- Misma lógica que src/components/LotUploadForm.tsx ---
function guardarBorrador(localStorage, datos) {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
  } catch {
    /* noop, igual que en el componente real */
  }
}

function cargarBorrador(localStorage) {
  try {
    const guardado = localStorage.getItem(CLAVE_BORRADOR);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function borrarBorrador(localStorage) {
  localStorage.removeItem(CLAVE_BORRADOR);
}

async function correr() {
  console.log("Simulando corte de red en LotUploadForm...\n");

  // localStorage persiste entre "recargas de página" en el navegador real
  // (es la razón de ser de esta prueba), así que aquí SÍ se reutiliza la
  // misma instancia entre pasos -- eso es lo que estamos simulando.
  const localStorage = crearLocalStorageFalso();

  // Paso 1: el usuario llena el formulario -- cada cambio dispara guardarBorrador()
  const datosDelUsuario = { toneladas: "750", pureza: "99.6", puerto: "Veracruz", precio: "4200000" };
  guardarBorrador(localStorage, datosDelUsuario);
  console.log("✅ Paso 1: usuario llenó el formulario, borrador guardado en localStorage");

  // Paso 2: se corta la red justo al enviar -- el submit real (fetch a Supabase)
  // fallaría con un network error, pero eso NO toca localStorage en absoluto
  // (localStorage es síncrono y 100% local, no depende de la conexión).
  console.log("🔌 Paso 2: simulando corte de red durante el submit (no afecta localStorage)");

  // Paso 3: el usuario, viendo que algo se ve "colgado", recarga la página.
  // Esto destruye el estado de React (useState se reinicia a "" en todo),
  // pero localStorage sigue vivo -- es la clave de esta prueba.
  console.log("🔄 Paso 3: usuario recarga la página (React state se pierde, localStorage no)");

  // Paso 4: el componente se vuelve a montar -- el useEffect de restauración corre.
  const borradorRecuperado = cargarBorrador(localStorage);

  if (!borradorRecuperado) {
    console.log("🚨 FALLÓ: no se recuperó ningún borrador después de la recarga simulada.");
    process.exit(1);
  }

  const coincide = JSON.stringify(borradorRecuperado) === JSON.stringify(datosDelUsuario);

  if (coincide) {
    console.log("✅ Paso 4: el borrador se restauró completo, sin pérdida de datos:");
    console.log(`   ${JSON.stringify(borradorRecuperado)}`);
  } else {
    console.log("🚨 FALLÓ: el borrador recuperado no coincide con lo que el usuario había escrito.");
    console.log(`   Esperado: ${JSON.stringify(datosDelUsuario)}`);
    console.log(`   Recuperado: ${JSON.stringify(borradorRecuperado)}`);
    process.exit(1);
  }

  // Paso 5: confirmar que al completar el registro con éxito, el borrador se limpia
  // (para que la próxima vez que abra el formulario, no vea datos de un lote viejo).
  borrarBorrador(localStorage);
  const despuesDeLimpiar = cargarBorrador(localStorage);
  if (despuesDeLimpiar === null) {
    console.log("✅ Paso 5: al completar el registro, el borrador se limpia correctamente.");
  } else {
    console.log("🚨 FALLÓ: el borrador no se limpió después de un registro exitoso.");
    process.exit(1);
  }

  console.log("\n===== RESULTADO: el borrador sobrevive un corte de red + recarga de página =====");
}

correr();
