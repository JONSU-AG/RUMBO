import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, Book, Layers, Shield, Flag, HardDrive, Calendar, Sparkles, MessageSquare } from 'lucide-react';
import { ReportModal } from '../components/ReportModal';
import { SuccessModal } from '../components/SuccessModal';
import { InspirationalDailyBanner } from '../components/InspirationalDailyBanner';
import { CommentsSection } from '../components/CommentsSection';
import { searchMatches } from '../lib/searchHelper';
import { COURSES, KELSEN_VIDEOS, BRICENO_AREAS, BRICENO_2027, SUBJECT_ICONS } from '../data/legacyData';

const getCourseSvgData = (courseName) => {
  const defaultIcon = {
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#3B82F6",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" fill="currentColor" fill-opacity="0.2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/><line x1="22" y1="7" x2="22" y2="13" stroke-width="1.8"/></svg>`
  };

  if (!courseName) return defaultIcon;

  const clean = courseName.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');

  if (clean.includes('bio')) return SUBJECT_ICONS['biologia'];
  if (clean.includes('anat')) return SUBJECT_ICONS['anatomia'];
  if (clean.includes('quim')) return SUBJECT_ICONS['quimica'];
  if (clean.includes('fisi')) return SUBJECT_ICONS['fisica'];
  if (clean.includes('razmat') || clean.includes('razonamientomat') || clean === 'rm') return SUBJECT_ICONS['razonamiento-matematico'];
  if (clean.includes('mat2') || clean.includes('matematica2') || clean.includes('matematicaii')) return SUBJECT_ICONS['matematica-2'];
  if (clean.includes('mat')) return SUBJECT_ICONS['matematica-1'];
  if (clean.includes('razverb') || clean.includes('razonamientoverb') || clean.includes('razverbal') || clean === 'rv') return SUBJECT_ICONS['razonamiento-verbal'];
  if (clean.includes('leng')) return SUBJECT_ICONS['lenguaje'];
  if (clean.includes('lit')) return SUBJECT_ICONS['literatura'];
  if (clean.includes('hist')) return SUBJECT_ICONS['historia'];
  if (clean.includes('geog')) return SUBJECT_ICONS['geografia'];
  if (clean.includes('civ')) return SUBJECT_ICONS['civica'];
  if (clean.includes('filo')) return SUBJECT_ICONS['filosofia'];
  if (clean.includes('psico')) return SUBJECT_ICONS['psicologia'];
  if (clean.includes('ingl')) return SUBJECT_ICONS['ingles'];
  if (clean.includes('compren') || clean.includes('lect')) return SUBJECT_ICONS['comprension-lectora'];

  return defaultIcon;
};

