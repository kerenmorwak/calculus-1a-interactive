const chapterData = {};
const chapters = [
  'מה אנחנו עושים כאן, והישר הממשי',
  'סדרות ומושג הגבול',
  'טורים',
  'פונקציות',
  'הנגזרת',
  'טיילור',
  'פרק בונוס: פונקציות קמורות'
];
let chapter = Number(new URLSearchParams(location.search).get('chapter') || 1);
if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters.length) chapter = 1;
const el = (tag, cls, text) => { const node = document.createElement(tag); if(cls) node.className = cls; if(text) node.textContent = text; return node; };
const nav = document.querySelector('#chapters');
chapters.forEach((title, index) => {
  const number = index + 1;
  const link = el('a', `chapter-link${number === chapter ? ' active' : ''}`);
  link.href = `?chapter=${number}`;
  if(number === chapter) link.setAttribute('aria-current', 'page');
  link.append(el('span', 'chapter-number', String(number)));
  const label = el('span', 'chapter-name', title);
  label.append(el('span', 'status', chapterData[number] ? 'זמין לקריאה' : 'המשך יבוא'));
  link.append(label);nav.append(link);
});
document.title = `${chapters[chapter - 1]} | סיכומים בחדו״א 1א`;
const section = document.querySelector('#chapter');
const heading = el('header', 'chapter-heading chapter-hero');
const titles = el('div', 'chapter-hero-text');titles.append(el('p', 'chapter-kicker', `פרק ${chapter}`));
const title = el('h1', '', chapters[chapter - 1]);title.id = 'chapter-title';titles.append(title);heading.append(titles);section.append(heading);
const data = chapterData[chapter];
if(data) {
  const readingNote = chapter === 1
    ? 'קוראים מקטע מהרשימות, עונים על כמה שאלות קצרות, וממשיכים. כל סעיף שמסיימים פותח את הבא ומוסיף מטבעות.'
    : `${data.pages.length} עמודים. להגדלה, לחיפוש בטקסט או להדפסה אפשר לפתוח את קובץ ה־PDF.`;
  titles.append(el('p', 'chapter-lede', readingNote));
  titles.append(el('p', 'chapter-credit', 'על בסיס הרשימות של שירי ארטשטיין וירון אוסטרובר'));
  const actions = el('div', 'actions');
  const open = el('a', 'action', 'פתיחת PDF');open.href = data.pdf;open.target = '_blank';open.rel = 'noopener';
  const download = el('a', 'action primary', 'הורדת הפרק');download.href = data.pdf;download.download = `Chedva1_Chapter${chapter}.pdf`;
  actions.append(open, download);heading.append(actions);
  const contents = el('details', 'contents');contents.open = chapter !== 1;contents.append(el('summary', '', 'תוכן הפרק'));
  const links = el('nav', 'section-list');links.setAttribute('aria-label', `סעיפי פרק ${chapter}`);contents.append(links);if(data.sections.length) section.append(contents);
  data.sections.filter(item => item.level <= 3).forEach(item => {
    const a = el('a', item.level > 2 ? 'subsection' : '');a.href = `#page-${item.page}`;
    a.append(el('span', 'section-number', item.number), el('span', '', item.title));links.append(a);
  });
  const pages = el('div', 'pages');
  for(let i = 1; i <= data.pages.length; i++) {
    const figure = el('figure', 'page');figure.id = `page-${i}`;
    const lockedByDefault = chapter === 1 && i >= 4;
    if (lockedByDefault) {
      figure.hidden = true;
      figure.classList.add('page-locked');
      figure.setAttribute('aria-hidden', 'true');
    }
    const caption = el('figcaption');caption.append(el('span', '', `עמוד ${i}`));
    const link = el('a', '', 'פתיחה ב־PDF');link.href = `${data.pdf}#page=${i}`;link.target = '_blank';link.rel = 'noopener';caption.append(link);
    const img = el('img');
    if (lockedByDefault) img.dataset.src = data.pages[i - 1].src;
    else img.src = data.pages[i - 1].src;
    img.width = data.pages[i - 1].width;img.height = data.pages[i - 1].height;img.alt = `פרק ${chapter} — עמוד ${i}. הטקסט המלא זמין בקובץ PDF.`;img.loading = i < 3 ? 'eager' : 'lazy';img.decoding = 'async';
    figure.append(caption,img);pages.append(figure);
  }
  section.append(pages);
} else {
  const pending = el('div', 'pending');pending.append(el('span', 'pending-symbol', '…'),el('h3', '', 'המשך יבוא'),el('p', '', 'הפרק יתווסף לרשימות בהמשך.'));
  const back = el('a', 'action primary', 'לקריאת פרק 1');back.href = '?chapter=1';pending.append(back);section.append(pending);
}
