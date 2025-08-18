  import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Download, Upload, History, Settings, Sparkles, Plus, Trash2 } from "lucide-react";




// -----------------------------
// CONFIG: Actions & Points (defaults)
// -----------------------------
const DEFAULT_ACTIONS = [
  { id: "pomodoro", label: "Pomodoro complet", points: 5, extraFlags: ["sansDistraction"] },
  { id: "pomo2", label: "2 Pomodoros consécutifs", points: 12 },
  { id: "pomo4", label: "4 Pomodoros consécutifs", points: 25 },
  { id: "ping", label: "Séance de ping-pong complète", points: 15 },
  { id: "homefit", label: "Programme physique maison complet", points: 10 },
  { id: "roadmap", label: "Nouvelle case roadmap / projet", points: 10 },
  { id: "symfony", label: "Leçon Symfony terminée", points: 10 },
  { id: "english5", label: "5 mots d’anglais appris", points: 5 },
  { id: "menage", label: "Tâche quotidienne / ménagère", points: 10 },
  { id: "revision", label: "Révision de cours", points: 10 },
  { id: "revisionAhead", label: "Révision de cours en avance", points: 15 },
  { id: "defi", label: "Défi spécial réussi", points: 25 }, // milieu de fourchette 20-30
];

// Level titles for key levels
const LEVEL_TITLES = {
  1: "Novice du Jeu de Vie",
  5: "Explorateur Curieux",
  10: "Apprenti Motivé",
  20: "Concentré Émérite",
  30: "Maître du Focus",
  40: "Stratège Quotidien",
  50: "Expert de la Productivité",
  60: "Champion du Pomodoro",
  75: "Super Ping & Polyglotte",
  90: "Grand Maître de la Vie",
  100: "Légende Vivante",
};

// -----------------------------
// Helpers
// -----------------------------
function fmtDate(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generate level thresholds: Level 1 -> 0 XP, Level 2 -> 50, then +10% each level
function makeLevelThresholds(maxLevel = 150) {
  const thresholds = [0]; // index 0 unused, but keep 0 for level 1
  thresholds[1] = 0; // Level 1 cumulative xp
  thresholds[2] = 50; // Level 2 cumulative xp
  for (let lvl = 3; lvl <= maxLevel; lvl++) {
    const prev = thresholds[lvl - 1];
    const inc = Math.round((thresholds[lvl - 1] - thresholds[lvl - 2]) * 1.1);
    thresholds[lvl] = prev + Math.max(1, inc);
  }
  return thresholds;
}

const LEVEL_THRESHOLDS = makeLevelThresholds(200);

function levelFromXP(xp) {
  // Find greatest level with threshold <= xp
  let lvl = 1;
  for (let i = 2; i < LEVEL_THRESHOLDS.length; i++) {
    if (LEVEL_THRESHOLDS[i] <= xp) lvl = i; else break;
  }
  return lvl;
}

function titleForLevel(lvl) {
  // closest key not exceeding lvl
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a,b)=>a-b);
  let t = LEVEL_TITLES[1];
  for (const k of keys) if (k <= lvl) t = LEVEL_TITLES[k];
  return t;
}

// -----------------------------
// Default settings for ambiguous badge thresholds
// (editable in the Settings tab)
// -----------------------------
const DEFAULT_SETTINGS = {
  codeMasterLessons: 10, // Code Master when >= this many Symfony lessons
  regulariteDaysNeeded: 5, // Régularité badge when days with 6+ actions >= this
};

