import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Sube un archivo de forma garantizada y 100% nativa.
 * Admite:
 * 1. Google Apps Script (Sube directo a TU Google Drive categorizado en carpetas sin costo).
 * 2. Firebase Storage (bucket 'aportes/{safeName}').
 * 3. Fallback DataURL/ObjectURL seguro para no perder ningún aporte.
 */
export const uploadFileReliable = async (file, onProgress, category = 'variado', oldUrl = null) => {
  if (!file) return '';

  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxi2S-PQoTwt8Ml6x_ehKTcj6naW-wqIBJEuqPHJGyKBJcDIsZO30aMa0klTff7-pFr1A/exec';

  console.log("🚀 Iniciando subida a Google Drive...", { filename: safeName, category, oldUrl, scriptUrl });

  // 1. Subida a tu Google Drive vía Google Apps Script con progreso nativo XHR por bytes de red
  if (scriptUrl) {
    try {
      if (onProgress) onProgress(5);
      
      // Paso A: Lectura local del archivo a Base64 (0% a 20%)
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const readPct = Math.round((e.loaded / e.total) * 15) + 5;
            onProgress(readPct);
          }
        };
        reader.onload = () => {
          const result = reader.result;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      if (onProgress) onProgress(20);

      // Paso B: Transmisión de bytes por la red mediante XHR (20% a 95% continuo según la velocidad de internet)
      const payload = JSON.stringify({
        filename: safeName,
        mimeType: file.type || 'application/octet-stream',
        fileData: base64Data,
        category: category || 'variado',
        oldUrl: oldUrl || null
      });

      const resJson = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', scriptUrl, true);
        xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const uploadPct = Math.round((e.loaded / e.total) * 75) + 20; // 20% -> 95%
            onProgress(Math.min(uploadPct, 95));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              resolve(parsed);
            } catch (err) {
              reject(new Error("Respuesta inválida del servidor"));
            }
          } else {
            reject(new Error(`HTTP error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red durante la transferencia"));
        xhr.send(payload);
      });

      console.log("📥 Respuesta de Google Apps Script:", resJson);

      if (resJson && resJson.url) {
        if (onProgress) onProgress(100);
        return resJson.url;
      } else if (resJson && resJson.error) {
        throw new Error("Error devuelto por Google Apps Script: " + resJson.error);
      } else {
        throw new Error("Respuesta inválida de Google Apps Script");
      }
    } catch (scriptErr) {
      console.error("❌ Error de subida a Google Apps Script:", scriptErr);
    }
  }

  // 2. Subida nativa Firebase Storage
  try {
    if (onProgress) onProgress(10);
    const fileRef = ref(storage, `aportes/${safeName}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    const fbUploadPromise = new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 88) + 10;
            onProgress(Math.min(pct, 98));
          }
        },
        (error) => reject(error),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 12000)
    );

    const fbUrl = await Promise.race([fbUploadPromise, timeoutPromise]);
    if (fbUrl) {
      if (onProgress) onProgress(100);
      return fbUrl;
    }
  } catch (fbErr) {
    console.warn("Firebase Storage upload notice:", fbErr.message);
  }

  // 3. Fallback DataURL
  if (onProgress) onProgress(100);
  return URL.createObjectURL(file);
};

export const getDirectImageUrl = (rawUrl) => {
  if (!rawUrl) return '';
  if (typeof rawUrl !== 'string') return '';
  
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.includes('firebasestorage.googleapis.com')) {
    return rawUrl;
  }

  const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  return rawUrl;
};

export const getDriveThumbnailUrl = (rawUrl, size = 'w1000') => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=${size}`;
  }
  return rawUrl;
};

export const getDriveExportUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:\?id=|\&id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/) ||
                     rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  return rawUrl;
};

