#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const jsonPath = path.join(rootDir, "docs", "question-bank.json");
const markdownPath = path.join(rootDir, "docs", "question-bank-audit.md");

const bank = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const items = Array.isArray(bank.items) ? bank.items : [];
const multipleChoiceItems = items.filter((item) => Array.isArray(item.options) && item.options.length);

const kindLabels = {
  check: "בדיקת הבנה",
  writingPractice: "תרגול כתיבה",
  finalQuiz: "קוויז סיכום",
  homework: "תרגיל הגשה"
};

const levelLabels = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה"
};

const modeLabels = {
  "definition-check": "בדיקת ניסוח/הגדרה",
  "conceptual-application": "יישום מושג",
  "proof-step": "צעד בהוכחה / מציאת טעות",
  application: "חישוב או החלטה על דוגמה",
  counterexample: "דוגמה נגדית",
  "open-writing": "כתיבה פתוחה"
};

const skillLabels = Object.fromEntries((bank.skillTaxonomy || []).map((skill) => [skill.id, skill.label || skill.id]));

function label(map, key) {
  return map[key] || key || "לא סומן";
}

function md(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tableCell(value) {
  return md(value).replace(/\|/g, "\\|");
}

function countBy(values) {
  const counts = new Map();
  values.forEach((value) => {
    const key = value || "לא סומן";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), "he"));
}

function percent(count, total) {
  if (!total) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function bySection() {
  const rows = [];
  const sections = countBy(items.map((item) => item.section)).map(([section]) => section);
  sections.forEach((section) => {
    const group = items.filter((item) => item.section === section);
    rows.push({
      section,
      total: group.length,
      easy: group.filter((item) => item.level === "easy").length,
      medium: group.filter((item) => item.level === "medium").length,
      hard: group.filter((item) => item.level === "hard").length,
      review: group.filter((item) => item.reviewStatus && item.reviewStatus !== "ok").length,
      modes: countBy(group.map((item) => label(modeLabels, item.questionMode))).map(([mode, count]) => `${mode}: ${count}`).join("; ")
    });
  });
  return rows;
}

function answerPositionStats() {
  const counts = { A: 0, B: 0, C: 0, D: 0, other: 0 };
  multipleChoiceItems.forEach((item) => {
    const correct = item.options.find((option) => option.correct);
    const label = correct?.label || (typeof correct?.index === "number" ? String.fromCharCode(65 + correct.index) : "other");
    if (Object.hasOwn(counts, label)) counts[label] += 1;
    else counts.other += 1;
  });
  return counts;
}

function longestAnswerStats() {
  let uniqueLongest = 0;
  let tiedLongest = 0;
  const flagged = [];
  multipleChoiceItems.forEach((item) => {
    const optionLengths = item.options.map((option) => ({
      label: option.label || String.fromCharCode(65 + Number(option.index || 0)),
      text: option.text || "",
      length: [...(option.text || "")].length,
      correct: Boolean(option.correct)
    }));
    const maxLength = Math.max(...optionLengths.map((option) => option.length));
    const correct = optionLengths.find((option) => option.correct);
    if (!correct || correct.length !== maxLength) return;
    const tied = optionLengths.filter((option) => option.length === maxLength).length > 1;
    if (tied) tiedLongest += 1;
    else {
      uniqueLongest += 1;
      flagged.push(item);
    }
  });
  return { uniqueLongest, tiedLongest, flagged };
}

function correctAnswerText(item) {
  const option = item.options?.find((candidate) => candidate.correct);
  return option ? `${option.label}. ${option.text}` : "";
}

function skillsText(item) {
  return (item.skills || []).map((skill) => skillLabels[skill] || skill).join(", ");
}

function renderCountsTable(title, rows) {
  return [
    `### ${title}`,
    "",
    "| קטגוריה | כמות |",
    "| --- | ---: |",
    ...rows.map(([name, count]) => `| ${tableCell(name)} | ${count} |`),
    ""
  ].join("\n");
}

function renderReviewQueue() {
  const reviewItems = items.filter((item) => item.reviewStatus && item.reviewStatus !== "ok");
  if (!reviewItems.length) return "אין כרגע פריטים שמסומנים לסקירה.\n";
  return [
    "| ID | סעיף | סוג | קושי | מיומנויות | סיבה | שאלה | תשובה נכונה |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...reviewItems.map((item) => {
      const reason = item.reviewNote || (item.qualityFlags || []).join(", ") || item.questionMode || "לסקירה";
      return `| ${tableCell(item.id)} | ${tableCell(item.section)} | ${tableCell(label(kindLabels, item.kind))} | ${tableCell(label(levelLabels, item.level))} | ${tableCell(skillsText(item))} | ${tableCell(reason)} | ${tableCell(item.prompt)} | ${tableCell(correctAnswerText(item))} |`;
    }),
    ""
  ].join("\n");
}

