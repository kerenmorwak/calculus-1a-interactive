#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const jsonPath = path.join(rootDir, "docs", "question-bank.json");
const bank = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const skillTaxonomy = [
  { id: "course-orientation", label: "הקשר ולמידה", description: "הבחנה בין רקע, מוטיבציה וטענות מתמטיות שמותר להשתמש בהן." },
  { id: "mathematical-language", label: "שפה מתמטית", description: "ניסוח טענות, דיוק, ערך אמת והבחנה בין אינטואיציה להוכחה." },
  { id: "logic-quantifiers", label: "לוגיקה וכמתים", description: "גרירה, שקילות, שלילה, כמתים ודוגמאות נגדיות." },
  { id: "sets-operations", label: "קבוצות והכלות", description: "שייכות, הכלה, שוויון קבוצות, איחוד, חיתוך, הפרש ומשלים." },
  { id: "number-systems", label: "מערכות מספרים", description: "הבחנה בין קבוצות מספרים, רציונליים, אי־רציונליים והממשיים." },
  { id: "ordered-field", label: "שדה סדור", description: "פעולות שדה, סדר, כפל באי־שוויון ותכונות בסיסיות של R." },
  { id: "algebraic-manipulation", label: "מעבר אלגברי", description: "פירוקים, זהויות, העברת אגפים ושימוש נכון בחוקים אלגבריים." },
  { id: "archimedean-property", label: "ארכימדיות וערך שלם", description: "טבעיים לא חסומים, בחירת n מתאים וערך שלם." },
  { id: "density", label: "צפיפות", description: "צפיפות רציונליים ואי־רציונליים בין מספרים ממשיים." },
  { id: "irrationality", label: "אי־רציונליות", description: "הוכחות אי־רציונליות, בעיקר דרך זוגיות ושבר מצומצם." },
  { id: "bounds-extrema", label: "חסמים וקיצונים", description: "חסמים, מקסימום, מינימום וזיהוי קיומם." },
  { id: "supremum-infimum", label: "סופרמום ואינפימום", description: "הגדרות, אפיון אפסילוני וקשר למקסימום/מינימום." },
  { id: "completeness", label: "שלמות", description: "אקסיומת השלמות ושימוש בה לקיום סופרמום או שורשים." },
  { id: "absolute-value-inequalities", label: "ערך מוחלט ואי־שוויונות", description: "אי־שוויון המשולש, המשולש ההפוך ואומדנים עם ערך מוחלט." },
  { id: "finite-sums-binomial", label: "סכומים ובינום", description: "סכום הנדסי, בינום וכלים אלגבריים לסכומים סופיים." },
  { id: "proof-structure", label: "מבנה הוכחה", description: "בחירת צעד פתיחה, הצעד הבא בהוכחה, הוכחה בשלילה וזיהוי כשל." }
];

const sectionSkills = {
  "1.1": ["course-orientation", "mathematical-language"],
  "1.2": ["mathematical-language", "proof-structure"],
  "1.3": ["logic-quantifiers", "proof-structure"],
  "1.4": ["sets-operations", "proof-structure"],
  "1.5": ["number-systems", "absolute-value-inequalities"],
  "1.6": ["ordered-field", "completeness", "mathematical-language"],
  "1.6.1": ["ordered-field", "algebraic-manipulation"],
  "1.6.2": ["archimedean-property", "proof-structure"],
  "1.6.3": ["irrationality", "number-systems", "proof-structure"],
  "1.6.4": ["bounds-extrema", "proof-structure"],
  "1.6.5": ["completeness", "supremum-infimum"],
  "1.6.6": ["supremum-infimum", "bounds-extrema"],
  "1.6.7": ["completeness", "ordered-field", "proof-structure"],
  "1.6.8": ["density", "archimedean-property", "irrationality"],
  "1.6.9": ["absolute-value-inequalities", "finite-sums-binomial", "algebraic-manipulation"]
};

const topicSkills = [
  [/לוגיקה|כמת/, ["logic-quantifiers", "proof-structure"]],
  [/קבוצ/, ["sets-operations", "proof-structure"]],
  [/חסם|חסמים|מקסימום|מינימום/, ["bounds-extrema", "proof-structure"]],
  [/סופרמום|אינפימום/, ["supremum-infimum", "bounds-extrema"]],
  [/שלמות|שורש/, ["completeness", "ordered-field"]],
  [/ארכימד|צפיפות/, ["archimedean-property", "density"]],
  [/אי־רציונל|רציונליות|שרש שתיים/, ["irrationality", "number-systems"]],
  [/שדה סדור|שדה/, ["ordered-field", "algebraic-manipulation"]],
  [/אי־שווי|ערך מוחלט|אומדן/, ["absolute-value-inequalities", "algebraic-manipulation"]],
  [/סכומים|סדרה הנדסית|בינום/, ["finite-sums-binomial", "algebraic-manipulation"]]
];

