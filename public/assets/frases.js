// ===========================================================
// RUMBO — Frases y Versículos del Día (assets/frases.js)
// -----------------------------------------------------------
// Sistema inteligente de selección equilibrada:
// 5 de cada 10 veces (50%) muestra un versículo bíblico ('Versículo del día')
// 5 de cada 10 veces (50%) muestra una frase motivacional ('Frase del día')
// ===========================================================

// --- Versículos Bíblicos de Sabiduría, Esfuerzo y Dedicación (50% probabilidad) ---
const VERSICULOS = [
  '«Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.» — Colosenses 3:23',
  '«Pon en manos del Señor todas tus obras, y tus proyectos se cumplirán.» — Proverbios 16:3',
  '«Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo.» — Josué 1:9',
  '«Todo lo puedo en Cristo que me fortalece.» — Filipenses 4:13',
  '«Los pensamientos del diligente ciertamente tienden a la abundancia; mas todo el que se apresura alocadamente, de cierto va a la pobreza.» — Proverbios 21:5',
  '«No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.» — Gálatas 6:9',
  '«Porque el Señor da la sabiduría, y de su boca viene el conocimiento y la inteligencia.» — Proverbios 2:6',
  '«El que labra su tierra se saciará de pan; mas el que sigue a los vagabundos se llenará de pobreza.» — Proverbios 28:19',
  '«Él da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.» — Isaías 40:29',
  '«Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.» — 2 Timoteo 1:7',
  '«Porque yo sé los pensamientos que tengo acerca de vosotros, dice el Señor, pensamientos de paz, y no de mal, para daros el fin que esperáis.» — Jeremías 29:11',
  '«Encomienda al Señor tu camino, confía en Él, y Él actuará.» — Salmos 37:5',
  '«Todo lo que te viniere a la mano para hacer, hazlo según tus fuerzas.» — Eclesiastés 9:10',
  '«Sabiduría ante todo; adquiere sabiduría; y sobre todas tus posesiones adquiere inteligencia.» — Proverbios 4:7',
  '«Si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche.» — Santiago 1:5',
  '«El alma del perezoso desea, y nada alcanza; mas el alma de los diligentes será prosperada.» — Proverbios 13:4',
  '«Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.» — Mateo 7:7',
  '«Aunque la visión tardará aún por un tiempo, mas se apresura hacia el fin, y no mentirá; aunque tardare, espéralo, porque sin duda vendrá.» — Habacuc 2:3',
  '«¿No sabéis que los que corren en el estadio, todos a la verdad corren, pero uno solo se lleva el premio? Corred de tal manera que lo obtengáis.» — 1 Corintios 9:24',
  '«En lo que requiere diligencia, no perezosos; fervientes en espíritu, sirviendo al Señor.» — Romanos 12:11',
  '«Sea la luz del Señor nuestro Dios sobre nosotros, y la obra de nuestras manos confirma sobre nosotros.» — Salmos 90:17',
  '«El corazón prudente adquiere conocimiento; y el oído de los sabios busca la ciencia.» — Proverbios 18:15',
  '«Bienaventurado el hombre que halla la sabiduría, y que obtiene la inteligencia.» — Proverbios 3:13',
  '«Esforzaos todos vosotros los que esperáis en el Señor, y tome aliento vuestro corazón.» — Salmos 31:24',
  '«Con sabiduría se edificará la casa, y con prudencia se afirmará; y con ciencia se llenarán las cámaras de todo bien preciado y agradable.» — Proverbios 24:3-4',
  '«Mas los que esperan en el Señor tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.» — Isaías 40:31'
];