function renderSectionInventory() {
  return [
    "| סעיף | סך הכל | קל | בינוני | קשה | לסקירה | סוגי שאלות |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...bySection().map((row) => `| ${tableCell(row.section)} | ${row.total} | ${row.easy} | ${row.medium} | ${row.hard} | ${row.review} | ${tableCell(row.modes)} |`),
    ""
  ].join("\n");
}

function renderSkillInventory() {
  const rows = countBy(items.flatMap((item) => item.skills || []).map((skill) => skillLabels[skill] || skill));
  return [
    "| מיומנות | כמות פריטים |",
    "| --- | ---: |",
    ...rows.map(([skill, count]) => `| ${tableCell(skill)} | ${count} |`),
    ""
  ].join("\n");
}

function renderLongestAnswerFlags(limit = 40) {
  const { uniqueLongest, tiedLongest, flagged } = longestAnswerStats();
  const rows = flagged.slice(0, limit);
  const suffix = flagged.length > limit ? `\n\nמוצגים ${limit} מתוך ${flagged.length} פריטים שבהם התשובה הנכונה היא הארוכה ביותר באופן יחיד.` : "";
  return [
    `- תשובה נכונה היא האפשרות הארוכה ביותר באופן יחיד: ${uniqueLongest}/${multipleChoiceItems.length} (${percent(uniqueLongest, multipleChoiceItems.length)}).`,
    `- תשובה נכונה קשורה לאורך הארוך ביותר בתיקו: ${tiedLongest}/${multipleChoiceItems.length} (${percent(tiedLongest, multipleChoiceItems.length)}).`,
    "",
    "| ID | סעיף | קושי | שאלה | תשובה נכונה |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((item) => `| ${tableCell(item.id)} | ${tableCell(item.section)} | ${tableCell(label(levelLabels, item.level))} | ${tableCell(item.prompt)} | ${tableCell(correctAnswerText(item))} |`),
    suffix,
    ""
  ].join("\n");
}

