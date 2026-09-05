const TOMOS = [
  [
    "Tomos y Prácticas CEPREQUINTOS 2027",
    "Material de estudio oficial, tomos y prácticas especializadas de CEPREQUINTOS.",
    "https://drive.google.com/drive/folders/1RfSFh4w496DoJ3-TShLXjgTLOALnJKDr"
  ],
  [
    "Tomos CEPREUNSA",
    "Compendios y material de estudio organizado por áreas de CEPREUNSA.",
    "https://drive.google.com/drive/folders/1nzuWdHTmM6SC6cwxQcvs9JNQ4N0rEiHF"
  ],
  [
    "Exámenes de Admisión Pasados",
    "Recopilación de exámenes anteriores resueltos para entrenar velocidad y precisión.",
    "https://drive.google.com/drive/folders/1SvOPvIwppyUTJ-16ImBpfnh6wDWaKNVZ"
  ],
  [
    "Material y Resúmenes Clave",
    "Fichas teóricas, formularios y resúmenes complementarios para reforzar el estudio.",
    "https://drive.google.com/drive/folders/1fNBpQ7M-QKWELu6S2aSsW340ULCZnM4z"
  ]
];

function obtenerDriveId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

function cargarTomos() {
  const contenedor = document.getElementById("tomos-grid");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  TOMOS.forEach(tomo => {
    const titulo = tomo[0];
    const descripcion = tomo[1];
    const driveUrl = tomo[2];
    const driveId = obtenerDriveId(driveUrl);

    const tarjeta = document.createElement("article");
    tarjeta.className = "drive-card";

    tarjeta.innerHTML = `
      <div class="drive-card-head">
        <div class="drive-card-info">
          <h2>${titulo}</h2>
          <p>${descripcion}</p>
        </div>
        <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="btn-drive-open" title="Abrir carpeta en Google Drive">
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
            ? `<iframe src="https://drive.google.com/embeddedfolderview?id=${driveId}#list" loading="lazy" allowfullscreen title="Vista previa de ${titulo}"></iframe>`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.9rem;">No se pudo cargar la vista previa.</div>`
        }
      </div>
    `;

    contenedor.appendChild(tarjeta);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarTomos);
} else {
  cargarTomos();
}
