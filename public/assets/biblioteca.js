const supabaseUrl = 'https://ymkasxcjbzusvctsbkkq.supabase.co';
const supabaseKey = 'sb_publishable_C4W1GPPKO3pUJ6l_lwpeCg_bKmdFLTl';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let RECURSOS_BIBLIOTECA = [
  {
    id: "tomo-ceprequintos",
    categoria: "tomos",
    categoriaLabel: "Tomos y Teoría",
    titulo: "Tomos y Prácticas CEPREQUINTOS 2027",
    descripcion: "Material oficial de estudio, tomos teóricos y bancos de CEPREQUINTOS.",
    carpeta: "https://drive.google.com/drive/folders/1RfSFh4w496DoJ3-TShLXjgTLOALnJKDr",
    destacado: true
  },
  {
    id: "tomo-cepreunsa",
    categoria: "tomos",
    categoriaLabel: "Tomos y Teoría",
    titulo: "Tomos CEPREUNSA",
    descripcion: "Compendios teóricos y material de estudio organizado por áreas de CEPREUNSA.",
    carpeta: "https://drive.google.com/drive/folders/1nzuWdHTmM6SC6cwxQcvs9JNQ4N0rEiHF",
    destacado: false
  },
  {
    id: "examenes-pasados",
    categoria: "tomos",
    categoriaLabel: "Exámenes",
    titulo: "Exámenes de Admisión Pasados",
    descripcion: "Recopilación de exámenes de procesos anteriores para entrenar velocidad y destreza.",
    carpeta: "https://drive.google.com/drive/folders/1SvOPvIwppyUTJ-16ImBpfnh6wDWaKNVZ",
    destacado: true
  },
  {
    id: "resumenes-clave",
    categoria: "tomos",
    categoriaLabel: "Resúmenes",
    titulo: "Material y Resúmenes Clave",
    descripcion: "Formularios, fichas teóricas y resúmenes de apoyo para repaso intensivo.",
    carpeta: "https://drive.google.com/drive/folders/1fNBpQ7M-QKWELu6S2aSsW340ULCZnM4z",
    destacado: false
  },
  {
    id: "practicas-esparta",
    categoria: "practicas",
    categoriaLabel: "Prácticas",
    titulo: "Prácticas Academia Esparta",
    descripcion: "Ejercicios resueltos, bancos y prácticas semanales de la Academia Esparta.",
    carpeta: "https://drive.google.com/drive/folders/1Y8WeDnr-OwWse3RXxoMCqdHAOY7897_w",
    destacado: false
  },
  {
    id: "practicas-briceno",
    categoria: "practicas",
    categoriaLabel: "Prácticas",
    titulo: "Academia Briceño — Prácticas",
    descripcion: "Material de prácticas, problemas tipo examen y guías de la Academia Briceño.",
    carpeta: "https://drive.google.com/drive/folders/1K8WKW14uvGDSNOF5ctlVlBrCFKktlsYK",
    destacado: false
  },
  {
    id: "practicas-cepreunsa",
    categoria: "practicas",
    categoriaLabel: "Prácticas",
    titulo: "Prácticas CEPREUNSA",
    descripcion: "Bancos de ejercicios y prácticas organizadas para reforzar la preparación.",
    carpeta: "https://drive.google.com/drive/folders/1dLvDGUtO4xJFOw30zyaH24vWiJtjlJZ3",
    destacado: false
  }
];

const RECURSOS_ORIGINALES = [...RECURSOS_BIBLIOTECA];
let categoriaActual = "todos";
let busquedaActual = "";

function obtenerDriveId(url) {
  if (!url) return null;
  const coincidencia = url.match(/[-\w]{25,}/);
  return coincidencia ? coincidencia[0] : null;
}

// Función para normalizar texto: insensible a tildes, diacríticos, mayúsculas y caracteres especiales
function normalizarTexto(texto) {
  if (!texto) return "";
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes y acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")   // Sustituir signos y puntuación por espacios
    .replace(/\s+/g, " ")           // Reducir espacios múltiples
    .trim();
}

