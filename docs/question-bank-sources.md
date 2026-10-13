# מפת מאגרי שאלות

המסמך הזה מפריד בין מה ששייך לגיט של האפליקציה לבין מאגרי מקור כבדים שנשארים מחוץ לגיט.

## בתוך הגיט

### מאגר האפליקציה

- קובץ מקור: `docs/question-bank.json`
- קובץ קריא לביקורת: `docs/question-bank.md`
- דוח ביקורת וסיכוני איכות: `docs/question-bank-audit.md`
- כלי ייצוא: `tools/export_question_bank.mjs`
- כלי ביקורת: `tools/audit_question_bank.mjs`
- כלי העשרת מטא־דאטה: `tools/enrich_question_bank_metadata.mjs`
- תכנון פדגוגי: `docs/learning-design-plan.md`
- סך הכול: 146 פריטים
- בדיקות הבנה: 120
- תרגול כתיבה פתוח: 4
- קוויז סיכום: 14
- תרגיל הגשה: 8

זהו המאגר שהאתר טוען בפועל בזמן ריצה. הוא כולל רמת קושי, שכבה, מיומנויות, מצב סקירה ומקור פנימי.
סעיף 1.3 חוזק במיוחד: המאגר שלו כולל 12 שאלות על כמתים, שלילות, קונטרה־פוזיטיב וטעויות הוכחה, אבל ניסיון רגיל עדיין מציג רק את מספר השאלות שהוגדר במסלול.
בנוסף נוספו שני בלוקי תרגול כתיבה פתוחים אחרי 1.4 ואחרי 1.6.6. הם אינם נבדקים ואינם נועלים התקדמות.

## מחוץ לגיט

### מאגר מבחנים

- נתיב: `../output/bank_packages/2026-10-13/exams_bank`
- גודל משוער: 166MB
- 43 מבחנים
- 175 הופעות שאלות
- 174 רשומות שאלה אחרי איחוד נוסחים זהים
- קובצי נתונים עיקריים:
  - `data/questions.json`
  - `data/occurrences.json`
  - `data/catalog.csv`
  - `data/topic_memberships.csv`
  - `data/review_queue.csv`
  - `data/audit.json`
- נכסים כבדים שלא מכניסים לגיט:
  - `sources/`
  - `source_images/`

### מאגר שיעורי בית

- נתיב: `../output/bank_packages/2026-10-13/homework_bank`
- גודל משוער: 5.8MB
- 14 הקשרים מקוריים
- 173 הופעות שאלות
- 158 רשומות שאלה אחרי איחוד נוסחים זהים
- 92 הופעות עם פתרון שחולץ
- קובצי נתונים עיקריים:
  - `data/questions.json`
  - `data/occurrences.json`
  - `data/catalog.csv`
  - `data/topic_memberships.csv`
  - `data/review_queue.csv`
  - `data/audit.json`
- נכסים כבדים שלא מכניסים לגיט:
  - `sources/`
  - `solutions/`

## למה לא ZIP בתוך הגיט

אפשר ליצור ZIP לשיתוף, אבל לא כדאי לשמור אותו בתוך Git. ZIP הוא קובץ בינארי גדול: כל שינוי קטן יוצר בפועל גרסה כבדה חדשה, אי אפשר לעשות עליו review נוח, והוא מנפח את ההיסטוריה של הריפו.

אם צריך לשלוח את המאגר המלא, עדיף לשמור ZIP כ־GitHub Release asset, ב־Google Drive, או בתיקיית `output` המקומית. בגיט של האפליקציה נשמור רק את המיפוי, קבצי הנתונים הקלים שנדרשים לריצה, וכלים שמסבירים איך לשחזר.

## תהליך עבודה

1. עורכים את `docs/question-bank.json`.
2. מריצים `node tools/enrich_question_bank_metadata.mjs` כדי לוודא שיש מיומנויות ושכבות.
3. מריצים `node tools/export_question_bank.mjs` כדי לרענן את `docs/question-bank.md`.
4. מריצים `node tools/audit_question_bank.mjs` כדי לרענן את דוח הביקורת `docs/question-bank-audit.md`.
5. מריצים `python build_notes.py` כדי להעתיק את המאגר המעודכן ל־`_site/docs/question-bank.json`.

שאלות מהמבחנים ומשיעורי הבית לא נכנסות אוטומטית למסלול הלמידה. מכניסים אותן רק אחרי בחירה וסידור לפי מיומנות, רמת קושי ושכבה: בסיס, חיזוק, אתגר, הערכה או הגשה.
