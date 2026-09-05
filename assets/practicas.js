const PRACTICAS = [
  {
    titulo: "CEPREQUINTOS 2027",
    descripcion: "Material en proceso y actualización constante para postulantes de 5to de secundaria.",
    carpeta: "https://drive.google.com/drive/folders/1RfSFh4w496DoJ3-TShLXjgTLOALnJKDr"
  },
  {
    titulo: "Prácticas Academia Esparta",
    descripcion: "Ejercicios resueltos, bancos y prácticas semanales de la Academia Esparta.",
    carpeta: "https://drive.google.com/drive/folders/1Y8WeDnr-OwWse3RXxoMCqdHAOY7897_w"
  },
  {
    titulo: "Academia Briceño",
    descripcion: "Material de prácticas y ejercicios clasificados de la Academia Briceño.",
    carpeta: "https://drive.google.com/drive/folders/1K8WKW14uvGDSNOF5ctlVlBrCFKktlsYK"
  },
  {
    titulo: "Prácticas CEPREUNSA",
    descripcion: "Bancos de preguntas y prácticas para reforzar la preparación en todas las áreas.",
    carpeta: "https://drive.google.com/drive/folders/1dLvDGUtO4xJFOw30zyaH24vWiJtjlJZ3"
  }
];

function obtenerDriveId(url) {
  const coincidencia = url.match(/[-\w]{25,}/);
  return coincidencia ? coincidencia[0] : null;
}

function cargarPracticas() {
  const contenedor = document.getElementById("practicas-grid");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  PRACTICAS.forEach(practica => {
    const driveId = obtenerDriveId(practica.carpeta);
    const tarjeta = document.createElement("article");
    tarjeta.className = "drive-card";

    tarjeta.innerHTML = `
      <div class="drive-card-head">
        <div class="drive-card-info">
          <h2>${practica.titulo}</h2>
          <p>${practica.descripcion}</p>
        </div>
        <a href="${practica.carpeta}" target="_blank" rel="noopener noreferrer" class="btn-drive-open" title="Abrir carpeta en Google Drive">
          <span>Abrir Drive</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

      <div class="drive-preview-wrap">
        ${
          driveId
            ? `<iframe src="https://drive.google.com/embeddedfolderview?id=${driveId}#list" loading="lazy" allowfullscreen title="Vista previa de ${practica.titulo}"></iframe>`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.9rem;">No se pudo cargar la vista previa.</div>`
        }
      </div>
    `;

    contenedor.appendChild(tarjeta);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarPracticas);
} else {
  cargarPracticas();
}
