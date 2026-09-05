import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_SAVED_KEY = 'rumbo_saved_materials';

// Helper to load saved items from localStorage
export const getLocalSavedMaterials = () => {
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Error reading saved materials from localStorage:", e);
    return [];
  }
};

// Helper to save array of items to localStorage and trigger global custom event
export const setLocalSavedMaterials = (items) => {
  try {
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('rumbo_saved_updated', { detail: items }));
  } catch (e) {
    console.warn("Error saving materials to localStorage:", e);
  }
};

// Fetch saved materials for a user (from Firestore with localStorage fallback)
export const fetchSavedMaterialsForUser = async (userUid) => {
  const localItems = getLocalSavedMaterials();
  if (!userUid) return localItems;

  try {
    const userDocRef = doc(db, 'usuarios', userUid);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data().savedMaterials && Array.isArray(snap.data().savedMaterials)) {
      const remoteItems = snap.data().savedMaterials;
      // Merge remote & local items by id
      const mergedMap = new Map();
      remoteItems.forEach(item => {
        if (item && item.id) mergedMap.set(String(item.id), item);
      });
      localItems.forEach(item => {
        if (item && item.id) mergedMap.set(String(item.id), item);
      });
      const merged = Array.from(mergedMap.values());
      setLocalSavedMaterials(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Error fetching saved materials from Firestore:", err.message);
  }
  return localItems;
};

// Toggle saving a material item
export const toggleSaveMaterialItem = async (user, materialItem) => {
  if (!materialItem) return false;

  // Generate fallback ID if missing
  const itemId = materialItem.id || materialItem._id || `mat_${(materialItem.title || materialItem[0] || 'item').replace(/\s+/g, '_')}`;
  const itemIdStr = String(itemId);

  const currentSaved = getLocalSavedMaterials();
  const exists = currentSaved.some(item => String(item.id) === itemIdStr);

  let updated;
  if (exists) {
    updated = currentSaved.filter(item => String(item.id) !== itemIdStr);
  } else {
    // Normalize material item representation for persistence
    const newItem = {
      id: itemIdStr,
      title: materialItem.title || materialItem.nombre || (Array.isArray(materialItem) ? materialItem[0] : 'Material RUMBO'),
      desc: materialItem.desc || materialItem.descripcion || (Array.isArray(materialItem) ? materialItem[1] : ''),
      category: materialItem.category || materialItem.categoria || 'general',
      driveUrl: materialItem.driveUrl || materialItem.url || (Array.isArray(materialItem) ? materialItem[2] : ''),
      author: materialItem.author || materialItem.uploadedBy?.displayName || materialItem.uploadedBy?.name || 'Comunidad RUMBO',
      authorUid: materialItem.authorUid || materialItem.uploadedBy?.uid || null,
      savedAt: Date.now()
    };
    updated = [newItem, ...currentSaved];
  }

  setLocalSavedMaterials(updated);

  if (user?.uid) {
    try {
      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, { savedMaterials: updated }, { merge: true });
    } catch (err) {
      console.warn("Error syncing saved material to Firestore:", err.message);
    }
  }

  return !exists; // returns true if item is now saved, false if removed
};

// Check if an item is saved
export const isItemSavedInList = (itemId, savedList = null) => {
  if (!itemId) return false;
  const list = savedList || getLocalSavedMaterials();
  return list.some(item => String(item.id) === String(itemId));
};
