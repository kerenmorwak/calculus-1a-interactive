-- Avatar catalogue only. Safe to run on an existing project at any time:
-- it adds new avatars and updates existing ones without touching tables,
-- policies or user data. Ids must match learnerAvatars in interactive.js.

insert into public.avatars (id, display_name, symbol, accent, description, sort_order)
values
  ('noether', 'אמי נתר', 'N', 'algebra', 'מבנים וסימטריות', 10),
  ('gauss', 'גאוס', 'Σ', 'sum', 'סדר וחישוב', 20),
  ('germain', 'סופי ז׳רמן', 'S', 'prime', 'ראשוניות ואומץ', 30),
  ('cauchy', 'קושי', 'ε', 'epsilon', 'דיוק וגבולות', 40),
  ('kovalevskaya', 'סופיה קובלבסקיה', '∂', 'partial', 'משוואות ונגזרות', 50),
  ('riemann', 'רימן', 'ζ', 'zeta', 'מרחב ופונקציות', 60),
  ('hypatia', 'היפטיה', 'H', 'classic', 'למידה וסקרנות', 70),
  ('euler', 'אוילר', 'e', 'euler', 'טורים וקבועים', 80),
  ('cantor', 'קנטור', 'ℵ', 'infinity', 'קבוצות ואינסוף', 90),
  ('archimedes', 'ארכימדס', 'π', 'archimedes', 'קירוב ומדידה', 100),
  ('weierstrass', 'ויירשטראס', 'δ', 'delta', 'פורמליות נקייה', 110),
  ('dedekind', 'דדקינד', 'ℝ', 'dedekind', 'חתכים והממשיים', 120)
on conflict (id) do update set
  display_name = excluded.display_name,
  symbol = excluded.symbol,
  accent = excluded.accent,
  description = excluded.description,
  sort_order = excluded.sort_order;