function renderMarkdown() {
  const positionStats = answerPositionStats();
  const aOrB = positionStats.A + positionStats.B;
  const definitionChecks = items.filter((item) => item.questionMode === "definition-check");
  const writing = items.filter((item) => item.kind === "writingPractice" || item.kind === "homework");

  const lines = [
    "# ביקורת מאגר השאלות",
    "",
    "מסמך זה נוצר מתוך `docs/question-bank.json` בעזרת `node tools/audit_question_bank.mjs`.",
    "הוא מיועד לביקורת פדגוגית ולתיאום עבודה, ולא מחליף את הקובץ הקריא המלא `docs/question-bank.md`.",
    "",
    "> הערה: ה־PDF החיצוני של ביקורת המאגר הוא חומר עזר חשוב, אבל ייתכן שהוא מתאר ענף ישן יותר. כאן מוצג מצב המאגר בפועל ב־`main` בזמן יצירת הדוח.",
    "",
    "## תמונת מצב",
    "",
    `- סך הכל פריטים במאגר: ${items.length}.`,
    `- שאלות אמריקאיות: ${multipleChoiceItems.length}.`,
    `- פריטים פתוחים לכתיבה/הגשה: ${writing.length}.`,
    `- פריטים שמסומנים לסקירה: ${items.filter((item) => item.reviewStatus && item.reviewStatus !== "ok").length}.`,
    `- פריטים מסוג בדיקת ניסוח/הגדרה: ${definitionChecks.length}.`,
    "",
    renderCountsTable("לפי סוג", countBy(items.map((item) => label(kindLabels, item.kind)))),
    renderCountsTable("לפי קושי", countBy(items.map((item) => label(levelLabels, item.level)))),
    renderCountsTable("לפי מצב סקירה", countBy(items.map((item) => item.reviewStatus === "ok" ? "תקין" : "לסקירה"))),
    "## סיכוני איכות שצריך לטפל בהם",
    "",
    `1. **הטיית מיקום תשובה נכונה:** A=${positionStats.A}, B=${positionStats.B}, C=${positionStats.C}, D=${positionStats.D}. כלומר A/B הן ${aOrB}/${multipleChoiceItems.length} (${percent(aOrB, multipleChoiceItems.length)}). אם האתר לא מערבב אפשרויות בזמן ריצה, זו בעיית איכות חמורה.`,
    `2. **רמז אורך תשובה:** ב־${longestAnswerStats().uniqueLongest}/${multipleChoiceItems.length} שאלות התשובה הנכונה היא הארוכה ביותר באופן יחיד. גם אחרי ערבוב, כדאי לעבור על חלק מהמסיחים כדי שלא יהיה אפשר לנחש לפי אורך.`,
    `3. **שאלות זיהוי/הגדרה:** יש ${definitionChecks.length} שאלות מסוג זה. הן לא בהכרח פסולות, אבל כדאי לצמצם אותן או להפוך אותן ליישום, מציאת טעות, דוגמה נגדית או צעד בהוכחה.`,
    "4. **תרגול כתיבה והגשה:** כל ניסוח שמרמז על בדיקה אנושית או אוטומטית צריך להימחק עד שיש בדיקה אמיתית. אפשר לכתוב “כתבתי”, “השוואה לפתרון” או “תרגול כתיבה”.",
    "5. **סעיף 1.1:** זה כנראה סעיף קריאה/מוטיבציה. כדאי להחליט אם שאלות עליו בכלל צריכות לנעול התקדמות, או לעבור למצב העשרה לא נועל.",
    "",
    "## תור סקירה ידני",
    "",
    renderReviewQueue(),
    "## מלאי לפי סעיף",
    "",
    renderSectionInventory(),
    "## מלאי לפי מיומנות",
    "",
    renderSkillInventory(),
    "## בדיקת מיקום תשובה נכונה",
    "",
    "| אפשרות נכונה | כמות | אחוז מתוך שאלות אמריקאיות |",
    "| --- | ---: | ---: |",
    ...Object.entries(positionStats).filter(([key, count]) => key !== "other" || count > 0).map(([key, count]) => `| ${key} | ${count} | ${percent(count, multipleChoiceItems.length)} |`),
    "",
    "## בדיקת רמז אורך תשובה",
    "",
    renderLongestAnswerFlags(),
    "## סדר עבודה מומלץ",
    "",
    "1. לתקן ברמת קוד: ערבוב אפשרויות, תזמון הסברים אחרי טעות, וספירת טעויות בעברית.",
    "2. לנקות ניסוחים שמבטיחים בדיקה או העלאה לבדיקה כשאין בדיקה.",
    "3. לעבור על תור הסקירה הידני ולסמן כל פריט: מאושר, להפוך ליישום, למחוק, או להעביר להעשרה.",
    "4. אחרי האישור הפדגוגי, לעדכן את `docs/question-bank.json` ולהריץ `node tools/export_question_bank.mjs` וגם `node tools/audit_question_bank.mjs`.",
    ""
  ];

  return `${lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`;
}

fs.writeFileSync(markdownPath, renderMarkdown());
console.log(`Updated ${path.relative(rootDir, markdownPath)}`);
console.log(`Audited ${items.length} question-bank items.`);
