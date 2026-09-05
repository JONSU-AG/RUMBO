import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Eye, 
  ExternalLink, 
  Users, 
  FileText, 
  Save, 
  X, 
  RefreshCw,
  Award,
  UserX,
  UserCheck,
  Ban,
  Plus,
  Star,
  Sparkles,
  UploadCloud,
  Megaphone,
  Flag,
  MessageSquare,
  Bell,
  Send,
  ShieldAlert,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { uploadFileReliable, getDirectImageUrl } from '../lib/storageHelper';
import { searchMatches } from '../lib/searchHelper';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LiveUserAvatar } from '../components/LiveUserAvatar';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { ConfirmModal, NoticeModal } from '../components/ConfirmModal';

export const Admin = () => {
  const { user, isAdmin, loading: authLoading, loginWithGoogle, claimAdminRole } = useAuth();
  const [activeTab, setActiveTab] = useState('reportes'); // 'reportes' | 'pendientes' | 'reportados' | 'aprobados' | 'usuarios' | 'carrusel' | 'anuncios'
  const [reportsList, setReportsList] = useState([]);
  const [reportFilter, setReportFilter] = useState('todos'); // 'todos' | 'perfil' | 'material' | 'pendiente'
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    targetUid: '',
    targetName: '',
    targetEmail: '',
    reportId: null,
    motivoReporte: '',
    customMessage: '',
    submitting: false
  });
  const [uploads, setUploads] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [solicitudesAliados, setSolicitudesAliados] = useState([]);
  const [classComments, setClassComments] = useState([]);
  const [profileComments, setProfileComments] = useState([]);
  const [foroPosts, setForoPosts] = useState([]);
  const [sentBroadcasts, setSentBroadcasts] = useState([]);
  const [anuncioTitle, setAnuncioTitle] = useState('');
  const [anuncioMessage, setAnuncioMessage] = useState('');
  const [isSubmittingAnuncio, setIsSubmittingAnuncio] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', url: '', desc: '' });
  const [loading, setLoading] = useState(true);
  const [claimKey, setClaimKey] = useState('');
  const [claimMsg, setClaimMsg] = useState(null);

  // Modal for adding/editing Carrusel Ally Cards
  const [allyModal, setAllyModal] = useState({
    isOpen: false,
    isEdit: false,
    id: null,
    form: {
      name: '',
      role: 'Aliado Oficial RUMBO',
      badge: '⭐ Aliado Comunitario',
      specialty: '',
      desc: '',
      whatsappChannel: '',
      tiktokUrl: '',
      phone: '',
      avatar: './assets/LOGOR.png',
      uid: ''
    }
  });

  // Modal states replacing native dialogs
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirmar' });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '' });

  const showNotice = (title, message) => setNoticeModal({ isOpen: true, title, message });

  // Subscribe to uploads collection
  useEffect(() => {
    const q = query(collection(db, 'uploads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUploads(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore error in Admin uploads:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to usuarios collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersList(docs);
    }, (err) => {
      console.warn("Firestore error in Admin usuarios:", err);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to solicitudes_aliados collection (Carrusel de Aliados)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'solicitudes_aliados'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSolicitudesAliados(docs);
    }, (err) => {
      console.warn("Firestore error in Admin solicitudes_aliados:", err);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to reportes collection (Bandeja de Reportes)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reportes'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
        return tB - tA;
      });
      setReportsList(docs);
    }, (err) => {
      console.warn("Firestore error in Admin reportes:", err);
    });

    return () => unsubscribe();
  }, []);

  // Ally Modal Handlers
  const openNewAllyModal = () => {
    setAllyModal({
      isOpen: true,
      isEdit: false,
      id: null,
      form: {
        name: '',
        role: 'Aliado Oficial RUMBO',
        badge: '⭐ Aliado Comunitario',
        specialty: 'Material Preuniversitario UNSA',
        desc: '',
        whatsappChannel: '',
        tiktokUrl: '',
        phone: '',
        avatar: './assets/LOGOR.png',
        uid: ''
      }
    });
  };

  const openEditAllyModal = (ally) => {
    setAllyModal({
      isOpen: true,
      isEdit: true,
      id: ally.id,
      form: {
        name: ally.name || ally.displayName || '',
        role: ally.role || 'Aliado Oficial RUMBO',
        badge: ally.badge || '⭐ Aliado Comunitario',
        specialty: ally.specialty || ally.subject || '',
        desc: ally.desc || '',
        whatsappChannel: ally.whatsappChannel || '',
        tiktokUrl: ally.tiktokUrl || '',
        phone: ally.phone || '',
        avatar: ally.avatar || ally.photoURL || './assets/LOGOR.png',
        uid: ally.uid || ally.id || ''
      }
    });
  };

  const handleSaveAllyModal = async (e) => {
    e.preventDefault();
    if (!allyModal.form.name.trim()) {
      showNotice("Campo Requerido", "Por favor ingresa un nombre para el Aliado.");
      return;
    }

    try {
      if (allyModal.isEdit && allyModal.id) {
        await updateDoc(doc(db, 'solicitudes_aliados', allyModal.id), {
          ...allyModal.form,
          status: 'aprobado',
          updatedAt: new Date()
        });
        showNotice("Actualizado", "Tarjeta de Aliado editada con éxito.");
      } else {
        await addDoc(collection(db, 'solicitudes_aliados'), {
          ...allyModal.form,
          status: 'aprobado',
          createdAt: new Date()
        });
        showNotice("Creado", "Nueva Tarjeta de Aliado agregada al carrusel.");
      }
      setAllyModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      showNotice("Error", "Error al guardar la tarjeta: " + err.message);
    }
  };

  const [isUploadingAllyImage, setIsUploadingAllyImage] = useState(false);

  const handleAllyImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAllyImage(true);
    try {
      const uploadedUrl = await uploadFileReliable(file, null, 'aliados_carrusel', allyModal.form.avatar);
      if (uploadedUrl) {
        const directUrl = getDirectImageUrl(uploadedUrl);
        setAllyModal(prev => ({
          ...prev,
          form: {
            ...prev.form,
            avatar: directUrl
          }
        }));
        showNotice("Foto Subida", "Imagen de aliado cargada con éxito.");
      }
    } catch (err) {
      showNotice("Error", "Error al subir la imagen: " + err.message);
    } finally {
      setIsUploadingAllyImage(false);
    }
  };

  const handleDeleteAllyCard = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar del Carrusel?',
      message: `¿Seguro que deseas eliminar la tarjeta de "${name}" del carrusel de aliados?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'solicitudes_aliados', id));
          showNotice("Eliminado", "Tarjeta eliminada del carrusel.");
        } catch (e) {
          showNotice("Error", "Error al eliminar: " + e.message);
        }
      }
    });
  };

  // Subscribe to other community collections for triple reports
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'clase_comentarios'), (snapshot) => {
      setClassComments(snapshot.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'clase_comentarios', _typeLabel: '💬 Comentario de Clase' })));
    }, err => console.warn(err));

    const unsub2 = onSnapshot(collection(db, 'perfil_comentarios'), (snapshot) => {
      setProfileComments(snapshot.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'perfil_comentarios', _typeLabel: '👤 Comentario de Perfil' })));
    }, err => console.warn(err));

    const unsub3 = onSnapshot(collection(db, 'foro_preguntas'), (snapshot) => {
      setForoPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'foro_preguntas', _typeLabel: '❓ Pregunta de Foro' })));
    }, err => console.warn(err));

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // Subscribe to sent broadcast community announcements
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'notificaciones'),
        where('recipientUid', '==', 'all')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });
        setSentBroadcasts(docs);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Broadcasts listener error:", e);
    }
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!anuncioTitle.trim() || !anuncioMessage.trim()) {
      showNotice("Campo Requerido", "Por favor completa el título y mensaje del aviso a la comunidad.");
      return;
    }
    setIsSubmittingAnuncio(true);
    try {
      await addDoc(collection(db, 'notificaciones'), {
        recipientUid: 'all',
        type: 'admin_broadcast',
        title: anuncioTitle.trim(),
        message: anuncioMessage.trim(),
        senderUid: user?.uid || 'admin',
        senderName: 'ADMINISTRACIÓN RUMBO',
        senderPhoto: './assets/LOGOR.png',
        read: false,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });
      setAnuncioTitle('');
      setAnuncioMessage('');
      showNotice("Aviso Publicado", "¡El aviso a la comunidad fue enviado con éxito a la campanita de todos los estudiantes!");
    } catch (err) {
      showNotice("Error", "Error al publicar aviso: " + err.message);
    } finally {
      setIsSubmittingAnuncio(false);
    }
  };

  // Actions
  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'uploads', id), {
        status: 'aprobado',
        enRevision: false,
        oculto: false,
        reportsCount: 0
      });
    } catch (e) {
      showNotice("Error", "Error al aprobar: " + e.message);
    }
  };

  const handleHide = async (id) => {
    try {
      await updateDoc(doc(db, 'uploads', id), {
        oculto: true,
        enRevision: true
      });
    } catch (e) {
      showNotice("Error", "Error al ocultar: " + e.message);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar aporte?',
      message: '¿Seguro que deseas eliminar este aporte permanentemente?',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'uploads', id));
          showNotice("Aporte Eliminado", "El aporte se eliminó permanentemente.");
        } catch (e) {
          showNotice("Error", "Error al eliminar: " + e.message);
        }
      }
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || '',
      author: item.author || '',
      url: item.url || '',
      desc: item.desc || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      await updateDoc(doc(db, 'uploads', id), {
        title: editForm.title,
        author: editForm.author,
        url: editForm.url,
        desc: editForm.desc
      });
      setEditingId(null);
    } catch (e) {
      showNotice("Error", "Error al guardar edición: " + e.message);
    }
  };

  const toggleAllyUser = async (uid, currentStatus) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        isAlly: !currentStatus
      });
    } catch (e) {
      showNotice("Error", "Error al cambiar estado de Aliado: " + e.message);
    }
  };

  const openWarningModal = (targetUser, report = null) => {
    const uid = targetUser?.uid || targetUser?.id || report?.reportedUser?.uid || (report?.targetType === 'perfil' || report?.targetType === 'user' ? report?.targetId : null);
    const name = targetUser?.displayName || targetUser?.name || report?.reportedUser?.displayName || report?.targetTitle || 'Usuario';
    const email = targetUser?.email || report?.reportedUser?.email || '';
    const reason = report?.reasonLabel || report?.reason || 'Normas comunitarias y contenido';
    const detail = report?.details ? `Detalle: "${report.details}".` : '';

    const defaultMsg = `Hola ${name}, la administración de RUMBO te notifica que tu perfil/actividad ha recibido un reporte por el siguiente motivo: "${reason}". ${detail} Te recordamos mantener tus datos y aportes acordes a las normas comunitarias.`;

    setWarningModal({
      isOpen: true,
      targetUid: uid,
      targetName: name,
      targetEmail: email,
      reportId: report?.id || null,
      motivoReporte: reason,
      customMessage: defaultMsg,
      submitting: false
    });
  };

  const handleSendWarning = (uid, userName, optionalEmail = '') => {
    openWarningModal({ id: uid, uid, displayName: userName, email: optionalEmail });
  };

  const handleSendWarningFromModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!warningModal.targetUid) {
      showNotice("Error", "No se encontró el UID del usuario a notificar.");
      return;
    }
    if (!warningModal.customMessage.trim()) {
      showNotice("Campo Requerido", "Por favor ingresa el texto del aviso que se mostrará en pantalla.");
      return;
    }

    setWarningModal(prev => ({ ...prev, submitting: true }));
    try {
      // 1. Actualizar usuario para que active el WarningBanner en pantalla
      await updateDoc(doc(db, 'usuarios', warningModal.targetUid), {
        hasWarning: true,
        warningMessage: warningModal.customMessage.trim(),
        warningDismissed: false,
        warningReason: warningModal.motivoReporte,
        banned: false,
        lastWarningAt: new Date().toISOString()
      });

      // 2. Si proviene de un reporte, actualizar estado del reporte
      if (warningModal.reportId) {
        await updateDoc(doc(db, 'reportes', warningModal.reportId), {
          status: 'aviso_enviado',
          adminWarningSent: true,
          adminWarningMessage: warningModal.customMessage.trim(),
          resolvedAt: serverTimestamp(),
          resolvedBy: user?.email || 'admin'
        });
      }

      // 3. Notificación a la campanita
      try {
        await addDoc(collection(db, 'notificaciones'), {
          recipientUid: warningModal.targetUid,
          type: 'admin_warning',
          title: '⚠️ Aviso de Moderación RUMBO',
          message: warningModal.customMessage.trim(),
          senderUid: user?.uid || 'admin',
          senderName: 'ADMINISTRACIÓN RUMBO',
          senderPhoto: './assets/LOGOR.png',
          read: false,
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      } catch (errNotif) {
        console.warn("Could not add notification record:", errNotif);
      }

      showNotice("Aviso Enviado", `El aviso en pantalla fue enviado exitosamente a "${warningModal.targetName}".`);
      setWarningModal(prev => ({ ...prev, isOpen: false, submitting: false }));
    } catch (err) {
      showNotice("Error", "Error al enviar aviso: " + err.message);
      setWarningModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await updateDoc(doc(db, 'reportes', reportId), {
        status: 'desestimado',
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.email || 'admin'
      });
      showNotice("Reporte Desestimado", "El reporte fue desestimado sin ninguna sanción para el usuario.");
    } catch (err) {
      showNotice("Error", "Error al desestimar reporte: " + err.message);
    }
  };

  const handleMarkReportReviewed = async (reportId) => {
    try {
      await updateDoc(doc(db, 'reportes', reportId), {
        status: 'revisado',
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.email || 'admin'
      });
      showNotice("Reporte Revisado", "El reporte fue marcado como revisado.");
    } catch (err) {
      showNotice("Error", "Error al actualizar reporte: " + err.message);
    }
  };

  const handleClearWarning = (uid, userName) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Retirar aviso?',
      message: `¿Deseas retirar el aviso a "${userName}"?`,
      confirmText: 'Retirar',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'usuarios', uid), {
            hasWarning: false,
            warningMessage: '',
            warningDismissed: true,
            banned: false
          });
          showNotice("Aviso Retirado", `Aviso retirado para "${userName}".`);
        } catch (e) {
          showNotice("Error", "Error al retirar aviso: " + e.message);
        }
      }
    });
  };

  const handleRestoreGeneric = async (item) => {
    try {
      const targetCol = item._collection || 'uploads';
      await updateDoc(doc(db, targetCol, item.id), {
        oculto: false,
        hidden: false,
        autoHidden: false,
        tripleReported: false,
        reportsCount: 0,
        enRevision: false,
        status: 'aprobado'
      });
      showNotice("Restaurado", "Elemento restaurado con éxito. Ya es visible públicamente nuevamente.");
    } catch (e) {
      showNotice("Error", "Error al restaurar: " + e.message);
    }
  };

  const handleDeleteGeneric = (item) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar contenido?',
      message: '¿Seguro que deseas eliminar permanentemente este contenido?',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          const targetCol = item._collection || 'uploads';
          await deleteDoc(doc(db, targetCol, item.id));
          showNotice("Eliminado", "Contenido eliminado permanentemente.");
        } catch (e) {
          showNotice("Error", "Error al eliminar: " + e.message);
        }
      }
    });
  };

  // Filtered lists
  const reportadosList = uploads.filter(u => (u.reportsCount > 0 || u.enRevision) && !u.oculto && (u.reportsCount || 0) < 3);
  const pendientesList = uploads.filter(u => (u.enRevision || u.reportsCount === 1) && !u.oculto && (u.reportsCount || 0) < 3);
  const aprobadosList = uploads.filter(u => !u.oculto && !u.hidden && (u.reportsCount || 0) < 3);

  // Triple reports (3+ reports or auto-hidden across community content)
  const triplesUploads = uploads.filter(u => u.oculto || u.hidden || u.autoHidden || u.tripleReported || (u.reportsCount || 0) >= 3).map(u => ({ ...u, _collection: 'uploads', _typeLabel: '📚 Material de Biblioteca' }));
  const triplesClassComments = classComments.filter(c => c.oculto || c.hidden || c.autoHidden || c.tripleReported || (c.reportsCount || 0) >= 3);
  const triplesProfileComments = profileComments.filter(c => c.oculto || c.hidden || c.autoHidden || c.tripleReported || (c.reportsCount || 0) >= 3);
  const triplesForo = foroPosts.filter(f => f.oculto || f.hidden || f.autoHidden || f.tripleReported || (f.reportsCount || 0) >= 3);
  const triplesUsers = usersList.filter(u => u.oculto || u.hidden || u.autoHidden || u.tripleReported || (u.reportsCount || 0) >= 3).map(u => ({ ...u, _collection: 'usuarios', _typeLabel: '👤 Perfil de Usuario' }));

  const triplesList = [...triplesUploads, ...triplesClassComments, ...triplesProfileComments, ...triplesForo, ...triplesUsers];

  const pendingReportsCount = reportsList.filter(r => r.status === 'pendiente' || !r.status).length;

  const filteredReports = reportsList.filter(rep => {
    if (reportFilter === 'perfil' && !(rep.targetType === 'perfil' || rep.targetType === 'user')) return false;
    if (reportFilter === 'material' && rep.targetType !== 'material') return false;
    if (reportFilter === 'pendiente' && (rep.status === 'revisado' || rep.status === 'desestimado' || rep.status === 'aviso_enviado')) return false;

    if (searchQuery) {
      const match = searchMatches([
        rep.targetTitle,
        rep.reportedUser?.displayName,
        rep.reportedUser?.email,
        rep.reporterEmail,
        rep.reason,
        rep.reasonLabel,
        rep.details,
        rep.targetType
      ], searchQuery);
      if (!match) return false;
    }
    return true;
  });

  const currentList = activeTab === 'pendientes' 
    ? pendientesList 
    : activeTab === 'reportados' 
    ? reportadosList 
    : activeTab === 'triples'
    ? triplesList
    : aprobadosList;

  const filteredItems = currentList.filter(item => {
    const textTarget = item.title || item.texto || item.text || item.pregunta || item.content || item.desc || item.displayName || '';
    const authorTarget = item.author || item.userName || item.userEmail || item.authorName || item.uploadedBy?.name || item.uploadedBy?.email || '';
    return searchMatches([textTarget, authorTarget, item.category, item._typeLabel], searchQuery);
  });

  const filteredUsers = usersList.filter(u => {
    return searchMatches([u.displayName, u.email, u.id], searchQuery);
  });

  // Access control guard: Autor y Administrador de Firebase
  if (!authLoading && !isAdmin) {
    const handleVerifyClaim = async (e) => {
      e.preventDefault();
      const res = await claimAdminRole(claimKey);
      setClaimMsg(res);
    };

    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '520px', padding: '36px', textAlign: 'center', borderRadius: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(0, 122, 255, 0.12)', color: 'var(--accent-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Shield size={36} />
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-main)' }}>
            Panel de Administrador RUMBO 🔒
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '20px' }}>
            Este panel está reservado para el <strong>Autor y Creador del Proyecto Firebase</strong>.
          </p>

          {user && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(120,120,128,0.08)', borderRadius: '14px', fontSize: '0.85rem' }}>
              Sesión activa con: <br /><strong>{user.email}</strong>
            </div>
          )}

          {/* Formulario de Activación de Autor de Firebase */}
          <form onSubmit={handleVerifyClaim} style={{ marginBottom: '20px', textAlign: 'left', background: 'rgba(0,122,255,0.05)', padding: '18px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              🔑 Verificar como Autor de Firebase:
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              Ingresa el <strong>Project ID</strong> de Firebase (<code>rumbo-jonsu</code>) o tu clave de autorización:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ej: rumbo-jonsu"
                value={claimKey}
                onChange={(e) => setClaimKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--card-border)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--accent-color)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Verificar
              </button>
            </div>
            {claimMsg && (
              <div style={{
                marginTop: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: claimMsg.success ? '#34A853' : '#EF4444'
              }}>
                {claimMsg.message}
              </div>
            )}
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              to="/auth"
              style={{
                padding: '12px',
                borderRadius: '16px',
                background: 'rgba(120, 120, 128, 0.12)',
                color: 'var(--text-main)',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'block',
                fontSize: '0.88rem'
              }}
            >
              Cambiar de Cuenta Google
            </Link>
            <Link
              to="/"
              style={{
                padding: '10px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'block',
                fontSize: '0.85rem'
              }}
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '16px 12px', paddingBottom: '120px', maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          padding: '14px',
          borderRadius: '20px',
          background: 'rgba(168, 85, 247, 0.12)',
          color: '#A855F7',
          marginBottom: '12px'
        }}>
          <Shield size={32} />
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-main)', wordBreak: 'break-word' }}>
          Panel de Administración RUMBO 🛠️
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 3vw, 1.05rem)', margin: 0, lineHeight: 1.4 }}>
          Revisión total, moderación de reportes y gestión de Aliados.
        </p>
      </header>

      {/* Tabs con Scroll Horizontal Suave en Celulares */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-start',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '8px',
        marginBottom: '20px',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'reportes', label: `🚩 Bandeja de Reportes (${pendingReportsCount})` },
          { id: 'pendientes', label: `⏳ En Revisión (${pendientesList.length})` },
          { id: 'reportados', label: `🚩 Materiales Reportados (${reportadosList.length})` },
          { id: 'triples', label: `🚨 Reportes Triples (3+) (${triplesList.length})` },
          { id: 'aprobados', label: `✅ Activos (${aprobadosList.length})` },
          { id: 'carrusel', label: `🎯 Carrusel de Aliados (${1 + (solicitudesAliados?.length || 0)})` },
          { id: 'usuarios', label: `👥 Aliados y Usuarios (${usersList.length})` },
          { id: 'anuncios', label: `📢 Avisos Comunidad (${sentBroadcasts.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '14px',
              border: '1.5px solid var(--card-border)',
              background: activeTab === tab.id ? 'var(--accent-color)' : 'var(--card-bg)',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 6px 16px rgba(0,122,255,0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Universal Search Input */}
      <div style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder={activeTab === 'usuarios' ? "🔍 Buscar usuario por nombre, correo o UID..." : "🔍 Buscar aporte por título, autor o contenido..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 44px 12px 44px',
              borderRadius: '16px',
              border: '1.5px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(120,120,128,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ──────────────── TAB: BANDEJA DE REPORTES (PERFILES Y CONTENIDO) ──────────────── */}
      {activeTab === 'reportes' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '22px 24px', borderRadius: '24px', border: '1.5px solid rgba(239, 68, 68, 0.25)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(245, 158, 11, 0.05))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={24} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Bandeja de Reportes de Moderación ({reportsList.length})
              </h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              🛡️ <strong>Regla para Perfiles de Usuario:</strong> Los perfiles de usuario <u>nunca se cierran ni se ocultan automáticamente</u>. Como Administrador, puedes revisar cada reporte recibido y, <strong>de manera opcional</strong>, enviarle un aviso en pantalla al usuario indicándole el motivo para que verifique y ajuste su cuenta.
            </p>

            {/* Sub-filtros */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[
                { id: 'todos', label: `Todos (${reportsList.length})` },
                { id: 'pendiente', label: `⏳ Pendientes (${pendingReportsCount})` },
                { id: 'perfil', label: `👤 Perfiles (${reportsList.filter(r => r.targetType === 'perfil' || r.targetType === 'user').length})` },
                { id: 'material', label: `📚 Materiales (${reportsList.filter(r => r.targetType === 'material').length})` }
              ].map(flt => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setReportFilter(flt.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reportFilter === flt.id ? '1.5px solid #EF4444' : '1px solid var(--card-border)',
                    background: reportFilter === flt.id ? 'rgba(239, 68, 68, 0.15)' : 'var(--card-bg)',
                    color: reportFilter === flt.id ? '#DC2626' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                {searchQuery ? `No hay reportes que coincidan con "${searchQuery}".` : 'No hay reportes en esta sección.'}
              </p>
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isProfileReport = rep.targetType === 'perfil' || rep.targetType === 'user';
              const targetUserUid = rep.reportedUser?.uid || (isProfileReport ? rep.targetId : null);
              const targetUserName = rep.reportedUser?.displayName || rep.targetTitle || 'Usuario';
              const targetUserEmail = rep.reportedUser?.email || '';

              return (
                <div
                  key={rep.id}
                  className="glass-card"
                  style={{
                    padding: '22px 24px',
                    borderRadius: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: rep.status === 'aviso_enviado' 
                      ? '1.5px solid rgba(245, 158, 11, 0.4)' 
                      : rep.status === 'desestimado'
                      ? '1px solid var(--card-border)'
                      : '1.5px solid rgba(239, 68, 68, 0.35)',
                    background: 'var(--card-bg)'
                  }}
                >
                  {/* Header of Report Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        background: isProfileReport ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                        color: isProfileReport ? '#9333EA' : 'var(--accent-color)'
                      }}>
                        {isProfileReport ? '👤 REPORTE DE PERFIL' : `📌 REPORTE (${rep.targetType?.toUpperCase() || 'CONTENIDO'})`}
                      </span>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: rep.status === 'aviso_enviado' 
                          ? 'rgba(245, 158, 11, 0.18)' 
                          : rep.status === 'desestimado' 
                          ? 'rgba(120, 120, 128, 0.15)' 
                          : rep.status === 'revisado' 
                          ? 'rgba(52, 168, 83, 0.18)' 
                          : 'rgba(239, 68, 68, 0.18)',
                        color: rep.status === 'aviso_enviado' 
                          ? '#D97706' 
                          : rep.status === 'desestimado' 
                          ? 'var(--text-secondary)' 
                          : rep.status === 'revisado' 
                          ? '#059669' 
                          : '#DC2626'
                      }}>
                        {rep.status === 'aviso_enviado' 
                          ? '✉️ Aviso Enviado' 
                          : rep.status === 'desestimado' 
                          ? '✓ Desestimado' 
                          : rep.status === 'revisado' 
                          ? '✓ Revisado' 
                          : '⏳ Pendiente'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {rep.createdAt?.toDate ? rep.createdAt.toDate().toLocaleString('es-PE') : (rep.timestamp ? new Date(rep.timestamp).toLocaleString('es-PE') : '')}
                    </span>
                  </div>

                  {/* Target & Reason Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      Elemento Reportado: <span style={{ color: 'var(--accent-color)' }}>{rep.targetTitle || targetUserName}</span>
                      {targetUserUid && (
                        <Link
                          to={`/usuario/${targetUserUid}`}
                          target="_blank"
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--accent-color)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '10px',
                            background: 'rgba(0,122,255,0.1)'
                          }}
                        >
                          <ExternalLink size={13} /> Ver Perfil
                        </Link>
                      )}
                    </div>

                    {/* Reason Box */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#DC2626' }}>
                        Motivo del Reporte: {rep.reasonLabel || rep.reason || 'No especificado'}
                      </div>
                      {rep.details && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                          "{rep.details}"
                        </div>
                      )}
                    </div>

                    {/* Reporter Info */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Reportado por: <strong>{rep.reporterEmail || rep.reporterUid || 'Estudiante'}</strong>
                    </div>

                    {rep.adminWarningMessage && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '0.8rem',
                        color: '#92400E'
                      }}>
                        <strong>Aviso en pantalla enviado por Admin:</strong> "{rep.adminWarningMessage}"
                      </div>
                    )}
                  </div>

                  {/* Admin Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
                    {/* Optional Notice Button */}
                    {targetUserUid && (
                      <button
                        type="button"
                        onClick={() => openWarningModal({
                          id: targetUserUid,
                          uid: targetUserUid,
                          displayName: targetUserName,
                          email: targetUserEmail
                        }, rep)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                        }}
                      >
                        <Send size={15} /> Enviar Aviso en Pantalla (Opcional)
                      </button>
                    )}

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={() => handleDismissReport(rep.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--card-border)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle size={15} /> Desestimar (Sin sanción)
                    </button>

                    {/* Mark Reviewed */}
                    <button
                      type="button"
                      onClick={() => handleMarkReportReviewed(rep.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(52, 168, 83, 0.4)',
                        background: 'rgba(52, 168, 83, 0.08)',
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Marcar Atendido
                    </button>

                    {/* Delete Report Record */}
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: '¿Eliminar registro de reporte?',
                          message: '¿Seguro que deseas eliminar este reporte de la bandeja?',
                          confirmText: 'Eliminar',
                          onConfirm: async () => {
                            try {
                              await deleteDoc(doc(db, 'reportes', rep.id));
                              showNotice("Eliminado", "Registro de reporte eliminado.");
                            } catch (e) {
                              showNotice("Error", e.message);
                            }
                          }
                        });
                      }}
                      style={{
                        marginLeft: 'auto',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer'
                      }}
                      title="Eliminar reporte de la lista"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────── TAB: UPLOADS LIST ──────────────── */}
      {activeTab !== 'reportes' && activeTab !== 'usuarios' && activeTab !== 'carrusel' && activeTab !== 'anuncios' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                No hay aportes en esta sección.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isEditing = editingId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderRadius: '24px',
                    border: (item.reportsCount >= 3 || item.tripleReported || activeTab === 'triples') ? '2px solid rgba(239, 68, 68, 0.6)' : item.reportsCount >= 1 ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--card-border)',
                    background: (item.reportsCount >= 3 || item.tripleReported || activeTab === 'triples') ? 'rgba(239, 68, 68, 0.08)' : item.reportsCount >= 1 ? 'rgba(239, 68, 68, 0.04)' : 'var(--card-bg)'
                  }}
                >
                  {activeTab === 'triples' ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 800
                          }}>
                            🚨 TRIPLE REPORTE ({item.reportsCount || 3} reportes) - AUTO-OCULTADO
                          </span>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: 'rgba(0, 122, 255, 0.12)',
                            color: 'var(--accent-color)',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>
                            {item._typeLabel || 'Contenido de la Comunidad'}
                          </span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-main)' }}>
                        {item.title || item.texto || item.text || item.pregunta || item.content || item.comment || item.displayName || 'Sin título'}
                      </h3>

                      {(item.desc || item.subtitulo) && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 12px', fontStyle: 'italic' }}>
                          "{item.desc || item.subtitulo}"
                        </p>
                      )}

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        👤 Autor / Usuario: <strong>{item.userName || item.author || item.userEmail || item.uploadedBy?.name || item.uploadedBy?.email || 'Comunidad'}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'rgba(0, 122, 255, 0.1)',
                              color: 'var(--accent-color)',
                              textDecoration: 'none',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <ExternalLink size={15} /> Ver Enlace
                          </a>
                        )}

                        <button
                          onClick={() => handleRestoreGeneric(item)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                          }}
                        >
                          <CheckCircle size={16} /> ✅ Restaurar y Aprobar (Hacer Visible)
                        </button>

                        <button
                          onClick={() => handleDeleteGeneric(item)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.25)'
                          }}
                        >
                          <Trash2 size={16} /> 🗑️ Eliminar Definitivamente
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    /* Edit Mode Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ✏️ Editando Aporte
                      </h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Título</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.08)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Autor / Créditos</label>
                        <input
                          type="text"
                          value={editForm.author}
                          onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.08)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Enlace / URL</label>
                        <input
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.08)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Descripción / Relato</label>
                        <textarea
                          rows={2}
                          value={editForm.desc}
                          onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(120,120,128,0.08)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          onClick={() => saveEdit(item.id)}
                          style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#34A853', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Save size={16} /> Guardar Cambios
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div>
                      {/* Top badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: 'rgba(0, 122, 255, 0.12)',
                            color: 'var(--accent-color)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}>
                            {item.type || 'RECURSO'}
                          </span>
                          {item.reportsCount > 0 && (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#EF4444',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              🚩 {item.reportsCount} Reporte{item.reportsCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {item.enRevision && (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              ⏳ En Revisión
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Subido por: <strong>{item.uploadedBy?.name || 'Comunidad'}</strong>
                        </span>
                      </div>

                      {/* Title & Author */}
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '10px' }}>
                        ✍️ Autor Original / Crédito: <strong>{item.author || 'Sin especificar'}</strong>
                      </div>

                      {item.desc && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{item.desc}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'rgba(0, 122, 255, 0.1)',
                            color: 'var(--accent-color)',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <ExternalLink size={15} /> Abrir Enlace
                        </a>

                        <button
                          onClick={() => startEdit(item)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#D97706',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Edit3 size={15} /> Editar
                        </button>

                        <button
                          onClick={() => handleApprove(item.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle size={15} /> Aprobar / Activar
                        </button>

                        <button
                          onClick={() => handleHide(item.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#EF4444',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Eye size={15} /> Ocultar
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={15} /> Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────── TAB: CARRUSEL DE ALIADOS ──────────────── */}
      {activeTab === 'carrusel' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} color="#F59E0B" /> Gestión del Carrusel de Aliados
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                Edita, crea o elimina tarjetas del carrusel oficial RUMBO. La tarjeta oficial de JOSNU se mantiene fijada como #1.
              </p>
            </div>
            <button
              onClick={openNewAllyModal}
              style={{
                padding: '12px 20px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 18px rgba(0,122,255,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={18} /> Agregar Nuevo Aliado al Carrusel
            </button>
          </div>

          {/* List of Ally Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Official JOSNU Founder Card */}
            <div className="glass-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '2px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <LiveUserAvatar
                    uid={(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ? user.uid : 'josnu-admin'}
                    fallbackName="JOSNU"
                    fallbackPhoto="./assets/LOGOR.png"
                    fallbackFrame="fuego_creador"
                    size={48}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        FUTURO CACHIMBO UNSA (JOSNU)
                      </h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#D97706' }}>
                        👑 CREADOR RUMBO (#1)
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Fundador & Creador RUMBO • Dirige al perfil oficial de Jonsu
                    </p>
                  </div>
                </div>
                <Link
                  to={`/usuario/${(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ? user.uid : 'josnu-admin'}`}
                  target="_blank"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'rgba(0,122,255,0.1)',
                    color: 'var(--accent-color)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={15} /> Ver Perfil Jonsu
                </Link>
              </div>
            </div>

            {/* 2. Dynamic Solicitudes Aliados */}
            {solicitudesAliados.map(ally => (
              <div key={ally.id} className="glass-card" style={{ padding: '20px 24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <LiveUserAvatar
                    uid={ally.uid}
                    fallbackName={ally.name}
                    fallbackPhoto={ally.avatar}
                    fallbackFrame={ally.avatarFrame || (ally.isCreator || ally.name?.toLowerCase().includes('jonsu') ? 'fuego_creador' : 'carmesi')}
                    size={48}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {ally.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: 'rgba(0,122,255,0.12)', color: 'var(--accent-color)' }}>
                        {ally.badge || '⭐ Aliado'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {ally.role || 'Aliado RUMBO'} • {ally.specialty || 'General'}
                    </p>
                    {ally.desc && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{ally.desc}"
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openEditAllyModal(ally)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#D97706',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit3 size={15} /> Editar
                  </button>

                  <button
                    onClick={() => handleDeleteAllyCard(ally.id, ally.name)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── TAB: USUARIOS & ALIADOS ──────────────── */}
      {activeTab === 'usuarios' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Regla de Aliado Oficial:
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Cualquier usuario que alcance <strong>10 aportes de material</strong> se convierte automáticamente en <strong>Aliado Oficial</strong> y su tarjeta se muestra en la plataforma. Aquí puedes activar o desactivar su insignia manualmente.
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {searchQuery ? `No se encontraron usuarios para "${searchQuery}".` : 'No hay usuarios registrados aún.'}
              </p>
            </div>
          ) : (
            filteredUsers.map(u => (
              <div
                key={u.id}
                className="glass-card"
                style={{
                  padding: '20px 24px',
                  borderRadius: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  border: u.banned ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--card-border)',
                  background: u.banned ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}>
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {u.displayName || 'Usuario RUMBO'}
                      </h4>
                      {u.isAlly && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(52, 168, 83, 0.15)',
                          color: '#34A853'
                        }}>
                          🌟 ALIADO
                        </span>
                      )}
                      {(u.hasWarning || u.banned) && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#D97706'
                        }}>
                          ⚠️ CON AVISO ACTIVO
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                    {(u.hasWarning || u.banned) && (u.warningMessage || u.banReason) && (
                      <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
                        Aviso: "{u.warningMessage || u.banReason}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', marginRight: '6px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                      {u.uploadCount || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aportes</div>
                  </div>

                  {/* Profile Link */}
                  <Link
                    to={`/usuario/${u.id}`}
                    target="_blank"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: 'rgba(0,122,255,0.1)',
                      color: 'var(--accent-color)',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={15} /> Ver Perfil
                  </Link>

                  {/* Ally Toggle */}
                  <button
                    onClick={() => toggleAllyUser(u.id, u.isAlly)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: u.isAlly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 168, 83, 0.15)',
                      color: u.isAlly ? '#EF4444' : '#34A853',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Award size={16} />
                    {u.isAlly ? 'Quitar Aliado' : 'Nombrar Aliado'}
                  </button>

                  {/* Warning / Clear Warning Button */}
                  {(u.hasWarning || u.banned) ? (
                    <button
                      onClick={() => handleClearWarning(u.id, u.displayName || u.email)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'rgba(52, 168, 83, 0.15)',
                        color: '#34A853',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle size={16} /> Limpiar Aviso
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendWarning(u.id, u.displayName || u.email)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#D97706',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <AlertTriangle size={16} /> Enviar Aviso en Pantalla
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ally Add / Edit Modal */}
      {allyModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {allyModal.isEdit ? '✏️ Editar Tarjeta de Aliado' : '➕ Crear Tarjeta de Aliado'}
              </h3>
              <button
                onClick={() => setAllyModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveAllyModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Nombre del Aliado / Canal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Profe Pedro UNSA"
                  value={allyModal.form.name}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, name: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Rol / Título
                </label>
                <input
                  type="text"
                  placeholder="Ej: Docente de Matemática & Física"
                  value={allyModal.form.role}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, role: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Insignia / Badge
                </label>
                <input
                  type="text"
                  placeholder="Ej: ⭐ Aliado Comunitario"
                  value={allyModal.form.badge}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, badge: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Especialidad / Áreas
                </label>
                <input
                  type="text"
                  placeholder="Ej: Razonamiento Matemático, Física Pre"
                  value={allyModal.form.specialty}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, specialty: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Brindo resúmenes y simulacros tipo UNSA..."
                  value={allyModal.form.desc}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, desc: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Enlace de Canal WhatsApp
                </label>
                <input
                  type="url"
                  placeholder="https://whatsapp.com/channel/..."
                  value={allyModal.form.whatsappChannel}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, whatsappChannel: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Enlace de TikTok / Red Social
                </label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={allyModal.form.tiktokUrl}
                  onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, tiktokUrl: e.target.value } })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Imagen de Perfil / Logo del Aliado
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="./assets/LOGOR.png o pega una URL https://..."
                    value={allyModal.form.avatar}
                    onChange={(e) => setAllyModal({ ...allyModal, form: { ...allyModal.form, avatar: e.target.value } })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />

                  {/* File upload button */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0,122,255,0.12)',
                    color: 'var(--accent-color)',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: isUploadingAllyImage ? 'wait' : 'pointer',
                    border: '1.5px dashed var(--accent-color)',
                    transition: 'all 0.2s ease'
                  }}>
                    {isUploadingAllyImage ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {isUploadingAllyImage ? 'Subiendo imagen a Drive...' : '📁 Subir Imagen desde Galería / Dispositivo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAllyImageFileChange}
                      disabled={isUploadingAllyImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Live Avatar Preview */}
                  {allyModal.form.avatar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', padding: '8px 12px', background: 'rgba(120,120,128,0.06)', borderRadius: '12px' }}>
                      <img
                        src={getDirectImageUrl(allyModal.form.avatar)}
                        alt="Vista previa"
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-color)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vista previa de la imagen cargada</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'var(--accent-color)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {allyModal.isEdit ? 'Guardar Cambios' : 'Agregar al Carrusel'}
                </button>
                <button
                  type="button"
                  onClick={() => setAllyModal(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    border: '1px solid var(--card-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── TAB: ANUNCIOS Y AVISOS A LA COMUNIDAD ──────────────── */}
      {activeTab === 'anuncios' && (
        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Form Box */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1.5px solid #A855F7', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Megaphone size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Publicar Aviso a Toda la Comunidad
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Envía un comunicado oficial a la campanita de notificaciones de todos los estudiantes.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Título del Aviso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 📢 Novedades RUMBO 2026: Nuevos simuladores y tomos disponibles"
                  value={anuncioTitle}
                  onChange={(e) => setAnuncioTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.06)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Mensaje Completo del Comunicado *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe aquí el contenido detallado del aviso. Los estudiantes lo verán en una ventana flotante (popup) al hacer clic..."
                  value={anuncioMessage}
                  onChange={(e) => setAnuncioMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--card-border)',
                    background: 'rgba(120, 120, 128, 0.06)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmittingAnuncio || !anuncioTitle.trim() || !anuncioMessage.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isSubmittingAnuncio ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(168, 85, 247, 0.35)'
                }}
              >
                <Megaphone size={18} />
                {isSubmittingAnuncio ? 'Publicando...' : '📢 Emitir Comunicado a la Comunidad'}
              </motion.button>
            </form>
          </div>

          {/* List of Sent Broadcasts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '8px 0 4px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Avisos Emitidos ({sentBroadcasts.length})
            </h4>

            {sentBroadcasts.length === 0 ? (
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center', borderRadius: '18px', color: 'var(--text-secondary)' }}>
                No has emitido avisos a la comunidad aún.
              </div>
            ) : (
              sentBroadcasts.map(b => (
                <div
                  key={b.id}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    borderRadius: '20px',
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
                      📢 AVISO PÚBLICO
                    </span>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Eliminar Aviso",
                          message: "¿Deseas eliminar este aviso de las notificaciones de la comunidad?",
                          confirmText: "Eliminar",
                          onConfirm: async () => {
                            try {
                              await deleteDoc(doc(db, 'notificaciones', b.id));
                              showNotice("Eliminado", "Aviso retirado con éxito.");
                            } catch (e) {
                              showNotice("Error", e.message);
                            }
                          }
                        });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {b.title || 'Aviso RUMBO'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {b.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Enviar Aviso en Pantalla Personalizado al Usuario */}
      {warningModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '28px',
            borderRadius: '24px',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            background: 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Enviar Aviso en Pantalla
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Notificación de moderación para: <strong>{warningModal.targetName}</strong> {warningModal.targetEmail && `(${warningModal.targetEmail})`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendWarningFromModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Motivo o Causa del Reporte:
                </label>
                <input
                  type="text"
                  value={warningModal.motivoReporte}
                  onChange={(e) => setWarningModal(prev => ({ ...prev, motivoReporte: e.target.value }))}
                  placeholder="Ej: Foto o nombre inapropiado, spam en perfil, etc."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Mensaje que se mostrará en pantalla al usuario (Aviso obligatorio para él): *
                </label>
                <textarea
                  rows={4}
                  required
                  value={warningModal.customMessage}
                  onChange={(e) => setWarningModal(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Escribe el aviso que se desplegará en la cabecera de la aplicación para este usuario..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    lineHeight: 1.4
                  }}
                />
              </div>

              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 122, 255, 0.08)',
                border: '1px solid rgba(0, 122, 255, 0.2)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                ℹ️ <strong>Recordatorio:</strong> Los perfiles nunca se cierran automáticamente. Este mensaje aparecerá como un banner amarillo en la parte superior de la pantalla del usuario la próxima vez que abra RUMBO para advertirle del reporte de forma opcional.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={warningModal.submitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: warningModal.submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <Send size={16} />
                  {warningModal.submitting ? 'Enviando Aviso...' : 'Enviar Aviso en Pantalla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal & NoticeModal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <NoticeModal
        isOpen={noticeModal.isOpen}
        title={noticeModal.title}
        message={noticeModal.message}
        onClose={() => setNoticeModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};
