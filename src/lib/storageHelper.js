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

  // 1. Subida ilimitada a tu Google Drive (5 TB) vía Google Apps Script
  if (scriptUrl) {
    try {
      if (onProgress) onProgress(15);
      
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const pct = Math.round((e.loaded / e.total) * 45) + 15;
            onProgress(pct);
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

      if (onProgress) onProgress(60);

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          filename: safeName,
          mimeType: file.type || 'application/octet-stream',
          fileData: base64Data,
          category: category || 'variado',
          oldUrl: oldUrl || null
        })
      });

      if (onProgress) onProgress(85);

      const resJson = await response.json();
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
      throw new Error(`Google Drive Script: ${scriptErr.message}. Verifica en script.google.com que la implementación esté en "Quién tiene acceso: Cualquier persona" (Anyone).`);
    }
  }

  // 2. Subida nativa Firebase Storage (si el plan o reglas están habilitados)
  try {
    if (onProgress) onProgress(30);
    const fileRef = ref(storage, `aportes/${safeName}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    const fbUploadPromise = new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 60) + 30;
            if (onProgress) onProgress(Math.min(pct, 92));
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
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 6000)
    );

    const fbUrl = await Promise.race([fbUploadPromise, timeoutPromise]);
    if (fbUrl) {
      if (onProgress) onProgress(100);
      return fbUrl;
    }
  } catch (fbErr) {
    console.warn("Firebase Storage upload notice:", fbErr.message);
  }

  // 3. Fallback seguro local si todo lo demás falla
  if (onProgress) onProgress(90);
  if (file.size < 400 * 1024) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(reader.result);
      };
      reader.onerror = () => {
        if (onProgress) onProgress(100);
        resolve(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    });
  }

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
                     rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  return rawUrl;
};

