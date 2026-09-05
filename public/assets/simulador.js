// ===========================================================
// RUMBO — simulador.js (v2.0 UI/UX Mejorado)
// Usa datosSimulador (assets/simulador-data.js)
// ===========================================================

function groupByCurso(list) {
  const groups = {};
  const order = [];

  list.forEach(item => {
    if (!groups[item.curso]) {
      groups[item.curso] = [];
      order.push(item.curso);
    }
    groups[item.curso].push(item);
  });

  return { groups, order };
}

function formatNum(n) {
  // Redondeo inteligente a 4 decimales si tiene muchos decimales, sin ceros extra al final
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(4)).toString();
}

// ===========================================================
// RENDER DEL SIMULADOR
// ===========================================================

function renderSimulador(area) {
  const wrap = document.querySelector('#sim-content');
  if (!wrap) return;

  const data = datosSimulador[area];
  if (!data) return;

  const { groups, order } = groupByCurso(data);
  wrap.innerHTML = '';

  order.forEach(curso => {
    const section = document.createElement('div');
    section.className = 'sim-group';

    // TÍTULO DEL CURSO
    const h3 = document.createElement('h3');
    h3.className = 'sim-group-title';
    h3.textContent = curso;
    section.appendChild(h3);

    // CONTENEDOR DE TABLA CON SCROLL RESPONSIVO
    const tableWrap = document.createElement('div');
    tableWrap.className = 'sim-table-wrap';

    const table = document.createElement('table');
    table.className = 'sim-table';

    table.innerHTML = `
      <thead>
        <tr>
          <th>Asignatura</th>
          <th style="text-align:center;">Preguntas</th>
          <th style="text-align:center;">Valor c/u</th>
          <th style="text-align:center;">Aciertos</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    // FILAS
    groups[curso].forEach(item => {
      const tr = document.createElement('tr');

      // 1. Asignatura
      const tdAsig = document.createElement('td');
      tdAsig.innerHTML = `<strong>${item.asignatura}</strong>`;

      // 2. Preguntas
      const tdPreg = document.createElement('td');
      tdPreg.style.textAlign = 'center';
      tdPreg.innerHTML = `<span style="color:var(--text-muted);font-weight:600;">${item.preguntas}</span>`;

      // 3. Valor
      const tdValor = document.createElement('td');
      tdValor.style.textAlign = 'center';
      tdValor.innerHTML = `<span style="font-size:0.85rem;color:var(--text-muted);">${formatNum(item.valor)}</span>`;

      // 4. Aciertos con Stepper Controls (+ / -)
      const tdAciertos = document.createElement('td');
      tdAciertos.style.textAlign = 'center';

      const stepper = document.createElement('div');
      stepper.className = 'stepper-control';

      const btnMinus = document.createElement('button');
      btnMinus.type = 'button';
      btnMinus.className = 'stepper-btn';
      btnMinus.setAttribute('aria-label', `Disminuir aciertos en ${item.asignatura}`);
      btnMinus.textContent = '−';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(item.preguntas);
      input.value = '0';
      input.className = 'sim-input';
      input.setAttribute('aria-label', `Aciertos en ${item.asignatura}`);

      const btnPlus = document.createElement('button');
      btnPlus.type = 'button';
      btnPlus.className = 'stepper-btn';
      btnPlus.setAttribute('aria-label', `Aumentar aciertos en ${item.asignatura}`);
      btnPlus.textContent = '+';

      stepper.appendChild(btnMinus);
      stepper.appendChild(input);
      stepper.appendChild(btnPlus);
      tdAciertos.appendChild(stepper);

      // 5. Subtotal
      const tdSub = document.createElement('td');
      tdSub.className = 'sim-subtotal';
      tdSub.style.textAlign = 'right';
      tdSub.textContent = '0.00';
      tdSub.dataset.valor = item.valor;
      tdSub.dataset.preguntas = item.preguntas;

      // LÓGICA DE ACTUALIZACIÓN
      function update() {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > item.preguntas) val = item.preguntas;

        input.value = val;
        const subtotal = val * item.valor;
        tdSub.textContent = formatNum(subtotal);

        recalcTotal();
      }

      btnMinus.addEventListener('click', () => {
        let current = parseInt(input.value, 10) || 0;
        if (current > 0) {
          input.value = current - 1;
          update();
        }
      });

      btnPlus.addEventListener('click', () => {
        let current = parseInt(input.value, 10) || 0;
        if (current < item.preguntas) {
          input.value = current + 1;
          update();
        }
      });

      input.addEventListener('input', update);
      input.addEventListener('change', update);

      // Armar Fila
      tr.appendChild(tdAsig);
      tr.appendChild(tdPreg);
      tr.appendChild(tdValor);
      tr.appendChild(tdAciertos);
      tr.appendChild(tdSub);

      tbody.appendChild(tr);
    });

    tableWrap.appendChild(table);
    section.appendChild(tableWrap);
    wrap.appendChild(section);
  });

  recalcTotal();
}

// ===========================================================
// RECALCULAR PUNTAJE TOTAL
// ===========================================================

function recalcTotal() {
  const subtotals = document.querySelectorAll('.sim-subtotal');
  let total = 0;

  subtotals.forEach(el => {
    const valor = parseFloat(el.dataset.valor) || 0;
    const fila = el.closest('tr');
    const input = fila ? fila.querySelector('.sim-input') : null;

    if (input) {
      const aciertos = parseInt(input.value, 10) || 0;
      total += aciertos * valor;
    }
  });

  const totalEl = document.querySelector('#sim-total');
  if (totalEl) {
    totalEl.textContent = formatNum(total);
  }
}

// ===========================================================
// REINICIAR SIMULADOR
// ===========================================================

function resetSimulador() {
  const inputs = document.querySelectorAll('.sim-input');
  inputs.forEach(input => {
    input.value = '0';
  });

  const subtotals = document.querySelectorAll('.sim-subtotal');
  subtotals.forEach(sub => {
    sub.textContent = '0.00';
  });

  recalcTotal();
}

// ===========================================================
// INICIAR EVENTOS
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.sim-tab, .sim-area-btn');
  if (tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSimulador(tab.dataset.area);
    });
  });

  // Botón Reiniciar
  const resetBtn = document.querySelector('#btn-reset-sim');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSimulador);
  }

  // Primer área por defecto
  const first = tabs[0];
  if (first) {
    first.classList.add('active');
    renderSimulador(first.dataset.area);
  }
});