// -----------------------------
// Main App
// -----------------------------
export default function App() {

  // 🔥 Actions : désormais dans le state (modifiable & sauvegardé)
  const [actions, setActions] = useState(() => load("vg_actions", DEFAULT_ACTIONS));
  // Nettoie la liste des badges notifiés à chaque changement d'actions (pour ne garder que ceux qui existent encore)
  const [entries, setEntries] = useState(() => load("vg_entries", []));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load("vg_settings", {}) }));
  // Badges personnalisés ajoutés par l'utilisateur
  const [customBadges, setCustomBadges] = useState(() => load("vg_custom_badges", []));
  useEffect(() => save("vg_custom_badges", customBadges), [customBadges]);
  const firstActionId = actions.length ? actions[0].id : "";
  const [form, setForm] = useState({ date: fmtDate(new Date()), actionId: firstActionId, notes: "", sansDistraction: false });

  // Formulaire local pour création de badge personnalisé
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeMode, setNewBadgeMode] = useState("manual"); // manual | auto
  const [newBadgeKind, setNewBadgeKind] = useState("action_count");
  const [newBadgeActionId, setNewBadgeActionId] = useState(firstActionId);
  const [newBadgeCount, setNewBadgeCount] = useState(1);
  const [newBadgeXP, setNewBadgeXP] = useState(100);
  const [newBadgeDays, setNewBadgeDays] = useState(4);
  const [newBadgeWeeks, setNewBadgeWeeks] = useState(3);
  const [newBadgeStreak, setNewBadgeStreak] = useState(3);
  const [newBadgeWeeklyXP, setNewBadgeWeeklyXP] = useState(50);
  const [newBadgeDistinctActionsCount, setNewBadgeDistinctActionsCount] = useState(3);
  const [newBadgeComboActionId2, setNewBadgeComboActionId2] = useState(firstActionId);
  const [newBadgeComboActionIds, setNewBadgeComboActionIds] = useState([firstActionId]);
  const [newBadgeMonthsCount, setNewBadgeMonthsCount] = useState(2);
  const [newBadgeMonthlyCount, setNewBadgeMonthlyCount] = useState(10);
  const [newBadgeComboDays, setNewBadgeComboDays] = useState(1);
  const [newBadgeDistinctDays, setNewBadgeDistinctDays] = useState(1);
  const [showDistinctTooltip, setShowDistinctTooltip] = useState(false);

  useEffect(() => save("vg_entries", entries), [entries]);
  useEffect(() => save("vg_settings", settings), [settings]);
  useEffect(() => save("vg_actions", actions), [actions]);


  // Si l'action sélectionnée n'existe plus (supprimée), basculer sur la 1ère
  useEffect(() => {
    if (!actions.find(a => a.id === form.actionId)) {
      setForm(f => ({ ...f, actionId: actions[0]?.id || "" }));
    }
  }, [actions]);

  // -----------------------------
  // Gestion des actions (CRUD)
  // -----------------------------
  function addAction(label, points) {
    const cleanLabel = String(label || "").trim();
    const numPoints = Number(points);
    if (!cleanLabel || Number.isNaN(numPoints)) return;
    const newAction = { id: crypto.randomUUID(), label: cleanLabel, points: numPoints };
    setActions(a => [...a, newAction]);
  }

  function updateAction(id, newLabel, newPoints) {
    setActions(a => a.map(act => act.id === id ? { ...act, label: newLabel, points: Number(newPoints) } : act));
  }

  function removeAction(id) {
    setActions(a => a.filter(act => act.id !== id));
  }

  // -----------------------------
  // Group entries by date
  // -----------------------------
  const byDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      const d = e.date;
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [entries]);

  // -----------------------------
  // Daily totals + bonuses
  // -----------------------------
  const daily = useMemo(() => {
    const dates = Object.keys(byDate).sort();
    const result = [];
    let consecutiveAny = 0; // streak of consecutive days with >=1 action
    let lastDate = null;

    // Helper to check date continuity
    const addDays = (dateStr, n) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + n);
      return fmtDate(d);
    };

    let consecutiveSixPlus = 0; // for Champion des Bonus badge

    for (const d of dates) {
      const items = byDate[d];
      const base = items.reduce((acc, it) => acc + it.points, 0);
      const count = items.length;

      // Continuity (if previous day exists exactly one day before)
      if (!lastDate || addDays(lastDate, 1) !== d) {
        consecutiveAny = 0; // reset if gap
        consecutiveSixPlus = 0;
      }
      lastDate = d;

      let bonus = 0;
      // Bonus: 6 actions or more in a day -> +10
      if (count >= 6) {
        bonus += 10;
        consecutiveSixPlus += 1;
      } else {
        consecutiveSixPlus = 0;
      }
      // Bonus: 3 consecutive days with at least 1 action -> +10 on day 3 (and each additional multiple of 3)
      if (count >= 1) {
        consecutiveAny += 1;
        if (consecutiveAny % 3 === 0) bonus += 10;
        // Bonus: 7 consecutive days -> +25 on day 7 (and each additional multiple of 7)
        if (consecutiveAny % 7 === 0) bonus += 25;
      } else {
        consecutiveAny = 0;
      }

      result.push({ date: d, count, base, bonus, total: base + bonus, consecutiveAny, consecutiveSixPlus });
    }
    return result;
  }, [byDate]);

  const totalXP = useMemo(() => daily.reduce((s, d) => s + d.total, 0), [daily]);
  const lvl = useMemo(() => levelFromXP(totalXP), [totalXP]);
  const nextLvl = Math.min(lvl + 1, LEVEL_THRESHOLDS.length - 1);
  const currentTitle = titleForLevel(lvl);
  const xpInLevel = totalXP - LEVEL_THRESHOLDS[lvl];
  const xpForNext = Math.max(0, LEVEL_THRESHOLDS[nextLvl] - LEVEL_THRESHOLDS[lvl]);
  const progressPct = xpForNext === 0 ? 1 : Math.min(1, xpInLevel / xpForNext);

  // Stats for badges
  const countById = useMemo(() => {
    const m = {};
    for (const e of entries) m[e.actionId] = (m[e.actionId] || 0) + 1;
    return m;
  }, [entries]);

  const weeksWith = (actionId) => {
    // Count distinct ISO weeks that contain the given action
    const set = new Set();
    for (const e of entries.filter(x => x.actionId === actionId)) {
      const dt = new Date(e.date);
      const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      // ISO week number
      const dayNum = (tmp.getUTCDay() + 6) % 7;
      tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
      const firstThursday = new Date(tmp.getUTCFullYear(), 0, 4);
      const week = 1 + Math.round(((tmp - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
      set.add(`${dt.getFullYear()}-W${String(week).padStart(2, "0")}`);
    }
    return set.size;
  };

  const daysWith6Plus = daily.filter(d => d.count >= 6).length;
  const championDesBonus = daily.some((_, i, arr) => {
    if (i < 3) return false; // need 4 days window
    let ok = true;
    for (let k = 0; k < 4; k++) if (arr[i - k].count < 6) ok = false;
    return ok;
  });

  // Badges spéciaux (inchangés)
  const specialBadges = [
    { id: "concentre", name: "Concentré", cond: "1 Pomodoro sans distraction", ok: entries.some(e => e.actionId === "pomodoro" && e.sansDistraction) },
    { id: "marathonien", name: "Marathonien", cond: "4 Pomodoros consécutifs", ok: (countById["pomo4"] || 0) >= 1 },
    { id: "superping", name: "Super Ping", cond: "3 semaines ping-pong", ok: weeksWith("ping") >= 3 },
    { id: "forcemaison", name: "Force Maison", cond: "3 semaines programme maison", ok: weeksWith("homefit") >= 3 },
    { id: "codemaster", name: "Code Master", cond: `≥ ${settings.codeMasterLessons} leçons Symfony`, ok: (countById["symfony"] || 0) >= settings.codeMasterLessons },
    { id: "polyglotte", name: "Polyglotte", cond: "50 mots anglais", ok: ((countById["english5"] || 0) * 5) >= 50 },
    { id: "regularite", name: "Régularité", cond: `≥ ${settings.regulariteDaysNeeded} jours avec 6+ actions`, ok: daysWith6Plus >= settings.regulariteDaysNeeded },
    { id: "matinee", name: "Matinée Parfaite", cond: "Avant midi (marque manuelle)", ok: entries.some(e => e.beforeNoon) },
    { id: "multitask", name: "Multi-Tasker", cond: "3 types d’actions en 1 jour", ok: (function(){
      for (const d of Object.keys(byDate)) {
        const set = new Set(byDate[d].map(x=>x.actionId));
        if (set.size >= 3) return true;
      }
      return false;
    })() },
    { id: "marathonMensuel", name: "Marathon Mensuel", cond: "100 Pomodoros en 1 mois", ok: (function(){
      const map = {};
      for (const e of entries) {
        const ym = e.date.slice(0,7);
        const add = e.actionId === "pomodoro" ? 1 : e.actionId === "pomo2" ? 2 : e.actionId === "pomo4" ? 4 : 0;
        map[ym] = (map[ym]||0) + add;
      }
      return Object.values(map).some(v => v >= 100);
    })() },
    { id: "creatif", name: "Créatif", cond: "Nouvelle case roadmap/projet", ok: (countById["roadmap"] || 0) >= 1 },
    { id: "lecture", name: "Lecture Éclair", cond: "Livre ou 5 chapitres/sem.", ok: false },
    { id: "polyvalent", name: "Polyvalent", cond: "Sport+études+ménages en 1 jour", ok: (function(){
      for (const d of Object.keys(byDate)) {
        const a = byDate[d].map(x=>x.actionId);
        const hasSport = a.includes("ping") || a.includes("homefit");
        const hasEtudes = a.includes("pomodoro") || a.includes("pomo2") || a.includes("pomo4") || a.includes("revision") || a.includes("revisionAhead") || a.includes("symfony");
        const hasMenage = a.includes("menage");
        if (hasSport && hasEtudes && hasMenage) return true;
      }
      return false;
    })() },
    { id: "planificateur", name: "Planificateur", cond: "7 jours planning suivis", ok: (function(){
      return daily.some(d => d.consecutiveAny >= 7);
    })() },
    { id: "championBonus", name: "Champion des Bonus", cond: "4 jours d’affilée avec 6+ actions", ok: championDesBonus },
    { id: "defiSupreme", name: "Défi Suprême", cond: "Défi spécial difficile", ok: (countById["defi"] || 0) >= 1 },
    { id: "legende", name: "Légende Vivante", cond: "Atteindre le niveau 100", ok: lvl >= 100 },
  ];

  // Paliers de badges pour chaque action
  const badgeLevels = [
    { count: 1, label: "Débutant" },
    { count: 3, label: "Apprenti" },
    { count: 5, label: "Confirmé" },
    { count: 10, label: "Expert" },
    { count: 20, label: "Maître" },
    { count: 50, label: "Légende" },
    { count: 75, label: "Héros" },
    { count: 100, label: "Immortel" },
  ];

  // Évaluer un badge personnalisé automatique
  function evaluateCustomBadge(badge) {
    // retourne { ok: boolean, cond: string }
    const totalXPVal = totalXP;
    const countByIdLocal = countById;
    const daysWith6 = daysWith6Plus;
    const byDateLocal = byDate;
    const weeksWithLocal = (id) => {
      const set = new Set();
      for (const e of entries.filter(x => x.actionId === id)) {
        const dt = new Date(e.date);
        const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
        const dayNum = (tmp.getUTCDay() + 6) % 7;
        tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
        const firstThursday = new Date(tmp.getUTCFullYear(), 0, 4);
        const week = 1 + Math.round(((tmp - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
        set.add(`${dt.getFullYear()}-W${String(week).padStart(2, "0")}`);
      }
      return set.size;
    };

    if (badge.mode !== 'auto') return { ok: !!badge.validated, cond: '' };
    const spec = badge.spec || {};
    if (spec.kind === 'action_count') {
      const cnt = countByIdLocal[spec.actionId] || 0;
      return { ok: cnt >= spec.count, cond: `Réaliser "${actions.find(a=>a.id===spec.actionId)?.label||spec.actionId}" ${spec.count} fois` };
    }
    if (spec.kind === 'total_xp') {
      return { ok: totalXPVal >= spec.xp, cond: `Atteindre ${spec.xp} XP au total` };
    }
    if (spec.kind === 'days_with_6plus') {
      return { ok: daysWith6 >= spec.days, cond: `Avoir ${spec.days}+ jours avec 6+ actions` };
    }
    if (spec.kind === 'consecutive_days') {
      return { ok: daily.some(d=>d.consecutiveAny >= spec.days), cond: `Avoir ${spec.days} jours consécutifs avec ≥1 action` };
    }
    if (spec.kind === 'before_noon') {
      return { ok: entries.some(e=>e.beforeNoon), cond: `Faire une action avant midi` };
    }
    if (spec.kind === 'weeks_with_action') {
      const w = weeksWithLocal(spec.actionId);
      return { ok: w >= spec.weeks, cond: `Faire l'action ${actions.find(a=>a.id===spec.actionId)?.label||spec.actionId} ${spec.weeks} semaines` };
    }
    // Longest streak (plus longue série de jours consécutifs avec >=1 action)
    if (spec.kind === 'longest_streak') {
      let best = 0, cur = 0, last = null;
      const dates = Object.keys(byDate).sort();
      for (const d of dates) {
        if (!last) { cur = byDate[d].length>0 ? 1 : 0; }
        else {
          const nxt = new Date(last); nxt.setDate(nxt.getDate()+1);
          const nxtS = fmtDate(nxt);
          if (nxtS === d && byDate[d].length>0) cur++; else cur = byDate[d].length>0 ? 1 : 0;
        }
        if (cur > best) best = cur;
        last = d;
      }
      return { ok: best >= (spec.streak||spec.days||3), cond: `Avoir une série de ${spec.streak||spec.days||3} jours consécutifs` };
    }
    // Weekly XP: somme des XP dans une semaine calendaire
    if (spec.kind === 'weekly_xp') {
      // calculer la semaine la plus riche
      const map = {};
      for (const e of entries) {
        const dt = new Date(e.date);
        const year = dt.getFullYear();
        const week = Math.ceil((((dt - new Date(year,0,1))/86400000)+ new Date(year,0,1).getDay()+1)/7);
        const key = `${year}-W${String(week).padStart(2,'0')}`;
        map[key] = (map[key]||0) + e.points;
      }
      const best = Math.max(0, ...Object.values(map));
      return { ok: best >= (spec.xp||spec.weekly_xp||newBadgeWeeklyXP), cond: `Avoir >= ${spec.xp||spec.weekly_xp||newBadgeWeeklyXP} XP sur une semaine` };
    }
    // Distinct actions in a day: spec.count = how many distinct actions required in a single day
    // spec.days = how many distinct days this must occur (default 1)
    if (spec.kind === 'distinct_actions_per_day') {
      const requiredDistinct = spec.count || spec.distinct || 3;
      const requiredDays = spec.days || 1;
      let matchedDays = 0;
      for (const d of Object.keys(byDate)) {
        const set = new Set(byDate[d].map(x=>x.actionId));
        if (set.size >= requiredDistinct) matchedDays++;
        if (matchedDays >= requiredDays) return { ok: true, cond: `Avoir ${requiredDistinct} actions distinctes dans ${requiredDays} journée(s)` };
      }
      return { ok: false, cond: `Avoir ${requiredDistinct} actions distinctes dans ${requiredDays} journée(s)` };
    }
    // Combo actions: faire plusieurs actions (liste) le même jour
    // spec.actions = [id1,id2,...], spec.days = combien de jours où le combo doit se produire
    if (spec.kind === 'combo_actions') {
      const actionsNeeded = Array.isArray(spec.actions) ? spec.actions : (spec.actions ? [spec.actions] : []);
      const requiredDays = spec.days || 1;
      if (actionsNeeded.length === 0) return { ok: false, cond: 'Aucune action sélectionnée pour le combo' };
      let matched = 0;
      for (const d of Object.keys(byDate)) {
        const ids = new Set(byDate[d].map(x=>x.actionId));
        let all = true;
        for (const aid of actionsNeeded) if (!ids.has(aid)) { all = false; break; }
        if (all) matched++;
        if (matched >= requiredDays) return { ok: true, cond: `Faire ${actionsNeeded.map(id=>actions.find(a=>a.id===id)?.label||id).join(' + ')} le même jour, ${requiredDays} fois` };
      }
      return { ok: false, cond: `Faire ${actionsNeeded.map(id=>actions.find(a=>a.id===id)?.label||id).join(' + ')} le même jour, ${requiredDays} fois` };
    }
    // Multi-months action: action présente sur N mois différents
    if (spec.kind === 'multi_months_action') {
      const set = new Set();
      for (const e of entries.filter(x=>x.actionId===spec.actionId)) set.add(e.date.slice(0,7));
      return { ok: set.size >= (spec.months||newBadgeMonthsCount), cond: `Faire l'action ${actions.find(a=>a.id===spec.actionId)?.label||spec.actionId} sur ${spec.months||newBadgeMonthsCount} mois différents` };
    }
    // Monthly total count: X fois dans un même mois
    if (spec.kind === 'monthly_total_count') {
      const map = {};
      for (const e of entries.filter(x=>x.actionId===spec.actionId)) {
        const ym = e.date.slice(0,7);
        map[ym] = (map[ym]||0) + 1;
      }
      const ok = Object.values(map).some(v=>v >= (spec.count||spec.monthlyCount||newBadgeMonthlyCount));
      return { ok, cond: `Réaliser ${spec.count||spec.monthlyCount||newBadgeMonthlyCount} fois ${actions.find(a=>a.id===spec.actionId)?.label||spec.actionId} en 1 mois` };
    }
    return { ok: false, cond: 'Condition inconnue' };
  }


  // Générer les badges dynamiques pour chaque action :
  // Afficher uniquement le dernier badge atteint et le prochain à atteindre
  const actionBadges = actions.flatMap(a => {
    const count = entries.filter(e => e.actionId === a.id).length;
    let lastReached = null;
    let nextTarget = null;
    for (let i = 0; i < badgeLevels.length; i++) {
      if (count >= badgeLevels[i].count) {
        lastReached = badgeLevels[i];
      } else {
        nextTarget = badgeLevels[i];
        break;
      }
    }
    const res = [];
    if (lastReached) {
      res.push({
        id: `action-${a.id}-lvl${lastReached.count}`,
        name: `${lastReached.label} ${a.label}`,
        cond: `Réaliser l'action "${a.label}" ${lastReached.count} fois`,
        ok: true
      });
    }
    if (nextTarget) {
      res.push({
        id: `action-${a.id}-lvl${nextTarget.count}`,
        name: `${nextTarget.label} ${a.label}`,
        cond: `Réaliser l'action "${a.label}" ${nextTarget.count} fois`,
        ok: false
      });
    }
    // Si aucun badge atteint, montrer le premier
    if (!lastReached && !nextTarget && badgeLevels.length > 0) {
      const first = badgeLevels[0];
      res.push({
        id: `action-${a.id}-lvl${first.count}`,
        name: `${first.label} ${a.label}`,
        cond: `Réaliser l'action "${a.label}" ${first.count} fois`,
        ok: false
      });
    }
    return res;
  });

  // Fusionner les deux listes (spéciaux + actions)
  // Évaluer les badges personnalisés
  const customBadgeObjects = customBadges.map(cb => {
    if (cb.mode === 'manual') {
      return { id: cb.id, name: cb.name, cond: cb.cond || 'Validé manuellement', ok: !!cb.validated, isCustom: true, mode: 'manual' };
    }
    const res = evaluateCustomBadge(cb);
    return { id: cb.id, name: cb.name, cond: res.cond || cb.cond || 'Condition automatique', ok: res.ok, isCustom: true, mode: 'auto' };
  });

  const badges = [...specialBadges, ...actionBadges, ...customBadgeObjects];

  

  // Chart data (last 14 days)
  const chartData = useMemo(() => {
    return daily.slice(-14).map(d => ({ date: d.date.slice(5), xp: d.total }));
  }, [daily]);

  // Handlers entries
  function addEntry() {
    const action = actions.find(a => a.id === form.actionId);
    if (!action) return;
    const entry = {
      id: crypto.randomUUID(),
      date: form.date,
      actionId: form.actionId,
      label: action.label,
      points: action.points,
      notes: form.notes?.trim() || "",
      sansDistraction: form.sansDistraction && form.actionId === "pomodoro",
      beforeNoon: form.beforeNoon || false,
    };
    setEntries((e) => [...e, entry].sort((a,b)=>a.date.localeCompare(b.date)));
    setForm(f => ({ ...f, notes: "", sansDistraction: false }));
  }
  function removeEntry(id) {
    setEntries(e => e.filter(x => x.id !== id));
  }
  function clearAll() {
    if (confirm("Supprimer toutes les données ?")) setEntries([]);
  }
  function exportJSON() {
    const blob = new Blob([JSON.stringify({ entries, settings, actions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vie-gamifiee.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(evt) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.entries) setEntries(data.entries);
        if (data.settings) setSettings(s => ({ ...s, ...data.settings }));
        if (data.actions) setActions(data.actions);
      } catch (e) {
        alert("Fichier invalide");
      }
    };
    reader.readAsText(file);
  }
  // Détection du déblocage d'un badge d'action (notification toast)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 p-4 sm:p-8">
      
  <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6"/> Vie Gamifiée</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportJSON}><Download className="w-4 h-4 mr-2"/>Exporter</Button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow cursor-pointer">
              <Upload className="w-4 h-4"/>
              <span>Importer</span>
              <input type="file" accept="application/json" className="hidden" onChange={importJSON}/>
            </label>
          </div>
        </header>

        {/* Top stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle>XP total</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{totalXP}</CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle>Niveau</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{lvl}</div>
              <div className="text-sm text-slate-500">{currentTitle}</div>
              <div className="mt-3 h-3 w-full bg-slate-200 rounded-xl overflow-hidden">
                <motion.div className="h-full bg-slate-800" initial={{ width: 0 }} animate={{ width: `${Math.round(progressPct*100)}%` }} transition={{ type: "spring", stiffness: 60 }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{xpInLevel}/{xpForNext} vers Niv. {nextLvl}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle>Progression (14 jours)</CardTitle></CardHeader>
            <CardContent className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip formatter={(v)=>[`${v} XP`, "XP"]}/>
                  <Line type="monotone" dataKey="xp" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="journal" className="w-full">
          <TabsList className="grid grid-cols-4 rounded-2xl">
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="actions"><Plus className="w-4 h-4 mr-1"/>Actions</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1"/>Réglages</TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="mt-4 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Ajouter une action</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-1">
                  <label className="text-sm">Date</label>
                  <Input type="date" value={form.date} onChange={(e)=>setForm(f=>({...f, date:e.target.value}))} />
                </div>
                    <div className="md:col-span-2">
                    <label className="text-sm">Action</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={form.actionId}
                      onChange={(e) => setForm(f => ({ ...f, actionId: e.target.value }))}
                    >
                      {actions.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.label} (+{a.points} XP)
                        </option>
                      ))}
                    </select>
                  </div>

                <div className="md:col-span-2">
                  <label className="text-sm">Notes (optionnel)</label>
                  <Input value={form.notes} onChange={(e)=>setForm(f=>({...f, notes:e.target.value}))} placeholder="Détails, durée, etc."/>
                </div>
                {form.actionId === "pomodoro" && (
                  <div className="md:col-span-5 -mt-2 flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.sansDistraction} onChange={(e)=>setForm(f=>({...f, sansDistraction:e.target.checked}))}/>
                      Pomodoro sans distraction (pour le badge "Concentré")
                    </label>
                  </div>
                )}
                <div className="md:col-span-5 -mt-2 flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.beforeNoon||false} onChange={(e)=>setForm(f=>({...f, beforeNoon:e.target.checked}))}/>
                    Fait avant midi (utile pour "Matinée Parfaite")
                  </label>
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <Button onClick={addEntry}><Plus className="w-4 h-4 mr-2"/>Ajouter</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><History className="w-4 h-4"/> Historique</CardTitle>
                <Button variant="destructive" onClick={clearAll}><Trash2 className="w-4 h-4 mr-2"/>Tout effacer</Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="p-2">Date</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">XP</th>
                      <th className="p-2">Notes</th>
                      <th className="p-2">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 && (
                      <tr><td className="p-3 text-slate-400" colSpan={5}>Ajoute ta première action 👇</td></tr>
                    )}
                    {entries.map(e => (
                      <tr key={e.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">{e.date}</td>
                        <td className="p-2">{e.label}</td>
                        <td className="p-2">{e.points}</td>
                        <td className="p-2">{e.notes}</td>
                        <td className="p-2"><Button size="sm" variant="ghost" onClick={()=>removeEntry(e.id)}>Supprimer</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Actions (nouveau) */}
          <TabsContent value="actions" className="mt-4 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Gérer les actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {actions.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Input
                      value={a.label}
                      onChange={(e)=>updateAction(a.id, e.target.value, a.points)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={a.points}
                      onChange={(e)=>updateAction(a.id, a.label, e.target.value)}
                      className="w-24"
                    />
                    <Button variant="destructive" size="sm" onClick={()=>removeAction(a.id)}>Supprimer</Button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Input placeholder="Nouvelle action" id="newActionLabel"/>
                  <Input type="number" placeholder="XP" id="newActionPoints" className="w-24"/>
                  <Button onClick={()=>{
                    const labelEl = document.getElementById("newActionLabel");
                    const pointsEl = document.getElementById("newActionPoints");
                    const label = (labelEl?.value || "").trim();
                    const pts = pointsEl?.value;
                    if (label && pts !== "") addAction(label, pts);
                    if (labelEl) labelEl.value = "";
                    if (pointsEl) pointsEl.value = "";
                  }}><Plus className="w-4 h-4 mr-2"/>Ajouter</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5"/> Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badges.map((b, i) => {
                    // Afficher un message de félicitations uniquement pour les badges validés d'action (pas les spéciaux)
                    const isActionBadge = b.id.startsWith("action-") && b.ok;
                    // Vérifier si c'est le dernier badge validé pour cette action (pour éviter d'afficher plusieurs messages)
                    let showCongrats = false;
                    if (isActionBadge) {
                      // Chercher le badge suivant pour la même action
                      const next = badges.find((b2, j) =>
                        j > i && b2.id.startsWith("action-") && b2.id.split("-")[1] === b.id.split("-")[1]
                      );
                      // S'il n'y a pas de badge suivant non validé, ou si le suivant n'est pas validé, on affiche le message
                      if (!next || !next.ok) showCongrats = true;
                    }
                    return (
                      <div key={b.id} className="p-4 rounded-2xl bg-white shadow flex items-center justify-between">
                        <div>
                          <div className="font-semibold flex items-center gap-2">{b.name} {b.ok ? <Badge className="bg-green-600">✅</Badge> : <Badge variant="secondary">🔒</Badge>}</div>
                          <div className="text-xs text-slate-500 mt-1">{b.cond}</div>
                          {showCongrats && (
                            <div className="text-green-700 text-xs font-semibold mt-2">🎉 Félicitations, tu as débloqué ce badge !</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold mb-2">Badges personnalisés</h3>
                  <div className="space-y-2 mb-4">
                    {customBadges.length === 0 && <div className="text-sm text-slate-500">Aucun badge personnalisé</div>}
                    {customBadges.map(cb => (
                      <div key={cb.id} className="flex items-center justify-between p-2 bg-white rounded shadow">
                        <div>
                          <div className="font-medium">{cb.name} {cb.mode === 'manual' ? <span className="text-xs text-slate-400">(manuel)</span> : <span className="text-xs text-slate-400">(auto)</span>}</div>
                          <div className="text-xs text-slate-500">{cb.cond || JSON.stringify(cb.spec)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cb.mode === 'manual' && <Button size="sm" onClick={()=>{
                            setCustomBadges(prev=>prev.map(p=>p.id===cb.id?{...p, validated: !p.validated}:p));
                          }}>{cb.validated? 'Annuler' : 'Valider'}</Button>}
                          <Button size="sm" variant="destructive" onClick={()=>setCustomBadges(prev=>prev.filter(p=>p.id!==cb.id))}>Supprimer</Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="text-sm">Nom du badge</label>
                      <Input value={newBadgeName} onChange={(e)=>setNewBadgeName(e.target.value)} placeholder="Titre du badge" />
                    </div>
                    <div>
                      <label className="text-sm">Mode</label>
                      <select value={newBadgeMode} onChange={(e)=>setNewBadgeMode(e.target.value)} className="w-full border rounded px-2 py-1">
                        <option value="manual">Manuel (je valide)</option>
                        <option value="auto">Automatique (condition)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">Type (auto)</label>
                      <select value={newBadgeKind} onChange={(e)=>setNewBadgeKind(e.target.value)} className="w-full border rounded px-2 py-1">
                        <option value="action_count">Nombre d'actions (action_count)</option>
                        <option value="total_xp">XP total (total_xp)</option>
                        <option value="days_with_6plus">Jours avec 6+ actions</option>
                        <option value="consecutive_days">Jours consécutifs</option>
                        <option value="before_noon">Faire avant midi</option>
                        <option value="weeks_with_action">Semaines avec action</option>
                        <option value="longest_streak">Plus longue série (longest_streak)</option>
                        <option value="weekly_xp">XP hebdomadaire max (weekly_xp)</option>
                        <option value="distinct_actions_per_day">Actions distinctes en 1 jour</option>
                        <option value="combo_actions">Combo d'actions le même jour</option>
                        <option value="multi_months_action">Action sur plusieurs mois</option>
                        <option value="monthly_total_count">X fois dans un mois</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm">Action (si applicable)</label>
                      <select value={newBadgeActionId} onChange={(e)=>setNewBadgeActionId(e.target.value)} className="w-full border rounded px-2 py-1">
                        {actions.map(a=> <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </div>
                    {newBadgeKind === 'combo_actions' && (
                      <div>
                        <label className="text-sm">Actions du combo (maintenez Ctrl/Cmd pour multi-sélection)</label>
                        <select multiple value={newBadgeComboActionIds} onChange={(e)=>{
                          const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                          setNewBadgeComboActionIds(opts.length?opts:[firstActionId]);
                        }} className="w-full border rounded px-2 py-1 h-24 sm:h-32">
                          {actions.map(a=> <option key={a.id} value={a.id}>{a.label}</option>)}
                        </select>
                        <div className="text-xs text-slate-400 mt-1">Ex: sélectionne 2+ actions pour exiger qu'elles soient faites le même jour.</div>
                      </div>
                    )}
                    <div className="relative">
                      <label className="text-sm">Nombre / Seuil</label>
                      <Input type="number" value={newBadgeCount} onChange={(e)=>setNewBadgeCount(Number(e.target.value||0))} />
                      {/* tooltip moved below input for better responsiveness */}
                      <div className="mt-2">
                        <span
                          onMouseEnter={()=>setShowDistinctTooltip(true)}
                          onMouseLeave={()=>setShowDistinctTooltip(false)}
                          className="inline-flex items-center gap-2 text-xs text-slate-500 cursor-help"
                        >
                          <span className="text-xs bg-slate-200 rounded-full px-1">i</span>
                          <span>Explication</span>
                        </span>
                        {showDistinctTooltip && (
                          <div
                            onMouseEnter={()=>setShowDistinctTooltip(true)}
                            onMouseLeave={()=>setShowDistinctTooltip(false)}
                            className="mt-2 text-xs text-slate-700 bg-white border rounded p-2 shadow-md z-50 w-64 sm:w-80"
                            style={{position: 'absolute', left: 0}}
                          >
                            Nombre d'actions différentes à réaliser dans une journée. Le champ "Nombre / Seuil" (ci-dessus) correspond au nombre de journées qui doivent respecter cette condition (ex: 3 jours).
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm">XP (pour total_xp)</label>
                      <Input type="number" value={newBadgeXP} onChange={(e)=>setNewBadgeXP(Number(e.target.value||0))} />
                    </div>
                    {newBadgeKind === 'consecutive_days' || newBadgeKind === 'longest_streak' ? (
                      <div>
                        <label className="text-sm">Jours requis</label>
                        <Input type="number" value={newBadgeStreak} onChange={(e)=>setNewBadgeStreak(Number(e.target.value||0))} />
                      </div>
                    ) : null}
                    {newBadgeKind === 'weekly_xp' && (
                      <div>
                        <label className="text-sm">XP hebdomadaire</label>
                        <Input type="number" value={newBadgeWeeklyXP} onChange={(e)=>setNewBadgeWeeklyXP(Number(e.target.value||0))} />
                      </div>
                    )}
                    {newBadgeKind === 'distinct_actions_per_day' && (
                      <div>
                        <label className="text-sm">Actions distinctes requises</label>
                        <Input type="number" value={newBadgeDistinctActionsCount} onChange={(e)=>setNewBadgeDistinctActionsCount(Number(e.target.value||0))} />
                      </div>
                    )}
                    {newBadgeKind === 'multi_months_action' && (
                      <div>
                        <label className="text-sm">Mois différents</label>
                        <Input type="number" value={newBadgeMonthsCount} onChange={(e)=>setNewBadgeMonthsCount(Number(e.target.value||0))} />
                      </div>
                    )}
                    {newBadgeKind === 'monthly_total_count' && (
                      <div>
                        <label className="text-sm">Nombre dans un mois</label>
                        <Input type="number" value={newBadgeMonthlyCount} onChange={(e)=>setNewBadgeMonthlyCount(Number(e.target.value||0))} />
                      </div>
                    )}

                    <div className="md:col-span-3 flex gap-2">
                      <Button onClick={()=>{
                        if (!newBadgeName.trim()) return alert('Donne un nom au badge');
                        const id = crypto.randomUUID();
                        if (newBadgeMode === 'manual') {
                          setCustomBadges(prev=>[...prev, { id, name: newBadgeName.trim(), mode: 'manual', cond: '', validated: false }]);
                        } else {
                          // construire spec en fonction du type choisi
                          const spec = {};
                          if (newBadgeKind === 'action_count') { spec.kind = 'action_count'; spec.actionId = newBadgeActionId; spec.count = newBadgeCount || 1; }
                          else if (newBadgeKind === 'total_xp') { spec.kind = 'total_xp'; spec.xp = newBadgeXP || 100; }
                          else if (newBadgeKind === 'days_with_6plus') { spec.kind = 'days_with_6plus'; spec.days = newBadgeDays || 1; }
                          else if (newBadgeKind === 'consecutive_days') { spec.kind = 'consecutive_days'; spec.days = newBadgeDays || 3; }
                          else if (newBadgeKind === 'before_noon') { spec.kind = 'before_noon'; }
                          else if (newBadgeKind === 'weeks_with_action') { spec.kind = 'weeks_with_action'; spec.actionId = newBadgeActionId; spec.weeks = newBadgeWeeks || 3; }
                          else if (newBadgeKind === 'longest_streak') { spec.kind = 'longest_streak'; spec.streak = newBadgeStreak || 3; }
                          else if (newBadgeKind === 'weekly_xp') { spec.kind = 'weekly_xp'; spec.xp = newBadgeWeeklyXP || 50; }
                          else if (newBadgeKind === 'distinct_actions_per_day') { spec.kind = 'distinct_actions_per_day'; spec.count = newBadgeDistinctActionsCount || 3; spec.days = newBadgeDistinctDays || 1; }
                          else if (newBadgeKind === 'combo_actions') { spec.kind = 'combo_actions'; spec.actions = newBadgeComboActionIds && newBadgeComboActionIds.length ? newBadgeComboActionIds : [newBadgeActionId]; spec.days = newBadgeComboDays || 1; }
                          else if (newBadgeKind === 'multi_months_action') { spec.kind = 'multi_months_action'; spec.actionId = newBadgeActionId; spec.months = newBadgeMonthsCount || 2; }
                          else if (newBadgeKind === 'monthly_total_count') { spec.kind = 'monthly_total_count'; spec.actionId = newBadgeActionId; spec.count = newBadgeMonthlyCount || 10; }
                          // set a readable cond for auto badges
                          if (!spec.cond) {
                            if (spec.kind === 'action_count') spec.cond = `Réaliser ${spec.count}× ${actions.find(a=>a.id===spec.actionId)?.label||spec.actionId}`;
                            if (spec.kind === 'total_xp') spec.cond = `Atteindre ${spec.xp} XP au total`;
                          }
                          setCustomBadges(prev=>[...prev, { id, name: newBadgeName.trim(), mode: 'auto', spec }]);
                        }
                        // reset form
                        setNewBadgeName(''); setNewBadgeMode('manual'); setNewBadgeKind('action_count'); setNewBadgeCount(1);
                      }}>Ajouter le badge</Button>
                      <Button variant="secondary" onClick={()=>{
                        setNewBadgeName(''); setNewBadgeMode('manual'); setNewBadgeKind('action_count'); setNewBadgeCount(1);
                      }}>Annuler</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Réglages des badges</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Seuil "Code Master" (leçons Symfony)</label>
                  <Input type="number" min={1} value={settings.codeMasterLessons}
                    onChange={(e)=>setSettings(s=>({...s, codeMasterLessons: Number(e.target.value||0)}))} />
                </div>
                <div>
                  <label className="text-sm">Jours avec 6+ actions pour "Régularité"</label>
                  <Input type="number" min={1} value={settings.regulariteDaysNeeded}
                    onChange={(e)=>setSettings(s=>({...s, regulariteDaysNeeded: Number(e.target.value||0)}))} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader><CardTitle>À propos des bonus</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2 text-slate-600">
                <p>• +10 XP si <b>6 actions ou plus</b> dans une journée.</p>
                <p>• +10 XP au <b>3ᵉ jour consécutif</b> (et 6ᵉ, 9ᵉ, …) avec ≥1 action/jour.</p>
                <p>• +25 XP au <b>7ᵉ jour consécutif</b> (et 14ᵉ, 21ᵉ, …) avec ≥1 action/jour.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-slate-400 pt-6">
          Données stockées localement (localStorage). Tu peux exporter / importer ton historique.
        </footer>
      </div>
    </div>
  );
}
