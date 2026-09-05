import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const REACTION_TYPES = [
  { id: 'fuego', emoji: '🔥', color: '#FF5500', glow: 'rgba(255, 85, 0, 0.45)' },
  { id: 'corazon', emoji: '❤️', color: '#EF4444', glow: 'rgba(239, 68, 68, 0.45)' },
  { id: 'estrella', emoji: '⭐', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)' },
];

// Helper to get or create a persistent client device identifier for guest reactions
const getPersistentClientId = () => {
  try {
    let cid = localStorage.getItem('rumbo_client_device_id');
    if (!cid) {
      cid = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('rumbo_client_device_id', cid);
    }
    return cid;
  } catch {
    return 'guest_temp';
  }
};

export const ReactionsBar = ({ targetId, targetType = 'upload', authorUid = null, initialReactions = null, size = 'normal' }) => {
  const { user } = useAuth();
  const rawId = String(targetId || 'unknown');
  const clientId = user?.uid || getPersistentClientId();
  const storageKey = `rumbo_react_multi_${targetType}_${rawId}_${clientId}`;
  const cachedCountsKey = `rumbo_react_counts_${targetType}_${rawId}`;
  const itemAccountKey = `${targetType}_${rawId}`;

  // 1. Instant local vote state: { fuego: boolean, corazon: boolean, estrella: boolean }
  const [userVotes, setUserVotes] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 2. Instant local counts state: checked from persistent cache first, then initialReactions props
  const [counts, setCounts] = useState(() => {
    const res = { fuego: 0, corazon: 0, estrella: 0 };
    try {
      const saved = localStorage.getItem(cachedCountsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            fuego: Math.max(0, Number(parsed.fuego) || 0),
            corazon: Math.max(0, Number(parsed.corazon) || 0),
            estrella: Math.max(0, Number(parsed.estrella) || 0)
          };
        }
      }
    } catch {}

    if (initialReactions) {
      Object.keys(initialReactions).forEach(k => {
        const norm = (k === '🔥' || k === 'fuego') ? 'fuego' : (k === '❤️' || k === 'corazon') ? 'corazon' : (k === '⭐' || k === 'estrella') ? 'estrella' : null;
        if (norm) {
          const val = initialReactions[k];
          res[norm] = Array.isArray(val) ? val.length : Math.max(0, Number(val) || 0);
        }
      });
    }
    return res;
  });

  // Ref to prevent incoming remote snapshots from instantly overwriting user's fresh optimistic click
  const lastUserClickTime = useRef(0);

  // Load user reaction state directly from their Firestore user account if logged in (like saved bookmarks)
  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;
    const fetchUserAccountReactions = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && isMounted) {
          const uData = userSnap.data();
          if (uData.userReactions && uData.userReactions[itemAccountKey]) {
            const savedVotes = uData.userReactions[itemAccountKey];
            setUserVotes(prev => {
              const merged = { ...prev, ...savedVotes };
              try {
                localStorage.setItem(storageKey, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn("User account reaction fetch notice:", err);
      }
    };
    fetchUserAccountReactions();
    return () => { isMounted = false; };
  }, [user?.uid, itemAccountKey, storageKey]);

  useEffect(() => {
    if (!targetId || targetId === 'unknown') return;

    const collectionName = targetType === 'upload' ? 'uploads' : 'reacciones';
    const docRef = doc(db, collectionName, rawId);

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const serverCounts = { fuego: 0, corazon: 0, estrella: 0 };

        // 1. Check nested map: data.reactions
        if (data.reactions && typeof data.reactions === 'object') {
          Object.keys(data.reactions).forEach(k => {
            const norm = (k === '🔥' || k === 'fuego') ? 'fuego' : (k === '❤️' || k === 'corazon') ? 'corazon' : (k === '⭐' || k === 'estrella') ? 'estrella' : null;
            if (norm) {
              const val = data.reactions[k];
              serverCounts[norm] = Array.isArray(val) ? val.length : Math.max(0, Number(val) || 0);
            }
          });
        }

        // 2. Check legacy / root level fields if present
        ['fuego', 'corazon', 'estrella', '🔥', '❤️', '⭐'].forEach(k => {
          if (data[`reactions.${k}`] !== undefined) {
            const norm = (k === '🔥' || k === 'fuego') ? 'fuego' : (k === '❤️' || k === 'corazon') ? 'corazon' : 'estrella';
            const val = data[`reactions.${k}`];
            serverCounts[norm] = Math.max(serverCounts[norm], Array.isArray(val) ? val.length : Math.max(0, Number(val) || 0));
          }
        });

        // 3. Reconcile user remote votes and counts if not in the middle of a user click
        const isRecentClick = Date.now() - lastUserClickTime.current < 2500;
        if (!isRecentClick) {
          if (data.userVotesMulti && data.userVotesMulti[clientId]) {
            const remoteVotes = data.userVotesMulti[clientId] || {};
            setUserVotes(prev => {
              const merged = { ...prev, ...remoteVotes };
              try {
                localStorage.setItem(storageKey, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          setCounts(serverCounts);
          try {
            localStorage.setItem(cachedCountsKey, JSON.stringify(serverCounts));
          } catch {}
        }
      }
    }, (err) => {
      console.warn("Reactions listener notice:", err);
    });

    return () => unsub();
  }, [rawId, targetType, clientId, storageKey, cachedCountsKey, targetId]);

  const handleToggle = async (reactionId) => {
    if (!targetId) return;

    lastUserClickTime.current = Date.now();
    const currentlyVoted = !!userVotes[reactionId];
    const newVoted = !currentlyVoted;
    const delta = newVoted ? 1 : -1;

    // 1. INSTANT 0ms Optimistic UI update (NO LAG, NO DELAY, PERSISTED IN LOCALSTORAGE)
    const nextVotes = { ...userVotes, [reactionId]: newVoted };
    setUserVotes(nextVotes);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextVotes));
    } catch {}

    setCounts(prev => {
      const updated = {
        ...prev,
        [reactionId]: Math.max(0, (prev[reactionId] || 0) + delta)
      };
      try {
        localStorage.setItem(cachedCountsKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Background Firestore Sync with proper nested structures on the material
    try {
      const collectionName = targetType === 'upload' ? 'uploads' : 'reacciones';
      const docRef = doc(db, collectionName, rawId);
      
      const updates = {
        reactions: {
          [reactionId]: increment(delta)
        },
        userVotesMulti: {
          [clientId]: {
            [reactionId]: newVoted
          }
        },
        lastUpdated: Date.now()
      };

      await setDoc(docRef, updates, { merge: true });

      // 3. Sync to user's personal Firestore account (just like saved bookmarks!)
      if (user?.uid) {
        try {
          const userDocRef = doc(db, 'usuarios', user.uid);
          await setDoc(userDocRef, {
            userReactions: {
              [itemAccountKey]: {
                [reactionId]: newVoted
              }
            }
          }, { merge: true });
        } catch (eUser) {
          console.warn("User account reaction sync notice:", eUser);
        }
      }

      // 4. If user reacted to someone else's material, award reputation point
      if (authorUid && authorUid !== user?.uid && authorUid !== 'anonimo') {
        try {
          const authorRef = doc(db, 'usuarios', authorUid);
          await setDoc(authorRef, {
            totalReactionsReceived: increment(delta)
          }, { merge: true });
        } catch (eAuth) {
          console.warn("Reputation sync notice:", eAuth);
        }
      }
    } catch (err) {
      console.warn("Reactions background sync error:", err);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {REACTION_TYPES.map(r => {
        const isActive = !!userVotes[r.id];
        const count = counts[r.id] || 0;

        return (
          <motion.button
            key={r.id}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleToggle(r.id);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: size === 'small' ? '5px 12px' : '7px 15px',
              borderRadius: '16px',
              border: isActive ? `2px solid ${r.color}` : '1.5px solid var(--card-border)',
              background: isActive ? `${r.color}22` : 'rgba(120, 120, 128, 0.08)',
              color: isActive ? r.color : 'var(--text-main)',
              fontSize: size === 'small' ? '0.85rem' : '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? `0 2px 14px ${r.glow}` : 'none',
              userSelect: 'none',
              outline: 'none'
            }}
          >
            <motion.span 
              animate={isActive ? { scale: [1, 1.45, 0.95, 1], rotate: [0, -12, 12, 0] } : { scale: 1 }}
              transition={{ duration: 0.25, type: 'spring', stiffness: 500, damping: 20 }}
              style={{ fontSize: size === 'small' ? '1.1rem' : '1.25rem', lineHeight: 1, display: 'inline-block' }}
            >
              {r.emoji}
            </motion.span>
            <span style={{
              fontSize: size === 'small' ? '0.82rem' : '0.88rem',
              fontWeight: 800,
              color: isActive ? r.color : 'var(--text-secondary)'
            }}>
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
