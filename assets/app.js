// ===========================================================
// RUMBO — comportamiento compartido
// ===========================================================

function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function slugToTitle(slug){
  return (COURSES[slug] && COURSES[slug].name) || slug;
}

// --- Grid de materias (usado en index.html y cursos.html) ---
function renderSubjectGrid(targetSelector, opts){
  const target = document.querySelector(targetSelector);
  if(!target) return;
  const query = (opts && opts.filter) ? opts.filter.toLowerCase() : '';
  target.innerHTML = '';
  COURSE_ORDER.forEach(slug => {
    const c = COURSES[slug];
    if(query && !c.name.toLowerCase().includes(query)) return;
    const a = document.createElement('a');
    a.href = 'curso.html?c=' + slug;
    a.className = 'subject-card';
    a.innerHTML = `
      <div class="emoji">${c.icon}</div>
      <div class="name">${c.name}</div>
      <span class="count">${c.lessons.length} clases</span>
    `;
    target.appendChild(a);
  });
  if(query && target.children.length === 0){
    target.innerHTML = '<p style="grid-column:1/-1;color:var(--muted);text-align:center;padding:20px 0;">No se encontraron materias con ese nombre.</p>';
  }
}

function initCoursesSearch(){
  const input = document.querySelector('#course-search');
  if(!input) return;
  input.addEventListener('input', () => {
    renderSubjectGrid('#subject-grid', { filter: input.value.trim() });
  });
}

// --- Página de curso individual ---
// Los videos son privados de YouTube: no se pueden reproducir dentro de un
// <iframe> (YouTube lo bloquea sin importar el sitio). Por eso cada clase
// es un enlace directo que abre el video en una pestaña nueva de YouTube.
function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function initCoursePage(){
  const list = document.querySelector('#lesson-list');
  if(!list) return;

  const slug = getQueryParam('c');
  const course = COURSES[slug];

  if(!course){
    document.querySelector('#course-content').innerHTML =
      '<div class="coming-soon"><h2>No encontramos ese curso</h2><p>Vuelve a <a href="cursos.html">todos los cursos</a> y elige una materia.</p></div>';
    document.querySelector('#course-title').textContent = 'Curso no encontrado';
    return;
  }

  document.title = course.name + ' · RUMBO';
  document.querySelector('#course-emoji').textContent = course.icon;
  document.querySelector('#course-title').textContent = course.name;
  const crumb = document.querySelector('#course-title-crumb');
  if(crumb) crumb.textContent = course.name;
  document.querySelector('#course-sub').textContent = course.lessons.length + ' clases en video';

  list.innerHTML = '';
  course.lessons.forEach((lesson) => {
    const item = document.createElement('a');
    item.className = 'lesson-card';
    item.href = lesson.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.innerHTML = `
      <span class="n">${lesson.n}</span>
      <span class="lesson-card-title">Clase ${lesson.n}</span>
      <span class="lesson-card-go">Ver clase ↗</span>
    `;
    list.appendChild(item);
  });
}

function setActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .bottom-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  setActiveNav();
  if(typeof COURSES !== 'undefined'){
    renderSubjectGrid('#subject-grid');
    initCoursesSearch();
    initCoursePage();
  }
});