function renderizarBiblioteca() {
  const contenedor = document.getElementById("biblioteca-grid");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const filtrados = RECURSOS_BIBLIOTECA.filter(item => {
    const coincideCategoria = (categoriaActual === "todos") || (item.categoria === categoriaActual);
    const busqNorm = normalizarTexto(busquedaActual);
    const busqTokens = busqNorm.split(" ").filter(t => t.length > 0);
    
    // Unimos título, descripción, autor y etiqueta de categoría en una cadena normalizada
    const textoCompleto = normalizarTexto(`${item.titulo || ""} ${item.descripcion || ""} ${item.autor || ""} ${item.categoriaLabel || ""}`);
    
    const coincideBusqueda = busqNorm === "" || busqTokens.every(token => textoCompleto.includes(token));
    
    return coincideCategoria && coincideBusqueda;
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 8px;">No hay recursos disponibles o no coinciden con tu búsqueda.</p>
        <button type="button" onclick="resetearFiltros()" style="color: var(--blue); font-weight: 700; font-size: 0.9rem; cursor: pointer;">Restablecer filtros</button>
      </div>
    `;
    return;
  }

  
  if (categoriaActual === 'comunidad' && filtrados.length > 0) {
    const banner = document.createElement("div");
    banner.style.cssText = "grid-column: 1/-1; background:#fff1f2; border:1px solid #fecdd3; padding:15px 20px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center; gap:15px; color:#9f1239;";
    banner.innerHTML = `<span style="font-size:1.5rem;">🚨</span> <p style="margin:0; font-size:0.95rem; font-weight:500;">Si encuentras <b>material indebido, enlaces caídos</b> o tienes alguna queja sobre un aporte, puedes notificarlo usando el botón <b>"🚩 Reportar"</b> que está junto a cada archivo.</p>`;
    contenedor.appendChild(banner);
  }

  filtrados.forEach(item => {
    const driveId = obtenerDriveId(item.carpeta);
    const url = item.carpeta || "";
    const isDirectPdf = url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes("/pdf/") || url.toLowerCase().includes(".pdf?");
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

    const tarjeta = document.createElement("article");
    tarjeta.className = "drive-card";

    const badgeColor = item.categoria === "tomos" ? "var(--purple-light)" : "var(--emerald-light)";
    const textColor = item.categoria === "tomos" ? "var(--purple)" : "var(--emerald-dark)";

    let embedContent = "";
    if (isDirectPdf) {
      embedContent = `<object data="${url}" type="application/pdf" width="100%" height="100%">
        <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true" style="width:100%; height:100%; border:none;" loading="lazy"></iframe>
      </object>`;
    } else if (isImage) {
      embedContent = `<div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:#f8fafc; overflow:hidden;">
        <img src="${url}" alt="${item.titulo}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; margin:auto; border-radius:6px; cursor:pointer;" onclick="openImgZoomModal('${url}', '${item.titulo}')" loading="lazy" />
        <button type="button" onclick="openImgZoomModal('${url}', '${item.titulo}')" style="position:absolute; bottom:10px; right:10px; background:rgba(11, 18, 41, 0.75); color:white; padding:6px 12px; border-radius:20px; font-size:0.75rem; font-weight:700; backdrop-filter:blur(8px); display:flex; align-items:center; gap:4px;">
          🔍 Zoom / Ampliar
        </button>
      </div>`;
    } else if (driveId) {
      embedContent = `<iframe src="https://drive.google.com/embeddedfolderview?id=${driveId}#list" loading="lazy" allowfullscreen title="Vista previa de ${item.titulo}" style="flex-grow:1; border:none; width:100%; height:100%;"></iframe>`;
    } else if (url) {
      embedContent = `<iframe src="${url}" loading="lazy" allowfullscreen title="Vista previa de ${item.titulo}" style="flex-grow:1; border:none; width:100%; height:100%;"></iframe>`;
    } else {
      embedContent = `<div style="display:flex;align-items:center;justify-content:center;flex-grow:1;color:var(--text-muted);font-size:0.9rem;">(Sin vista previa disponible)</div>`;
    }

    tarjeta.innerHTML = `
      <div class="drive-card-head" style="margin-bottom: 8px;">
        <div class="drive-card-info">
          <span style="display:inline-block; font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; background:${badgeColor}; color:${textColor}; padding:3px 8px; border-radius:var(--radius-full); margin-bottom:6px;">
            ${item.categoriaLabel}
          </span>
          <h2>${item.titulo}</h2>
          <p>${(item.descripcion || "").split('🚩 REPORTE:')[0].trim()}</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0;">
            <button onclick="reportarAporte('${item.id}')" class="btn-drive-open" style="background:transparent; color:#ef4444; border:1px solid #ef4444; box-shadow:none; padding:4px 8px; font-size:0.75rem;"><span style="color:#ef4444;">🚩 Reportar</span></button>
            <a href="${item.carpeta}" target="_blank" rel="noopener noreferrer" class="btn-drive-open" title="Abrir recurso">
              <span>Abrir</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
        </div>
      </div>

      <div style="border-top: 1px dashed #e2e8f0; pt-2; margin-top: 8px; padding-top: 8px;">
        <button type="button" onclick="toggleVistaPreviaAccordeon('${item.id}')" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center;">
          <span id="icon-preview-${item.id}">👁️</span> <span id="text-preview-${item.id}">Ver vista previa</span>
        </button>

        <div id="preview-container-${item.id}" style="display: none; height: 340px; margin-top: 10px; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff;">
          ${embedContent}
        </div>
      </div>
    `;

    contenedor.appendChild(tarjeta);
  });
}

window.toggleVistaPreviaAccordeon = function(id) {
  const container = document.getElementById(`preview-container-${id}`);
  const icon = document.getElementById(`icon-preview-${id}`);
  const text = document.getElementById(`text-preview-${id}`);
  if (!container) return;

  if (container.style.display === "none" || !container.style.display) {
    container.style.display = "block";
    if (icon) icon.textContent = "🙈";
    if (text) text.textContent = "Ocultar vista previa";
  } else {
    container.style.display = "none";
    if (icon) icon.textContent = "👁️";
    if (text) text.textContent = "Ver vista previa";
  }
};

window.ejecutarBusquedaRapida = function(termino) {
  const input = document.getElementById("biblioteca-search");
  if (input) {
    input.value = termino;
    busquedaActual = normalizarTexto(termino);
    
    // Cambiar a pestaña 'todos' para garantizar que se encuentren recursos de cualquier categoría (incluyendo Comunidad)
    categoriaActual = "todos";
    const tabs = document.querySelectorAll(".biblioteca-tab");
    tabs.forEach((t) => {
      if (t.getAttribute("data-cat") === "todos") t.classList.add("active");
      else t.classList.remove("active");
    });

    renderizarBiblioteca();
  }
};

function inicializarFiltrosBiblioteca() {
  const tabs = document.querySelectorAll(".biblioteca-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      categoriaActual = tab.getAttribute("data-cat") || "todos";

      // Al cambiar manualmente de pestaña, resetear la búsqueda para que muestre todos los aportes de esa pestaña
      busquedaActual = "";
      const searchInput = document.getElementById("biblioteca-search");
      if (searchInput) searchInput.value = "";

      renderizarBiblioteca();
    });
  });

  const searchInput = document.getElementById("biblioteca-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      busquedaActual = normalizarTexto(e.target.value);
      renderizarBiblioteca();
    });
  }
}

function resetearFiltros() {
  categoriaActual = "todos";
  busquedaActual = "";
  const searchInput = document.getElementById("biblioteca-search");
  if (searchInput) searchInput.value = "";
  const tabs = document.querySelectorAll(".biblioteca-tab");
  tabs.forEach((t, i) => {
    if (i === 0) t.classList.add("active");
    else t.classList.remove("active");
  });
  renderizarBiblioteca();
}

async function cargarRecursos() {
  const contenedor = document.getElementById("biblioteca-grid");
  if (contenedor) {
    contenedor.innerHTML = '<p style="text-align:center; padding: 40px; color: #888;">Cargando recursos desde Supabase... ⏳</p>';
  }

  const { data, error } = await supabaseClient
    .from('recursos')
    .select('*')
    .in('estado', ['aprobado', 'reportado']); // TRAE APROBADOS Y REPORTADOS (No se bloquean solos)

  if (error) {
    console.error('Error cargando Supabase:', error);
    if (contenedor) {
      contenedor.innerHTML = '<p style="text-align:center; padding: 40px; color: red;">Error al cargar los recursos.</p>';
    }
    return;
  }

  const aportesComunidad = data.map(r => ({
    id: r.id,
    categoria: 'comunidad', // Lo forzamos para que salga en la nueva pestaña
    categoriaLabel: 'Comunidad',
    titulo: r.titulo,
    descripcion: r.descripcion,
    carpeta: r.url,
    autor: r.autor || r.nombre_usuario || ''
  }));

  // Combinamos los manuales antiguos con los nuevos de la comunidad
  RECURSOS_BIBLIOTECA = [...RECURSOS_ORIGINALES, ...aportesComunidad];

  renderizarBiblioteca();
}

// Iniciar
inicializarFiltrosBiblioteca();
cargarRecursos();


window.reportarAporte = async function(id) {
    if (typeof window.openReportModal !== 'function') return; // fallback
    const m = await window.openReportModal();
    if (m && m.trim() !== "[] ") {
        // Verificar si es un recurso estático original
        const isStatic = RECURSOS_ORIGINALES.some(r => r.id === id);
        if (isStatic) {
            if (typeof window.showSuccessReportModal === 'function') {
                window.showSuccessReportModal();
            } else {
                alert("Reporte enviado correctamente.");
            }
            return;
        }

        try {
            const { data, error: selectError } = await supabaseClient.from('recursos').select('descripcion').eq('id', id).single();
            if (selectError) {
                console.error("Error al obtener recurso:", selectError);
                alert("Error al obtener los datos del recurso.");
                return;
            }
            
            let desc = data.descripcion || "";
            const nueva = desc + '\n\n🚩 REPORTE: ' + m;
            
            const { error: updateError } = await supabaseClient.from('recursos').update({ estado: 'reportado', descripcion: nueva }).eq('id', id);
            
            if (updateError) {
                console.error("Error al actualizar (posible problema de permisos RLS):", updateError);
                alert("Error al enviar el reporte. Revisa la consola o los permisos (RLS) en Supabase.");
                return;
            }
            
            // Reutilizar el modal de exito del index si existe, o usar un alert bonito
            if(typeof window.showSuccessReportModal === "function") {
                window.showSuccessReportModal();
            } else {
                alert("Reporte enviado exitosamente.");
            }
            cargarRecursos();
        } catch(e) {
            console.error("Excepción inesperada:", e);
            alert("Error al enviar el reporte.");
        }
    }
};

// ==========================================
// LÓGICA DE PESTAÑAS (TABS)
// ==========================================
function inicializarTabsPrincipales() {
  const mainTabs = document.querySelectorAll(".main-tab");
  mainTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      mainTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const targetId = tab.getAttribute("data-target");
      document.querySelectorAll(".main-section-content").forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
      });
      const target = document.getElementById(targetId);
      if(target) {
        target.style.display = "block";
        target.classList.add("active");
      }
    });
  });

  const alianzasTabs = document.querySelectorAll(".alianzas-tab");
  alianzasTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      alianzasTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const targetId = tab.getAttribute("data-target");
      document.querySelectorAll(".alianzas-content-pane").forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
      });
      const target = document.getElementById(targetId);
      if(target) {
        target.style.display = "block";
        target.classList.add("active");
      }
    });
  });
}

// ==========================================
// LÓGICA DEL FORMULARIO DE ALIANZAS
// ==========================================
function inicializarFormularioAlianzas() {
  const btnAddRed = document.getElementById("btn-add-red");
  const containerRedes = document.getElementById("alianza-redes-container");
  
  if (btnAddRed && containerRedes) {
    btnAddRed.addEventListener("click", () => {
      const row = document.createElement("div");
      row.className = "red-row";
      row.style.cssText = "display: flex; gap: 10px; margin-bottom: 15px; align-items: center; flex-wrap: wrap;";
      row.innerHTML = `
        <select class="form-aportes-input red-tipo" style="width: auto; flex: 1; min-width: 120px;">
          <option value="whatsapp">WhatsApp</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="otro">Otro</option>
        </select>
        <input type="text" class="form-aportes-input red-nombre" placeholder="Nombre (Ej. Grupo 1)" style="flex: 2; min-width: 150px;">
        <input type="url" class="form-aportes-input red-link" placeholder="Enlace (https://...)" style="flex: 3; min-width: 200px;">
        <button type="button" class="btn-remove-red" style="background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer;" title="Eliminar fila">&times;</button>
      `;
      containerRedes.appendChild(row);
      
      row.querySelector(".btn-remove-red").addEventListener("click", () => {
        row.remove();
      });
    });

    const primerBtnRemove = containerRedes.querySelector(".btn-remove-red");
    if (primerBtnRemove) {
      primerBtnRemove.addEventListener("click", (e) => {
        if(containerRedes.querySelectorAll(".red-row").length > 1) {
          e.target.closest(".red-row").remove();
        } else {
          alert("Debes añadir al menos una red o grupo.");
        }
      });
    }
  }

  const dropArea = document.getElementById("alianza-qr-drop");
  const fileInput = document.getElementById("alianza-qr-file");
  const preview = document.getElementById("alianza-qr-preview");

  if(dropArea && fileInput && preview) {
    dropArea.addEventListener("click", () => fileInput.click());
    
    fileInput.addEventListener("change", (e) => {
      if(fileInput.files.length > 0) {
        preview.textContent = "✅ Imagen seleccionada: " + fileInput.files[0].name;
        dropArea.style.borderColor = "#10b981";
      } else {
        preview.textContent = "";
        dropArea.style.borderColor = "#cbd5e1";
      }
    });

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = '#3b82f6';
      dropArea.style.backgroundColor = '#eff6ff';
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = '#cbd5e1';
      dropArea.style.backgroundColor = 'transparent';
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = '#10b981';
      dropArea.style.backgroundColor = 'transparent';
      
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        preview.textContent = "✅ Imagen seleccionada: " + fileInput.files[0].name;
      }
    });
  }

  const form = document.getElementById("form-alianza");
  if(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById("btn-alianza-submit");
      btnSubmit.innerText = "⏳ Enviando Solicitud...";
      btnSubmit.disabled = true;

      try {
        const nombre = document.getElementById("alianza-nombre").value.trim();
        const descripcion = document.getElementById("alianza-desc").value.trim();
        const contacto = document.getElementById("alianza-contacto").value.trim();
        
        const redesElements = document.querySelectorAll(".red-row");
        const redesArray = [];
        let hasEmptyLinks = false;
        
        redesElements.forEach(row => {
          const tipo = row.querySelector(".red-tipo").value;
          const nom = row.querySelector(".red-nombre").value.trim();
          const link = row.querySelector(".red-link").value.trim();
          if (link === "") hasEmptyLinks = true;
          else redesArray.push({ tipo, nombre: nom, link });
        });

        if (hasEmptyLinks && !fileInput.files.length) {
          alert("Asegúrate de llenar el enlace o de subir la foto del QR.");
          btnSubmit.innerText = "Enviar Solicitud de Alianza";
          btnSubmit.disabled = false;
          return;
        }

        let qrUrl = null;
        if (fileInput && fileInput.files.length > 0) {
           const file = fileInput.files[0];
           const nombreArchivo = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
           const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('pdf')
            .upload(`qrs/${nombreArchivo}`, file);
            
           if(uploadError) throw uploadError;
           
           const { data: publicUrlData } = supabaseClient
             .storage
             .from('pdf')
             .getPublicUrl(`qrs/${nombreArchivo}`);
             
           qrUrl = publicUrlData.publicUrl;
        }

        const { error: insertError } = await supabaseClient
          .from('alianzas')
          .insert([{
            nombre_aliado: nombre,
            descripcion: descripcion,
            contacto: contacto,
            redes: redesArray,
            imagen_qr: qrUrl
          }]);

        if (insertError) throw insertError;

        form.reset();
        preview.textContent = "";
        dropArea.style.borderColor = "#cbd5e1";
        
        while(containerRedes.children.length > 1) {
          containerRedes.removeChild(containerRedes.lastChild);
        }

        if(typeof window.showSuccessReportModal === "function") {
          document.querySelector("#success-report-modal h3").innerText = "¡Solicitud Enviada!";
          document.querySelector("#success-report-modal p").innerText = "Revisaremos tu canal y pronto aparecerá en nuestro Directorio de Aliados.";
          window.showSuccessReportModal();

          // Al cerrar el modal, volver al inicio de la página
          const originalClose = window.closeSuccessReportModal;
          window.closeSuccessReportModal = function() {
            originalClose();
            setTimeout(() => {
              const tabInicio = document.querySelector('.main-tab[data-target="tab-documentos"]');
              if (tabInicio) tabInicio.click();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.closeSuccessReportModal = originalClose;
            }, 350);
          };
        } else {
          alert("¡Solicitud enviada exitosamente!");
          const tabInicio = document.querySelector('.main-tab[data-target="tab-documentos"]');
          if (tabInicio) tabInicio.click();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

      } catch (error) {
        console.error("Error al enviar alianza:", error);
        alert("Ocurrió un error al enviar la solicitud.");
      } finally {
        btnSubmit.innerText = "Enviar Solicitud de Alianza";
        btnSubmit.disabled = false;
      }
    });
  }
}

// ==========================================
// CARGAR ALIADOS APROBADOS
// ==========================================
async function cargarAliados() {
    const container = document.getElementById("alianzas-grid");
    if(!container) return;

  try {
    const { data, error } = await supabaseClient
      .from('alianzas')
      .select('*')
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: #64748b; width: 100%; padding: 40px;">Todavía no hay aliados. ¡Sé el primero en unirte!</p>`;
      return;
    }

    container.innerHTML = "";

    data.forEach(aliado => {
      let redesHtml = "";
      if(aliado.redes && Array.isArray(aliado.redes)) {
        aliado.redes.forEach(red => {
          let svgIcon = "";
          let bgStyle = "background: rgba(99, 102, 241, 0.1); color: #4f46e5; border: 1px solid rgba(99, 102, 241, 0.25);";
          const tipo = (red.tipo || '').toLowerCase();
          
          if(tipo === 'whatsapp') { 
            bgStyle = "background: #25D366; color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`; 
          }
          else if(tipo === 'youtube') { 
            bgStyle = "background: #FF0000; color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`; 
          }
          else if(tipo === 'instagram') { 
            bgStyle = "background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`; 
          }
          else if(tipo === 'tiktok') { 
            bgStyle = "background: #000000; color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>`; 
          }
          else if(tipo === 'telegram') { 
            bgStyle = "background: #2AABEE; color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`; 
          }
          else if(tipo === 'facebook') { 
            bgStyle = "background: #1877F2; color: #ffffff; border: none;"; 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`; 
          }
          else { 
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`; 
          }
          
          redesHtml += `
            <a href="${red.link}" target="_blank" rel="noopener noreferrer" 
              style="display:flex; align-items:center; justify-content:center; gap:8px; ${bgStyle} padding:10px 16px; border-radius:12px; text-decoration:none; font-size:0.88rem; font-weight:700; transition: transform 0.2s, box-shadow 0.2s; flex: 1; min-width: 130px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" 
              onmouseover="this.style.transform='translateY(-2px)';" 
              onmouseout="this.style.transform='translateY(0)';">
              ${svgIcon}
              <span>${red.nombre || 'Visitar'}</span>
            </a>
          `;
        });
      }

      let avatarHtml = "";
      if(aliado.imagen_qr) {
        avatarHtml = `<img src="${aliado.imagen_qr}" alt="Perfil" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.4); flex-shrink: 0; background: #fff;">`;
      } else {
        const inicial = (aliado.nombre_aliado || "A")[0].toUpperCase();
        avatarHtml = `<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; border: 2px solid rgba(255,255,255,0.4); flex-shrink: 0;">${inicial}</div>`;
      }

      const card = document.createElement("div");
      card.className = "ally-card";

      card.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
            ${avatarHtml}
            <span style="color: #ffffff; font-weight: 800; font-size: 1.15rem; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              ${aliado.nombre_aliado}
            </span>
          </div>
          <span style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); color: #ffffff; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; flex-shrink: 0;">
            🤝 ALIADO
          </span>
        </div>

        <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1; box-sizing: border-box;">
          <p style="font-size: 0.95rem; color: #475569; margin: 0 0 20px 0; line-height: 1.55; flex-grow: 1;">
            ${aliado.descripcion || 'Sin descripción disponible.'}
          </p>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid #f1f5f9; margin-top: auto;">
            ${redesHtml || '<span style="font-size:0.8rem; color:#94a3b8;">Sin enlaces de contacto</span>'}
          </div>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando aliados:", error);
    container.innerHTML = `<p style="text-align: center; color: #ef4444; width: 100%;">Hubo un error cargando los aliados.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarTabsPrincipales();
  inicializarFormularioAlianzas();
  cargarAliados();
  
  // Si la URL tiene el parámetro tab=alianzas, simular clic en esa pestaña
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam === 'alianzas') {
    const tabButton = document.querySelector('.main-tab[data-target="alianzas"]');
    if (tabButton) {
      tabButton.click();
    }
  }
});

/* ----- LÓGICA DE INTERACCIÓN DE ZOOM E INSPECCIÓN DE IMÁGENES ----- */
let currentImgScale = 1;

window.openImgZoomModal = function(url, title) {
  const modal = document.getElementById('img-zoom-modal');
  const targetImg = document.getElementById('img-modal-target');
  const titleEl = document.getElementById('img-modal-title');
  if (!modal || !targetImg) return;

  currentImgScale = 1;
  targetImg.style.transform = 'scale(1)';
  targetImg.src = url;
  if (titleEl) titleEl.textContent = title || 'Vista Previa Ampliada';

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
};

window.closeImgZoomModal = function() {
  const modal = document.getElementById('img-zoom-modal');
  if (!modal) return;
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};

window.zoomImgModal = function(delta) {
  const targetImg = document.getElementById('img-modal-target');
  if (!targetImg) return;

  if (delta === 0) {
    currentImgScale = 1;
  } else {
    currentImgScale = Math.min(Math.max(0.75, currentImgScale + delta), 3.5);
  }
  targetImg.style.transform = `scale(${currentImgScale})`;
};

window.toggleImgZoomScale = function(img) {
  if (currentImgScale > 1) {
    currentImgScale = 1;
  } else {
    currentImgScale = 2;
  }
  img.style.transform = `scale(${currentImgScale})`;
};