const homeworkSkills = {
  "ch01-s069-homework-01": ["sets-operations"],
  "ch01-s069-homework-02": ["algebraic-manipulation", "proof-structure"],
  "ch01-s069-homework-03": ["absolute-value-inequalities", "proof-structure"],
  "ch01-s069-homework-04": ["bounds-extrema", "proof-structure"],
  "ch01-s069-homework-05": ["supremum-infimum", "bounds-extrema"],
  "ch01-s069-homework-06": ["supremum-infimum", "proof-structure"],
  "ch01-s069-homework-07": ["absolute-value-inequalities", "algebraic-manipulation"],
  "ch01-s069-homework-08": ["supremum-infimum", "proof-structure"]
};

const writingPracticeSkills = {
  "ch01-s04-writing-01": ["logic-quantifiers", "proof-structure"],
  "ch01-s04-writing-02": ["sets-operations", "proof-structure"],
  "ch01-s066-writing-01": ["bounds-extrema", "supremum-infimum", "proof-structure"],
  "ch01-s066-writing-02": ["supremum-infimum", "logic-quantifiers", "proof-structure"]
};

const reviewNotes = {};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferSkills(item) {
  if (writingPracticeSkills[item.id]) return writingPracticeSkills[item.id];
  if (homeworkSkills[item.id]) return homeworkSkills[item.id];
  if (item.kind === "finalQuiz") {
    const topic = item.topic || "";
    for (const [pattern, skills] of topicSkills) {
      if (pattern.test(topic)) return skills;
    }
  }
  return sectionSkills[item.section] || sectionSkills[item.unitId] || ["mathematical-language"];
}

function inferQuestionMode(item) {
  if (item.kind === "writingPractice") return "open-writing";
  const text = `${item.prompt || ""} ${item.feedback || ""}`;
  if (/דוגמה נגדית|מפריכה/.test(text)) return "counterexample";
  if (/צעד|שורה|כשל|טעות|מעבר/.test(text)) return "proof-step";
  if (/שלילה|שקולה|קונטרה|מתרגמת|סדר הכמתים|אינה חסומה|∀|∃|¬|∧|∨/.test(text)) return "conceptual-application";
  if (/מצאו|חשבו|נביט|נסמן|תהי|יהי|אם /.test(text)) return "application";
  if (/מה אומר|מהו|מהי|מה פירוש|איזה .*נקרא|באיזה תנאי/.test(text)) return "definition-check";
  return "conceptual-application";
}

function sourceForItem(item) {
  if (item.kind === "writingPractice") return { pool: "app-writing-practice", path: "docs/question-bank.json" };
  if (item.kind === "homework") return { pool: "app-homework", path: "docs/question-bank.json" };
  if (item.kind === "finalQuiz") return { pool: "app-final-quiz", path: "docs/question-bank.json" };
  return { pool: "app-checks", path: "docs/question-bank.json" };
}

bank.skillTaxonomy = skillTaxonomy;
bank.adaptivityPolicy = {
  currentState: "פרק 1 משתמש בשכבת בסיס, בוחן מסכם ותרגיל הגשה. חיזוק ואתגר עדיין לא ממומשים.",
  studentFacing: "לא מציגים לסטודנטית תווית רמה כללית; מציגים מפת מיומנויות ומה כדאי לחזק.",
  masteryModel: "בפיילוט משתמשים במעקב פשוט לפי מיומנות: ניסיון ראשון נכון בלי רמז=1, נכון אחרי רמז=0.5, טעות=0. בהמשך אפשר להחליף למודל מכויל אחרי שיצטברו נתונים.",
  layers: {
    base: "שאלות בסיס בנקודות בדיקת הבנה, חלק ממסלול ההתקדמות.",
    reinforcement: "שאלות חיזוק עתידיות על אותה מיומנות אחרי טעות.",
    challenge: "שאלות אתגר עתידיות שאינן נועלות התקדמות ומתגמלות במטבעות.",
    practice: "תרגול כתיבה פתוח שאינו נועל התקדמות ואינו נבדק כרגע.",
    assessment: "בוחן מסכם קבוע לכולם.",
    submission: "תרגיל הגשה פתוח."
  }
};

bank.items = bank.items.map((item) => {
  const review = reviewNotes[item.id];
  const source = sourceForItem(item);
  return {
    ...item,
    layer: item.kind === "finalQuiz" ? "assessment" : (item.kind === "homework" ? "submission" : (item.kind === "writingPractice" ? "practice" : "base")),
    questionMode: inferQuestionMode(item),
    skills: unique(inferSkills(item)),
    sourcePool: source.pool,
    sourcePath: source.path,
    reviewStatus: review ? "needs_rewrite" : (inferQuestionMode(item) === "definition-check" ? "review" : "ok"),
    qualityFlags: review ? [review[0]] : (inferQuestionMode(item) === "definition-check" ? ["definition_check"] : []),
    reviewNote: review ? review[1] : undefined
  };
});

fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Enriched ${bank.items.length} question-bank items with skills, layers, and review metadata.`);
