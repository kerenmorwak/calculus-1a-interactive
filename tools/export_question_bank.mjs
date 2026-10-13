#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const jsonPath = path.join(rootDir, "docs", "question-bank.json");
const markdownPath = path.join(rootDir, "docs", "question-bank.md");

const bank = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const levelLabels = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה"
};

const kindLabels = {
  check: "בדיקת הבנה",
  writingPractice: "תרגול כתיבה",
  finalQuiz: "קוויז סיכום",
  homework: "תרגיל הגשה"
};

const levels = ["easy", "medium", "hard"];
const kinds = ["check", "writingPractice", "finalQuiz", "homework"];
const items = Array.isArray(bank.items) ? bank.items : [];
const layerLabels = {
  base: "בסיס",
  reinforcement: "חיזוק",
  challenge: "אתגר",
  practice: "תרגול",
  assessment: "הערכה",
  submission: "הגשה"
};
const reviewLabels = {
  ok: "תקין",
  review: "לסקירה",
  needs_rewrite: "לכתיבה מחדש"
};
const skillLabels = Object.fromEntries((bank.skillTaxonomy || []).map((skill) => [skill.id, skill.label || skill.id]));

function countWhere(predicate) {
  return items.filter(predicate).length;
}

function countBy(values) {
  const counts = {};
  values.forEach((value) => {
    if (!value) return;
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
}

bank.source = "docs/question-bank.json";
bank.note = "Runtime source for the interactive questions. Edit this JSON, then run `node tools/export_question_bank.mjs` to refresh the readable Markdown review file.";
bank.summary = {
  total: items.length,
  byLevel: Object.fromEntries(levels.map((level) => [levelLabels[level], countWhere((item) => item.level === level)])),
  byKind: Object.fromEntries(kinds.map((kind) => [kindLabels[kind], countWhere((item) => item.kind === kind)])),
  byLayer: countBy(items.map((item) => layerLabels[item.layer] || item.layer)),
  byReviewStatus: countBy(items.map((item) => reviewLabels[item.reviewStatus] || item.reviewStatus)),
  bySkill: countBy(items.flatMap((item) => item.skills || []).map((skill) => skillLabels[skill] || skill))
};

function mdEscape(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim();
}

function renderOptions(item) {
  if (!item.options?.length) return "";
  return item.options
    .slice()
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((option) => {
      const label = option.label || String.fromCharCode(65 + Number(option.index || 0));
      const marker = option.correct ? " ← תשובה נכונה" : "";
      return `  ${label}. ${mdEscape(option.text)}${marker}`;
    })
    .join("\n");
}

function renderItem(item) {
  const lines = [
    `#### ${item.id}`,
    "",
    `- סוג: ${item.kindLabel || kindLabels[item.kind] || item.kind}`,
    `- שכבה: ${layerLabels[item.layer] || item.layer || ""}`,
    `- יחידה: ${item.section || ""} · ${item.unitTitle || ""}`,
    `- נושא: ${item.topic || item.unitTitle || ""}`,
    `- מיומנויות: ${(item.skills || []).map((skill) => skillLabels[skill] || skill).join(", ") || "לא תויג"}`,
    `- מצב סקירה: ${reviewLabels[item.reviewStatus] || item.reviewStatus || "לא סומן"}`,
    `- רמת קושי: ${item.levelLabel || levelLabels[item.level] || item.level} (${item.difficulty ?? ""})`,
    "",
    `שאלה: ${mdEscape(item.prompt)}`
  ];

  if (item.tex) {
    lines.push("", "נוסחה:", "", "```tex", String(item.tex).trim(), "```");
  }

  if (item.options?.length) {
    lines.push("", "אפשרויות:", "```text", renderOptions(item), "```");
  }

  const correctOption = item.correctOption || item.options?.find((option) => option.correct)?.label;
  if (correctOption) lines.push("", `תשובה נכונה: ${correctOption}`);
  if (item.feedback) lines.push("", `משוב: ${mdEscape(item.feedback)}`);
  if (item.hint) lines.push("", `רמז (${item.hintCost ?? 5} מטבעות): ${mdEscape(item.hint)}`);
  if (item.reviewNote) lines.push("", `הערת סקירה: ${mdEscape(item.reviewNote)}`);

  return `${lines.join("\n")}\n`;
}

function renderMarkdown() {
  const reviewItems = items.filter((item) => item.reviewStatus && item.reviewStatus !== "ok");
  const lines = [
    "# מאגר שאלות",
    "",
    "הקובץ הקריא הזה נוצר מתוך `docs/question-bank.json` בעזרת `node tools/export_question_bank.mjs`.",
    "כדי לשנות שאלה בפועל, ערכו את ה־JSON ואז הריצו מחדש את הסקריפט.",
    "",
    "## סיכום",
    "",
    `- סך הכול פריטים: ${bank.summary.total}`,
    ...Object.entries(bank.summary.byKind).map(([kind, count]) => `- ${kind}: ${count}`),
    ...Object.entries(bank.summary.byLevel).map(([level, count]) => `- ${level}: ${count}`),
    ...Object.entries(bank.summary.byLayer).map(([layer, count]) => `- שכבת ${layer}: ${count}`),
    ...Object.entries(bank.summary.byReviewStatus).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## מיומנויות",
    "",
    ...Object.entries(bank.summary.bySkill).map(([skill, count]) => `- ${skill}: ${count}`),
    "",
    "## חלוקת קושי",
    "",
    `- בדיקות הבנה: ${bank.difficultyPolicy?.checks || "קל 1-2, בינוני 3-5, קשה 6+."}`,
    `- תרגול כתיבה: ${bank.difficultyPolicy?.writingPractice || "בינוני-קשה, לפי נקודת הקריאה."}`,
    `- קוויז סיכום: ${bank.difficultyPolicy?.finalQuiz || "קל 1-4, בינוני 5-10, קשה 11+."}`,
    `- תרגיל הגשה: ${bank.difficultyPolicy?.homework || "קל 1-2, בינוני 3-5, קשה 6-8."}`,
    ""
  ];

  if (reviewItems.length) {
    lines.push("## שאלות לסקירה", "");
    reviewItems.forEach((item) => {
      const note = item.reviewNote ? ` — ${mdEscape(item.reviewNote)}` : "";
      lines.push(`- ${item.id}: ${reviewLabels[item.reviewStatus] || item.reviewStatus}${note}`);
    });
    lines.push("");
  }

  levels.forEach((level) => {
    lines.push(`## ${levelLabels[level]}`, "");
    kinds.forEach((kind) => {
      const group = items.filter((item) => item.level === level && item.kind === kind);
      if (!group.length) return;
      lines.push(`### ${kindLabels[kind]}`, "");
      group.forEach((item) => lines.push(renderItem(item)));
    });
  });

  return `${lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`;
}

fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
fs.writeFileSync(markdownPath, renderMarkdown());

console.log(`Updated ${path.relative(rootDir, jsonPath)}`);
console.log(`Updated ${path.relative(rootDir, markdownPath)}`);
console.log(`Exported ${items.length} question-bank items.`);