// --- Frases Motivacionales de Estudio y Disciplina (50% probabilidad) ---
const FRASES_ESTUDIO = [
  '«Cada clase que ves hoy es un paso menos para llegar a la meta que te propusiste.»',
  '«No necesitas sentirte completamente listo, solo necesitas la disciplina de empezar.»',
  '«La constancia vence al talento cuando el talento no es constante.»',
  '«Un poco de avance todos los días vale más que intentar estudiar todo en una sola noche.»',
  '«Tu futuro se construye con lo que decides estudiar y repasar hoy.»',
  '«El esfuerzo de hoy es el resultado que agradecerás cuando veas tu nombre en la lista.»',
  '«Estudiar no es perder el tiempo, es invertir en el futuro que mereces.»',
  '«Cada práctica te acerca un poco más a la versión profesional que quieres ser.»',
  '«No compares tu ritmo con el de nadie más, hoy compites para superar tu versión de ayer.»',
  '«Las metas grandes se conquistan clase por clase, tomo por tomo y ejercicio por ejercicio.»',
  '«La disciplina de hoy es la tranquilidad y la libertad de tu mañana.»',
  '«Confía en el proceso, cada repaso suma, aunque sientas que el avance es silencioso.»',
  '«El cansancio es pasajero, pero el orgullo de haberlo logrado permanece para siempre.»',
  '«El éxito es la suma de pequeños esfuerzos repetidos con determinación día tras día.»',
  '«Equivocarte en una práctica es la mejor oportunidad para acertar en el examen real.»',
  '«Apaga las distracciones por un momento y dale a tu preparación el valor que merece.»',
  '«Ese examen no es invencible, solo requiere que estés constante, preparado y enfocado.»'
];

// --- Arreglo combinado para compatibilidad total con scripts existentes ---
const FRASES = [...VERSICULOS, ...FRASES_ESTUDIO];

const ICON_BIBLE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
const ICON_QUOTE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

/**
 * Validador estricto de citas bíblicas (detecta libro, capítulo y versículo)
 */
function esTextoVersiculo(texto) {
  if (!texto) return false;
  return /—\s*([1-3]\s+)?[A-ZÁÉÍÓÚa-záéíóú]+\s+\d+:\d+/i.test(texto);
}

/**
 * Retorna un objeto con tipo ('versiculo' | 'frase'), kicker y texto.
 * Para compatibilidad, el objeto también tiene toString() que devuelve el texto.
 */
function obtenerFrase() {
  const esVersiculo = Math.random() < 0.50; // Exactamente 5 de cada 10 veces (50%)
  let texto = '';

  if (esVersiculo) {
    const idx = Math.floor(Math.random() * VERSICULOS.length);
    texto = VERSICULOS[idx];
  } else {
    const idx = Math.floor(Math.random() * FRASES_ESTUDIO.length);
    texto = FRASES_ESTUDIO[idx];
  }

  // Verificación estricta: si contiene una cita bíblica, siempre es versículo
  const esRealmenteVersiculo = esTextoVersiculo(texto);

  if (esRealmenteVersiculo) {
    return {
      tipo: 'versiculo',
      kicker: '📖 Versículo del día',
      texto: texto,
      svg: ICON_BIBLE,
      toString: function() { return this.texto; }
    };
  } else {
    return {
      tipo: 'frase',
      kicker: '💬 Frase del día',
      texto: texto,
      svg: ICON_QUOTE,
      toString: function() { return this.texto; }
    };
  }
}

/**
 * Actualiza todas las tarjetas de frase o versículo en la página actual
 */
function actualizarTarjetasFrase() {
  const cards = document.querySelectorAll('.daily-quote-card');
  if (!cards.length) return;
  
  const f = obtenerFrase();
  
  cards.forEach(card => {
    card.classList.remove('is-verse', 'is-quote');
    card.classList.add(f.tipo === 'versiculo' ? 'is-verse' : 'is-quote');

    const badge = card.querySelector('.quote-badge');
    if (badge && f.svg) {
      badge.innerHTML = f.svg;
    }

    const kicker = card.querySelector('.quote-kicker');
    if (kicker) {
      kicker.textContent = f.kicker;
    }

    const text = card.querySelector('.quote-text');
    if (text) {
      text.textContent = f.texto;
    }
  });
}

// Exponer globalmente
window.VERSICULOS = VERSICULOS;
window.FRASES_ESTUDIO = FRASES_ESTUDIO;
window.FRASES = FRASES;
window.obtenerFrase = obtenerFrase;
window.actualizarTarjetasFrase = actualizarTarjetasFrase;

// Ejecutar automáticamente al cargar el DOM o si ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', actualizarTarjetasFrase);
} else {
  actualizarTarjetasFrase();
}