export const AcademyDetail = () => {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [bricenoTab, setBricenoTab] = useState('2027');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isKelsenHorarioOpen, setIsKelsenHorarioOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);

  useEffect(() => {
    // Determine which data to load based on the academy id
    if (id === 'esparta') {
      // COURSES is an object { biologia: { name, lessons: [] }, ... }
      const espartaData = Object.entries(COURSES).map(([key, val]) => ({ ...val, slug: key })).filter(c => c.name);
      setData({ name: 'Esparta', items: espartaData, type: 'esparta' });
    } else if (id === 'kelsen') {
      setData({ 
        name: 'Kelsen', 
        items: KELSEN_VIDEOS, 
        type: 'kelsen' 
      });
    } else if (id === 'briceno') {
      setData({ 
        name: 'Briceño', 
        type: 'briceno' 
      });
    }
  }, [id]);

  const indexableVideos = useMemo(() => {
    if (!data) return [];
    const list = [];

    if (data.type === 'esparta') {
      Object.entries(COURSES).forEach(([slug, c]) => {
        if (!c.name) return;
        (c.lessons || []).forEach(lesson => {
          const url = lesson.url || (lesson.yt ? `https://www.youtube.com/watch?v=${lesson.yt}` : '');
          list.push({
            id: `esparta-${slug}-${lesson.n}`,
            courseName: c.name,
            courseSlug: slug,
            lessonNumber: lesson.n,
            title: lesson.title || `Clase ${lesson.n}`,
            label: `${c.name} - Clase ${lesson.n}: ${lesson.title || ''}`.trim(),
            url
          });
        });
      });
    } else if (data.type === 'kelsen') {
      (KELSEN_VIDEOS || []).forEach((v, idx) => {
        list.push({
          id: `kelsen-${idx + 1}`,
          courseName: 'Kelsen',
          lessonNumber: idx + 1,
          title: v.titulo,
          label: v.titulo,
          url: v.url
        });
      });
    } else if (data.type === 'briceno') {
      (BRICENO_2027 || []).forEach(week => {
        (week.data || []).forEach(course => {
          (course.videos || []).forEach((vid, vIdx) => {
            list.push({
              id: `briceno-2027-${week.num}-${course.nombre}-${vIdx + 1}`,
              courseName: course.nombre,
              lessonNumber: vIdx + 1,
              title: vid.nombre,
              label: `${course.nombre} (${week.nombre}) - ${vid.nombre}`,
              url: vid.url
            });
          });
        });
      });

      (BRICENO_AREAS || []).forEach(area => {
        (area.videos || []).forEach((vidUrl, vIdx) => {
          list.push({
            id: `briceno-2026-${area.nombre}-${vIdx + 1}`,
            courseName: area.nombre,
            lessonNumber: vIdx + 1,
            title: `Clase Intensiva ${vIdx + 1}`,
            label: `${area.nombre} - Clase Intensiva ${vIdx + 1}`,
            url: vidUrl
          });
        });
      });
    }

    return list;
  }, [data]);

  if (!data) {
    return (
      <div className="page-container" style={{ padding: '24px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-main)', marginTop: '40px' }}>Cargando o academia no encontrada...</h2>
        <Link to="/cursos" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>Volver a Cursos</Link>
      </div>
    );
  }

  const handleSearch = (e) => setQuery(e.target.value);

  return (
    <div className="page-container" style={{ padding: '24px', paddingBottom: '100px' }}>
      {/* Frase o Versículo del Día (Amor, Estudio, Paz y Amabilidad) */}
      <InspirationalDailyBanner />

      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <Link 
            to="/cursos" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--text-main)', 
              textDecoration: 'none', 
              fontWeight: 700,
              fontSize: '0.88rem',
              padding: '8px 16px',
              borderRadius: '14px',
              background: 'rgba(120, 120, 128, 0.08)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={18} /> Volver a Cursos
          </Link>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span>Cursos</span> <span style={{ opacity: 0.5 }}>/</span> <strong style={{ color: 'var(--text-main)' }}>{data.name}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>Academia {data.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Explora los cursos, semanas y videos organizados para tu preparación.</p>
          </div>
          <button 
            onClick={() => setIsReportOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Flag size={18} /> Reportar
          </button>
        </div>
        
        {/* ─── BARRA DE BÚSQUEDA Y BOTÓN CHIQUITO DE FORO AL COSTADO ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '520px' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar clase, profesor, materia o semana (sin importar tildes)..." 
              value={query}
              onChange={handleSearch}
              style={{ 
                width: '100%', 
                padding: '14px 44px 14px 18px', 
                border: '1.5px solid var(--card-border)', 
                borderRadius: '16px', 
                background: 'var(--card-bg)', 
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                boxSizing: 'border-box'
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
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

          {/* Panel / Botón Chiquito de Comentarios al costado de la Lupa */}
          <button
            onClick={() => setIsForumOpen(!isForumOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              height: '48px',
              borderRadius: '16px',
              border: isForumOpen ? '1.5px solid var(--accent-color)' : '1.5px solid var(--card-border)',
              background: isForumOpen ? 'rgba(0,122,255,0.14)' : 'var(--card-bg)',
              color: isForumOpen ? 'var(--accent-color)' : 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            title="Abrir o cerrar panel de foro y preguntas de esta academia"
          >
            <MessageSquare size={18} color="var(--accent-color)" />
            <span>💬 Foro & Preguntas</span>
            <span style={{
              background: isForumOpen ? 'var(--accent-color)' : 'rgba(120,120,128,0.18)',
              color: isForumOpen ? '#ffffff' : 'var(--text-main)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {isForumOpen ? 'Ocultar ▲' : 'Ver ▼'}
            </span>
          </button>
        </div>
      </header>

      {/* ─── FORO & RECOMENDACIONES DESPLEGABLE CHIQUITO (DESDE EL BOTÓN AL COSTADO DE BÚSQUEDA) ─── */}
      <AnimatePresence>
        {isForumOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: '24px' }}
          >
            <CommentsSection
              targetId={`academia-${data?.type}`}
              targetTitle={`Academia ${data?.name}`}
              targetType="course"
              promptHint={`¿Estudiando con ${data?.name}? Comparte qué temas vinieron en tu simulacro o indexa clases clave 👇`}
              indexableVideos={indexableVideos}
              initialOpen={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {data.type === 'briceno' && (
        <div style={{ marginBottom: '32px' }}>
          {/* Eye-catching Cycles Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Card 1: Ciclo Actual 2027 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setBricenoTab('2027'); setSelectedWeek('all'); }}
              className="glass-card"
              style={{
                padding: '20px 22px',
                borderRadius: '22px',
                cursor: 'pointer',
                position: 'relative',
                border: bricenoTab === '2027' ? '2px solid #34C759' : '1px solid var(--card-border)',
                background: bricenoTab === '2027' 
                  ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.18), rgba(0, 122, 255, 0.1))' 
                  : 'var(--card-bg)',
                boxShadow: bricenoTab === '2027' ? '0 8px 24px rgba(52, 199, 89, 0.15)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '14px',
                  background: 'rgba(52, 199, 89, 0.2)', color: '#34C759',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🌱
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: bricenoTab === '2027' ? '#34C759' : 'rgba(52, 199, 89, 0.15)',
                  color: bricenoTab === '2027' ? '#FFFFFF' : '#34C759'
                }}>
                  ● EN CURSO
                </span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Ciclo Actual 2027
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Clases organizadas por semanas, materias con iconos SVG y prácticas.
              </p>
            </motion.div>

            {/* Card 2: Ciclo Intensivo 2026 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setBricenoTab('2026')}
              className="glass-card"
              style={{
                padding: '20px 22px',
                borderRadius: '22px',
                cursor: 'pointer',
                position: 'relative',
                border: bricenoTab === '2026' ? '2px solid #A855F7' : '1px solid var(--card-border)',
                background: bricenoTab === '2026' 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(99, 102, 241, 0.1))' 
                  : 'var(--card-bg)',
                boxShadow: bricenoTab === '2026' ? '0 8px 24px rgba(168, 85, 247, 0.15)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '14px',
                  background: 'rgba(168, 85, 247, 0.2)', color: '#A855F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  ⚡
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: bricenoTab === '2026' ? '#A855F7' : 'rgba(168, 85, 247, 0.15)',
                  color: bricenoTab === '2026' ? '#FFFFFF' : '#A855F7'
                }}>
                  8 ÁREAS
                </span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Ciclo Intensivo 2026
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Bancos y clases intensivas clasificadas por materias clave.
              </p>
            </motion.div>

            {/* Card 3: Prácticas en Drive (Exclusivo Ciclo Actual 2027) */}
            {bricenoTab === '2027' && (
              <motion.a
                href="https://drive.google.com/drive/folders/1sGaLVsVGtWeggLUWtw_vB14iwH3mHHH1"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card"
                style={{
                  padding: '20px 22px',
                  borderRadius: '22px',
                  textDecoration: 'none',
                  position: 'relative',
                  border: '1px solid rgba(0, 122, 255, 0.3)',
                  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(56, 189, 248, 0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '14px',
                      background: 'rgba(0, 122, 255, 0.2)', color: 'var(--accent-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <HardDrive size={22} />
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'rgba(0, 122, 255, 0.2)',
                      color: 'var(--accent-color)'
                    }}>
                      EXCLUSIVO CICLO ACTUAL ↗
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Prácticas en Drive (Ciclo en Curso)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Banco exclusivo en Drive con PDFs del ciclo actual en curso.
                  </p>
                </div>
              </motion.a>
            )}
          </div>

          {/* Week Selector Bar (When in Ciclo 2027) */}
          {bricenoTab === '2027' && (
            <div 
              className="glass-card" 
              style={{
                padding: '14px 20px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                background: 'var(--card-bg)'
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📅 Filtrar por Semana:
              </span>

              <button
                onClick={() => setSelectedWeek('all')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '14px',
                  border: 'none',
                  background: selectedWeek === 'all' ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.12)',
                  color: selectedWeek === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🌟 Todas las Semanas
              </button>

              {BRICENO_2027.map(w => (
                <button
                  key={w.num}
                  onClick={() => setSelectedWeek(w.num)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '14px',
                    border: 'none',
                    background: selectedWeek === w.num ? 'var(--accent-color)' : 'rgba(120, 120, 128, 0.12)',
                    color: selectedWeek === w.num ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {w.nombre} ({w.data?.length || 0} materias)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {data.type === 'esparta' && data.items.map((course, idx) => {
          if (query && !searchMatches([course.name, ...(course.lessons || []).map(l => l.title)], query)) return null;
          return (
            <details key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {(() => {
                    const icon = (course.slug && SUBJECT_ICONS[course.slug]) || getCourseSvgData(course.name);
                    return (
                      <div 
                        className="subject-icon-wrapper"
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          color: icon.color, 
                          background: `linear-gradient(135deg, ${icon.bg}, ${icon.color}1a)`,
                          border: `1.5px solid ${icon.color}35`,
                          borderRadius: '13px',
                          padding: '8px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: `0 4px 14px ${icon.color}20`,
                          flexShrink: 0
                        }}
                        dangerouslySetInnerHTML={{ __html: icon.svg }} 
                      />
                    );
                  })()}
                  <span>{course.name}</span>
                </div>
                <span style={{ fontSize: '0.9rem', background: 'rgba(0,122,255,0.1)', color: '#007aff', padding: '4px 12px', borderRadius: '20px' }}>{course.lessons.length} clases</span>
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {course.lessons.map((lesson, lIdx) => {
                  const url = lesson.url || `https://www.youtube.com/watch?v=${lesson.yt}`;
                  if (query && !searchMatches([course.name, lesson.title], query)) return null;
                  return (
                    <div key={lIdx} style={{ background: 'rgba(150,150,150,0.05)', padding: '12px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Clase {lesson.n}: {lesson.title || 'Clase'}</h4>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ff3b30', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                        <PlayCircle size={18} /> Ver en YouTube
                      </a>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}

        {data.type === 'kelsen' && (
          <div style={{ marginBottom: '24px' }}>
            <button 
              onClick={() => setIsKelsenHorarioOpen(!isKelsenHorarioOpen)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '12px 24px', 
                borderRadius: '16px', 
                color: 'var(--text-main)', 
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                cursor: 'pointer'
              }}
            >
              📅 {isKelsenHorarioOpen ? 'Ocultar Horario' : 'Ver Horario Oficial'}
            </button>
            
            <AnimatePresence>
              {isKelsenHorarioOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card"
                  style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', overflow: 'hidden' }}
                >
                  <img src="./assets/horario-kelsen.png" alt="Horario Kelsen" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {data.type === 'kelsen' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                📹 Clases Grabadas Oficiales ({data.items.filter(v => searchMatches([v.titulo], query)).length} videos)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {data.items
                .filter(vid => searchMatches([vid.titulo], query))
                .map((vid, vIdx) => (
                  <motion.div 
                    key={vIdx} 
                    whileHover={{ y: -3 }}
                    className="glass-card" 
                    style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'rgba(234, 67, 53, 0.12)',
                        color: '#EA4335',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <PlayCircle size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                          {vid.titulo}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Grabación Drive
                        </span>
                      </div>
                    </div>

                    <a 
                      href={vid.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '6px', 
                        padding: '10px 14px',
                        background: 'rgba(0, 122, 255, 0.1)',
                        color: 'var(--accent-color)', 
                        textDecoration: 'none', 
                        fontWeight: 700, 
                        fontSize: '0.85rem',
                        borderRadius: '12px',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <PlayCircle size={16} /> Abrir Grabación
                    </a>
                  </motion.div>
                ))}
            </div>

            {data.items.filter(v => searchMatches([v.titulo], query)).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No se encontraron clases para "{query}".
              </div>
            )}
          </div>
        )}

        {data.type === 'briceno' && (
          <>
            {bricenoTab === '2027' ? (
              BRICENO_2027
                .filter(weekItem => selectedWeek === 'all' || weekItem.num === selectedWeek)
                .map((weekItem, wIdx) => {
                  const filteredCourses = (weekItem.data || []).filter(subCat => {
                    return searchMatches([subCat.nombre, subCat.categoria, ...(subCat.videos || []).map(v => v.nombre)], query);
                  });

                  if (filteredCourses.length === 0) return null;

                  return (
                    <div key={`week-${wIdx}`} style={{ marginBottom: '36px' }}>
                      {/* Week Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '20px',
                        padding: '14px 20px',
                        borderRadius: '20px',
                        background: 'rgba(52, 199, 89, 0.12)',
                        border: '1px solid rgba(52, 199, 89, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {weekItem.nombre}
                          </h2>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            ({filteredCourses.length} cursos con clases)
                          </span>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: '#34C759',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {weekItem.status || 'Disponible'}
                        </span>
                      </div>

                      {/* Course Cards inside Week */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        {filteredCourses.map((subCat, sIdx) => {
                          const iconData = getCourseSvgData(subCat.nombre);
                          const filteredVideos = (subCat.videos || []).filter(v => 
                            searchMatches([v.nombre], query)
                          );

                          return (
                            <div
                              key={`course-${sIdx}`}
                              className="glass-card"
                              style={{
                                padding: '24px',
                                borderRadius: '24px',
                                border: '1px solid var(--card-border)'
                              }}
                            >
                              {/* Course Header with Custom SVG */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                                <div
                                  className="subject-icon-wrapper"
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    color: iconData.color,
                                    background: `linear-gradient(135deg, ${iconData.bg}, ${iconData.color}1a)`,
                                    border: `1.5px solid ${iconData.color}35`,
                                    borderRadius: '15px',
                                    padding: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 5px 16px ${iconData.color}22`,
                                    flexShrink: 0
                                  }}
                                  dangerouslySetInnerHTML={{ __html: iconData.svg }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                                      {subCat.nombre}
                                    </h3>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      padding: '3px 10px',
                                      borderRadius: '10px',
                                      background: 'rgba(0, 122, 255, 0.1)',
                                      color: 'var(--accent-color)'
                                    }}>
                                      {subCat.categoria}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {filteredVideos.length} clase{filteredVideos.length !== 1 ? 's' : ''} en video
                                  </span>
                                </div>
                              </div>

                              {/* Videos Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
                                {filteredVideos.map((vid, vIdx) => (
                                  <motion.a
                                    key={vIdx}
                                    href={vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                      background: 'rgba(120, 120, 128, 0.07)',
                                      border: '1px solid var(--card-border)',
                                      padding: '16px',
                                      borderRadius: '18px',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                    }}
                                  >
                                    <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.4 }}>
                                      {vid.nombre}
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF0000', fontWeight: 700, fontSize: '0.84rem' }}>
                                      <PlayCircle size={18} /> Ver en YouTube ↗
                                    </div>
                                  </motion.a>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            ) : (
              /* Ciclo Intensivo 2026 - Áreas con SVG */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {BRICENO_AREAS
                  .filter(category => searchMatches([category.nombre], query))
                  .map((category, idx) => {
                    const iconData = getCourseSvgData(category.nombre);
                    return (
                      <div
                        key={`2026-${idx}`}
                        className="glass-card"
                        style={{
                          padding: '24px',
                          borderRadius: '24px',
                          border: '1px solid var(--card-border)'
                        }}
                      >
                        {/* Area Header with SVG */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                          <div
                            className="subject-icon-wrapper"
                            style={{
                              width: '48px',
                              height: '48px',
                              color: iconData.color,
                              background: `linear-gradient(135deg, ${iconData.bg}, ${iconData.color}1a)`,
                              border: `1.5px solid ${iconData.color}35`,
                              borderRadius: '15px',
                              padding: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 5px 16px ${iconData.color}22`,
                              flexShrink: 0
                            }}
                            dangerouslySetInnerHTML={{ __html: iconData.svg }}
                          />
                          <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                              {category.nombre}
                            </h3>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {category.videos?.length || 0} clases intensivas en video
                            </span>
                          </div>
                        </div>

                        {/* Video Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
                          {category.videos?.map((vidUrl, vIdx) => (
                            <motion.a
                              key={vIdx}
                              href={vidUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              style={{
                                background: 'rgba(120, 120, 128, 0.07)',
                                border: '1px solid var(--card-border)',
                                padding: '16px',
                                borderRadius: '18px',
                                textDecoration: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '12px'
                              }}
                            >
                              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                Clase Intensiva {vIdx + 1} - {category.nombre}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF0000', fontWeight: 700, fontSize: '0.84rem' }}>
                                <PlayCircle size={18} /> Ver en YouTube ↗
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </section>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onSubmit={(data) => {
        console.log("Report from AcademyDetail:", data);
        setIsReportOpen(false);
        setIsSuccessOpen(true);
      }} />

      <SuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
        title="¡Reporte Enviado!" 
        message="Gracias por ayudar a mantener la comunidad libre de enlaces caídos." 
      />
    </div>
  );
};
