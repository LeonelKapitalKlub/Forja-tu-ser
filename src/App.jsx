import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── TEMA ────────────────────────────────────────────────────────────────────
const TEMAS = {
  noche: {
    bg: "#080810", card: "#11111e", card2: "#181828", border: "#1e1e35",
    text: "#e8e6f5", textSub: "#6b6890", accent: "#7c3aed", accentSoft: "#a78bfa",
    accentBg: "#7c3aed22", green: "#10b981", yellow: "#f59e0b", red: "#ef4444", cyan: "#06b6d4",
  },
  dia: {
    bg: "#f0f0f8", card: "#ffffff", card2: "#f7f7ff", border: "#e0e0f0",
    text: "#1a1a2e", textSub: "#6b6890", accent: "#6d28d9", accentSoft: "#7c3aed",
    accentBg: "#7c3aed18", green: "#059669", yellow: "#d97706", red: "#dc2626", cyan: "#0891b2",
  },
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const QUOTES = [
  "El éxito no es el final, el fracaso no es fatal: lo que cuenta es el coraje de continuar.",
  "No esperes el momento perfecto. Toma el momento y hazlo perfecto.",
  "Cada día es una nueva oportunidad para cambiar tu vida.",
  "La disciplina es el puente entre las metas y los logros.",
  "Tú no eres el resultado de tu pasado. Eres el arquitecto de tu futuro.",
  "El único límite es el que tú mismo te pones.",
  "Las personas exitosas hacen lo que las personas sin éxito no quieren hacer.",
  "Tu única competencia eres tú del ayer.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Cada obstáculo es una oportunidad disfrazada.",
  "La grandeza no se construye en un día, pero sí se trabaja cada día.",
  "Vender no es convencer, es conectar.",
  "La familia es el porqué detrás del qué.",
  "Tu mente es tu activo más valioso. Invertí en ella.",
];

const PILARES = [
  { id: "ventas", label: "Ventas", emoji: "💼", color: "#f59e0b" },
  { id: "mente", label: "Mentalidad", emoji: "🧠", color: "#7c3aed" },
  { id: "familia", label: "Familia", emoji: "❤️", color: "#ef4444" },
];

const ARQUETIPOS = [
  { id: "vendedor", nombre: "Vendedor Elite", emoji: "🔥", pilar: "ventas", descripcion: "Proactivo, resiliente, convierte objeciones en oportunidades.", tono: "Coach duro y directo. Sin excusas, solo resultados." },
  { id: "empresario", nombre: "Empresario Estratégico", emoji: "🚀", pilar: "ventas", descripcion: "Piensa en sistemas, delega, construye activos.", tono: "Socio estratégico frío y calculador. Piensa en grande." },
  { id: "atleta", nombre: "Atleta Mental", emoji: "⚡", pilar: "mente", descripcion: "Disciplinado, sin excusas, convierte el dolor en combustible.", tono: "Entrenador implacable. La mediocridad no existe." },
  { id: "estoico", nombre: "Guerrero Estoico", emoji: "🏛️", pilar: "mente", descripcion: "Domina sus emociones, actúa donde puede, suelta lo que no puede.", tono: "Mentor sabio y profundo. Calma y claridad ante todo." },
  { id: "lider", nombre: "Líder Visionario", emoji: "👑", pilar: "mente", descripcion: "Inspira, decide, asume responsabilidad total.", tono: "Líder que desafía y eleva. Exige lo mejor de vos." },
  { id: "padre", nombre: "Padre Presente", emoji: "💪", pilar: "familia", descripcion: "Paciente, protector, ejemplo vivo de sus valores.", tono: "Cálido pero firme. El amor como acción, no como sentimiento." },
  { id: "pareja", nombre: "Pareja Consciente", emoji: "🤝", pilar: "familia", descripcion: "Escucha profunda, presencia real, crecimiento juntos.", tono: "Empático y honesto. Las relaciones se construyen con actos." },
  { id: "custom", nombre: "Mi propio modelo", emoji: "✏️", pilar: "custom", descripcion: "Definís vos quién querés ser.", tono: "" },
];

const PRIORIDADES = ["🔴 Crítica", "🟠 Alta", "🟡 Media", "🟢 Baja"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];
const fmtTime = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const K = { obj: "fts2_obj", arquetipo: "fts2_arq", custom: "fts2_custom", diario: "fts2_diario", progreso: "fts2_progreso", perfil: "fts2_perfil", prospectos: "fts2_prospectos", gratitud: "fts2_gratitud", tema: "fts2_tema" };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── DATOS INICIALES ──────────────────────────────────────────────────────────
const OBJ_DEFAULT = [
  { id: uid(), titulo: "Llamadas de prospección", hora: "09:00", prioridad: "🔴 Crítica", veces: 5, completadas: 0, activo: true, alarmaOn: true, todoElDia: false, pilar: "ventas" },
  { id: uid(), titulo: "Meditación matutina", hora: "07:00", prioridad: "🔴 Crítica", veces: 1, completadas: 0, activo: true, alarmaOn: true, todoElDia: false, pilar: "mente" },
  { id: uid(), titulo: "Tiempo de calidad en familia", hora: "19:00", prioridad: "🟠 Alta", veces: 1, completadas: 0, activo: true, alarmaOn: true, todoElDia: false, pilar: "familia" },
  { id: uid(), titulo: "Tomar agua", hora: "", prioridad: "🟡 Media", veces: 8, completadas: 0, activo: true, alarmaOn: true, todoElDia: true, horaInicio: "08:00", horaFin: "22:00", frecuenciaHoras: 2, pilar: "mente" },
];

const genProgreso = () => {
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dias.push({ fecha: d.toISOString().split("T")[0], dia: DIAS[d.getDay()], completados: i === 0 ? 0 : Math.floor(Math.random() * 4) + 1, total: 4, racha: Math.random() > 0.2 });
  }
  return dias;
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function ForjaTuSer2() {
  const [temaKey, setTemaKey] = useState(() => load(K.tema, "noche"));
  const T = TEMAS[temaKey];

  const [tab, setTab] = useState("home");
  const [objetivos, setObjetivos] = useState(() => load(K.obj, OBJ_DEFAULT));
  const [arquetipo, setArquetipo] = useState(() => load(K.arquetipo, null));
  const [customDesc, setCustomDesc] = useState(() => load(K.custom, ""));
  const [diario, setDiario] = useState(() => load(K.diario, []));
  const [progreso, setProgreso] = useState(() => load(K.progreso, genProgreso()));
  const [perfil, setPerfil] = useState(() => load(K.perfil, { nombre: "", trabajo: "", metas: "", miedos: "", valores: "" }));
  const [prospectos, setProspectos] = useState(() => load(K.prospectos, []));
  const [gratitud, setGratitud] = useState(() => load(K.gratitud, []));

  const [chat, setChat] = useState([]);
  const [modulo, setModulo] = useState("coach"); // coach | simulador | crisis | reflexion | ventas
  const [inputMsg, setInputMsg] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [ticker, setTicker] = useState(new Date());
  const [notif, setNotif] = useState(null);
  const [notifType, setNotifType] = useState("info");
  const [alarmasPerm, setAlarmasPerm] = useState(false);
  const [showAddObj, setShowAddObj] = useState(false);
  const [sortBy, setSortBy] = useState("hora");
  const [filtroPilar, setFiltroPilar] = useState("todos");
  const [newObj, setNewObj] = useState({ titulo: "", hora: "08:00", prioridad: "🟡 Media", veces: 1, alarmaOn: true, todoElDia: false, horaInicio: "08:00", horaFin: "22:00", frecuenciaHoras: 2, pilar: "mente" });
  const [diarioDetalle, setDiarioDetalle] = useState(null);
  const [showPerfil, setShowPerfil] = useState(false);
  const [newProspecto, setNewProspecto] = useState({ nombre: "", estado: "prospecto", notas: "" });
  const [showAddProsp, setShowAddProsp] = useState(false);
  const [gratitudHoy, setGratitudHoy] = useState("");
  const alarmaRef = useRef([]);
  const chatEndRef = useRef(null);

  // Persistencia
  useEffect(() => { save(K.obj, objetivos); }, [objetivos]);
  useEffect(() => { save(K.arquetipo, arquetipo); }, [arquetipo]);
  useEffect(() => { save(K.custom, customDesc); }, [customDesc]);
  useEffect(() => { save(K.diario, diario); }, [diario]);
  useEffect(() => { save(K.progreso, progreso); }, [progreso]);
  useEffect(() => { save(K.perfil, perfil); }, [perfil]);
  useEffect(() => { save(K.prospectos, prospectos); }, [prospectos]);
  useEffect(() => { save(K.gratitud, gratitud); }, [gratitud]);
  useEffect(() => { save(K.tema, temaKey); }, [temaKey]);

  // Reloj
  useEffect(() => { const iv = setInterval(() => setTicker(new Date()), 1000); return () => clearInterval(iv); }, []);

  // Quote
  useEffect(() => { const iv = setInterval(() => setQuoteIdx(q => (q + 1) % QUOTES.length), 180000); return () => clearInterval(iv); }, []);

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Notif permisos
  useEffect(() => { if ("Notification" in window && Notification.permission === "granted") setAlarmasPerm(true); }, []);

  const showNotif = (msg, type = "info") => { setNotif(msg); setNotifType(type); setTimeout(() => setNotif(null), 5000); };

  const toggleTema = () => setTemaKey(t => t === "noche" ? "dia" : "noche");

  // Alarmas
  const programarAlarmas = useCallback(() => {
    alarmaRef.current.forEach(clearTimeout);
    alarmaRef.current = [];
    if (!alarmasPerm) return;
    const ahora = new Date();
    objetivos.filter(o => o.alarmaOn && o.completadas < o.veces).forEach(obj => {
      if (obj.todoElDia) {
        const [hI, mI] = (obj.horaInicio || "08:00").split(":").map(Number);
        const [hF, mF] = (obj.horaFin || "22:00").split(":").map(Number);
        const freqMs = (obj.frecuenciaHoras || 2) * 3600000;
        let cur = new Date(); cur.setHours(hI, mI, 0, 0);
        const fin = new Date(); fin.setHours(hF, mF, 0, 0);
        while (cur <= fin) {
          if (cur > ahora) {
            const diff = cur - ahora;
            const tid = setTimeout(() => { new Notification(`🔁 ${obj.titulo}`, { body: `Llevás ${obj.completadas}/${obj.veces}. ¡Dale!` }); }, diff);
            alarmaRef.current.push(tid);
          }
          cur = new Date(cur.getTime() + freqMs);
        }
      } else if (obj.hora) {
        const [hh, mm] = obj.hora.split(":").map(Number);
        const t = new Date(); t.setHours(hh, mm, 0, 0);
        if (t <= ahora) t.setDate(t.getDate() + 1);
        const tid = setTimeout(() => { new Notification(`⏰ ${obj.titulo}`, { body: "Es hora de tu objetivo." }); }, t - ahora);
        alarmaRef.current.push(tid);
      }
    });
    [{ h: 8 }, { h: 12 }, { h: 17 }, { h: 21 }].forEach(({ h }) => {
      const t = new Date(); t.setHours(h, 0, 0, 0);
      if (t <= ahora) return;
      const tid = setTimeout(() => { new Notification("💬 Forja Tu Ser", { body: QUOTES[Math.floor(Math.random() * QUOTES.length)] }); }, t - ahora);
      alarmaRef.current.push(tid);
    });
  }, [alarmasPerm, objetivos]);

  useEffect(() => { programarAlarmas(); }, [programarAlarmas]);

  // ── IA ────────────────────────────────────────────────────────────────────
  const getArquetipoInfo = () => {
    if (!arquetipo) return { nombre: "Coach General", desc: "Coach de vida completo", tono: "Equilibrado, directo y empático." };
    if (arquetipo === "custom") return { nombre: "Mi modelo propio", desc: customDesc, tono: "Adaptate al arquetipo descrito." };
    const a = ARQUETIPOS.find(a => a.id === arquetipo);
    return { nombre: a?.nombre || "", desc: a?.descripcion || "", tono: a?.tono || "" };
  };

  const getSystemPrompt = () => {
    const { nombre, desc, tono } = getArquetipoInfo();
    const perfilCtx = perfil.nombre ? `\nPERFIL DEL USUARIO: Nombre: ${perfil.nombre}. Trabajo: ${perfil.trabajo}. Metas: ${perfil.metas}. Miedos: ${perfil.miedos}. Valores: ${perfil.valores}.` : "";

    const moduloPrompts = {
      coach: `Sos un coach de desarrollo personal de élite. El usuario forja su identidad como "${nombre}" (${desc}). TONO: ${tono}${perfilCtx}\nRespondé con pasos concretos para HOY, nombrá el rasgo del arquetipo que aplica, y cerrá con una pregunta de reflexión poderosa. Máximo 200 palabras. Español rioplatense.`,
      simulador: `Sos un simulador de escenarios. El usuario quiere PREPARARSE para una situación futura. Arquetipo: "${nombre}". TONO: ${tono}${perfilCtx}\nAnalizá la situación, anticipá obstáculos, dá un guión concreto de cómo manejarlo y terminá con una pregunta de preparación. Español rioplatense.`,
      crisis: `Sos un coach de contención para momentos de crisis. El usuario está en un momento difícil. Arquetipo base: "${nombre}". TONO: Primero contené emocionalmente (1 oración), luego reencuadrá la situación desde la fortaleza, luego dá UN solo paso acción para salir del pozo. Jamás minimices. Español rioplatense.`,
      reflexion: `Sos un guía de reflexión nocturna profunda. TONO: Sabio, cálido, sin juicio.${perfilCtx}\nAyudá al usuario a extraer aprendizajes del día, reconocer sus patrones y cerrar el día con intención. Terminá con una afirmación personalizada para mañana. Máximo 150 palabras. Español rioplatense.`,
      ventas: `Sos el socio estratégico de ventas más efectivo del mundo. TONO: Directo, estratégico, orientado a resultados.${perfilCtx}\nEspecialidad: ventas de motos, autos y electrodomésticos con planes de pago. Analizá la situación comercial, dá tácticas concretas y cierre con un desafío de acción. Máximo 200 palabras. Español rioplatense.`,
    };
    return moduloPrompts[modulo] || moduloPrompts.coach;
  };

  const callIA = async (userMsg) => {
    const resp = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: getSystemPrompt(),
        messages: [...chat.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMsg }],
      }),
    });
    const data = await resp.json();
    return data.content?.map(c => c.text || "").join("") || "Error al conectar.";
  };

  const enviar = async () => {
    if (!inputMsg.trim() || loadingAI) return;
    setLoadingAI(true);
    const msg = inputMsg;
    setInputMsg("");
    const userMsg = { id: uid(), role: "user", content: msg };
    setChat(p => [...p, userMsg]);
    try {
      const reply = await callIA(msg);
      setChat(p => [...p, { id: uid(), role: "assistant", content: reply }]);
      // Guardar en diario
      const { nombre, emoji } = arquetipo === "custom" ? { nombre: "Mi modelo", emoji: "✏️" } : { nombre: ARQUETIPOS.find(a => a.id === arquetipo)?.nombre || "Coach", emoji: ARQUETIPOS.find(a => a.id === arquetipo)?.emoji || "⚡" };
      setDiario(prev => [{ id: uid(), fecha: new Date().toISOString(), dia: DIAS[new Date().getDay()], situacion: msg, respuesta: reply, modulo, arquetipoNombre: nombre, arquetipoEmoji: emoji }, ...prev].slice(0, 100));
    } catch { setChat(p => [...p, { id: uid(), role: "assistant", content: "Error de conexión." }]); }
    setLoadingAI(false);
  };

  // ── OBJETIVOS ────────────────────────────────────────────────────────────
  const objetivosFiltrados = objetivos
    .filter(o => filtroPilar === "todos" || o.pilar === filtroPilar)
    .sort((a, b) => {
      if (sortBy === "prioridad") return PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad);
      if (sortBy === "hora") return (a.todoElDia ? a.horaInicio : a.hora || "").localeCompare(b.todoElDia ? b.horaInicio : b.hora || "");
      return 0;
    });

  const toggleCompletar = (id) => {
    setObjetivos(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = Math.min(o.completadas + 1, o.veces);
      if (next === o.veces) showNotif(`✅ ¡Completaste "${o.titulo}"!`, "ok");
      return { ...o, completadas: next };
    }));
  };

  const agregarObj = () => {
    if (!newObj.titulo.trim()) return;
    setObjetivos(p => [...p, { ...newObj, id: uid(), completadas: 0, activo: true }]);
    setNewObj({ titulo: "", hora: "08:00", prioridad: "🟡 Media", veces: 1, alarmaOn: true, todoElDia: false, horaInicio: "08:00", horaFin: "22:00", frecuenciaHoras: 2, pilar: "mente" });
    setShowAddObj(false);
    showNotif("🎯 Objetivo agregado.", "ok");
  };

  // Stats
  const totalObj = objetivos.length;
  const completadosHoy = objetivos.filter(o => o.completadas >= o.veces).length;
  const pctHoy = totalObj > 0 ? Math.round((completadosHoy / totalObj) * 100) : 0;
  const rachaActual = progreso.filter(p => p.racha).length;
  const promedioSemanal = progreso.length > 0 ? Math.round(progreso.reduce((a, p) => a + (p.total > 0 ? (p.completados / p.total) * 100 : 0), 0) / progreso.length) : 0;

  // Colores notif
  const NC = { info: T.accent, ok: T.green, error: T.red, alarm: T.yellow, quote: T.cyan };

  // ─── ESTILOS BASE ──────────────────────────────────────────────────────────
  const s = {
    card: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 14 },
    btn: (active) => ({ padding: "8px 14px", borderRadius: 20, border: `1px solid ${active ? T.accent : T.border}`, background: active ? T.accentBg : "none", color: active ? T.accentSoft : T.textSub, fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer" }),
    input: { width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 10, color: T.textSub, marginBottom: 3, display: "block" },
  };

  // ─── MÓDULOS IA CONFIG ────────────────────────────────────────────────────
  const MODULOS = [
    { id: "coach", emoji: "⚡", label: "Coach", color: T.accent, placeholder: "¿Qué situación enfrentás hoy?", sugerencias: ["Tuve un conflicto", "Me rechazaron", "Perdí motivación", "Tomé una mala decisión"] },
    { id: "simulador", emoji: "🎯", label: "Simular", color: T.yellow, placeholder: "¿Qué situación se viene y querés prepararte?", sugerencias: ["Tengo una reunión importante", "Debo pedir un aumento", "Voy a hacer una presentación", "Tengo una conversación difícil"] },
    { id: "crisis", emoji: "🚨", label: "Crisis", color: T.red, placeholder: "Contame qué está pasando, sin filtros...", sugerencias: ["Quiero tirar todo", "Me siento al límite", "Cometí un error grave", "No veo salida"] },
    { id: "reflexion", emoji: "🌙", label: "Reflexión", color: T.cyan, placeholder: "¿Cómo fue tu día? ¿Qué pasó?", sugerencias: ["Resumen del día", "Qué aprendí hoy", "Cómo me sentí hoy", "Qué haría diferente"] },
    { id: "ventas", emoji: "💼", label: "Ventas", color: T.yellow, placeholder: "¿Qué situación de ventas querés analizar?", sugerencias: ["Cliente que no cierra", "Cómo manejar objeción de precio", "Estrategia para fin de mes", "Cómo generar más prospectos"] },
  ];
  const moduloActivo = MODULOS.find(m => m.id === modulo);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 500, margin: "0 auto" }}>

      {/* NOTIF */}
      {notif && (
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", background: T.card, border: `1px solid ${NC[notifType]}`, borderRadius: 12, padding: "11px 18px", zIndex: 9999, maxWidth: 440, width: "92%", fontSize: 13, color: T.text, boxShadow: `0 4px 24px ${NC[notifType]}44`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1 }}>{notif}</span>
          <button onClick={() => setNotif(null)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: T.card, padding: "18px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, color: T.accent, textTransform: "uppercase", letterSpacing: 3, marginBottom: 1 }}>FORJA TU SER 2.0</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtDate(ticker).charAt(0).toUpperCase() + fmtDate(ticker).slice(1)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.accentSoft, letterSpacing: -1 }}>{fmtTime(ticker)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button onClick={toggleTema} style={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 10px", color: T.textSub, fontSize: 12, cursor: "pointer" }}>
              {temaKey === "noche" ? "☀️ Día" : "🌙 Noche"}
            </button>
            <div style={{ background: T.card2, borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: pctHoy >= 80 ? T.green : pctHoy >= 40 ? T.yellow : T.accentSoft }}>{pctHoy}%</div>
              <div style={{ fontSize: 8, color: T.textSub }}>HOY</div>
            </div>
            <div style={{ fontSize: 10, color: T.yellow }}>🔥 {rachaActual}d racha</div>
          </div>
        </div>

        {/* Pilares resumen */}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {PILARES.map(p => {
            const objs = objetivos.filter(o => o.pilar === p.id);
            const comp = objs.filter(o => o.completadas >= o.veces).length;
            return (
              <div key={p.id} style={{ flex: 1, background: T.card2, borderRadius: 8, padding: "6px 4px", textAlign: "center", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14 }}>{p.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{comp}/{objs.length}</div>
                <div style={{ fontSize: 8, color: T.textSub }}>{p.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quote */}
        <div style={{ marginTop: 10, borderLeft: `3px solid ${T.accent}`, padding: "8px 12px", background: T.card2, borderRadius: "0 8px 8px 0", fontSize: 11, color: T.accentSoft, fontStyle: "italic", lineHeight: 1.5 }}>
          "{QUOTES[quoteIdx]}"
        </div>

        {!alarmasPerm && (
          <button onClick={async () => { const p = await Notification.requestPermission(); if (p === "granted") { setAlarmasPerm(true); showNotif("🔔 ¡Alarmas activadas!", "ok"); } }} style={{ marginTop: 8, width: "100%", padding: 7, borderRadius: 8, border: `1px dashed ${T.yellow}44`, background: `${T.yellow}11`, color: T.yellow, fontSize: 11, cursor: "pointer" }}>
            🔔 Activar alarmas del dispositivo
          </button>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
        {[["home", "🏠", "Inicio"], ["objetivos", "📋", "Objetivos"], ["ia", "⚡", "IA"], ["ventas_crm", "💼", "Ventas"], ["progreso", "📊", "Progreso"], ["diario", "📔", "Diario"]].map(([id, ico, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: "0 0 auto", padding: "10px 10px", background: "none", border: "none", color: tab === id ? T.accentSoft : T.textSub, fontSize: 10, fontWeight: tab === id ? 700 : 400, cursor: "pointer", borderBottom: `2px solid ${tab === id ? T.accent : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 56 }}>
            <span style={{ fontSize: 15 }}>{ico}</span>{label}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 14px 80px" }}>

        {/* ═══ HOME ════════════════════════════════════════════════════════ */}
        {tab === "home" && (
          <>
            {/* Perfil rápido */}
            <div style={{ ...s.card, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSub }}>¡Buen día{perfil.nombre ? `, ${perfil.nombre}` : ""}! 👋</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                  {arquetipo ? `Forjando: ${ARQUETIPOS.find(a => a.id === arquetipo)?.emoji} ${arquetipo === "custom" ? "Mi modelo" : ARQUETIPOS.find(a => a.id === arquetipo)?.nombre}` : "Sin identidad activa aún"}
                </div>
              </div>
              <button onClick={() => setShowPerfil(true)} style={{ background: T.accentBg, border: `1px solid ${T.accent}`, borderRadius: 8, padding: "6px 10px", color: T.accentSoft, fontSize: 11, cursor: "pointer" }}>✏️ Perfil</button>
            </div>

            {/* Modal perfil */}
            {showPerfil && (
              <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 999, display: "flex", alignItems: "flex-end" }}>
                <div style={{ background: T.card, width: "100%", maxWidth: 500, margin: "0 auto", borderRadius: "16px 16px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: T.accentSoft }}>Tu perfil de vida</div>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 12 }}>Cuanto más completés, mejor te conoce tu IA.</div>
                  {[["nombre", "¿Cómo te llamás?"], ["trabajo", "¿A qué te dedicás?"], ["metas", "¿Cuál es tu gran meta de este año?"], ["miedos", "¿Qué es lo que más te frena?"], ["valores", "¿Cuáles son tus valores más importantes?"]].map(([k, placeholder]) => (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <span style={s.label}>{placeholder}</span>
                      <input value={perfil[k]} onChange={e => setPerfil(p => ({ ...p, [k]: e.target.value }))} placeholder={placeholder} style={s.input} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={() => { setShowPerfil(false); showNotif("✅ Perfil guardado.", "ok"); }} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                    <button onClick={() => setShowPerfil(false)} style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.textSub, cursor: "pointer" }}>Cerrar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Accesos rápidos IA */}
            <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8, fontWeight: 600 }}>MOTOR IA — ACCESO RÁPIDO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {MODULOS.map(m => (
                <button key={m.id} onClick={() => { setModulo(m.id); setTab("ia"); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: T.textSub, marginTop: 1 }}>Consultar IA</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Objetivos pendientes hoy */}
            <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8, fontWeight: 600 }}>PENDIENTES HOY</div>
            {objetivos.filter(o => o.completadas < o.veces).slice(0, 3).map(obj => (
              <div key={obj.id} style={{ ...s.card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: PILARES.find(p => p.id === obj.pilar)?.color || T.accent, marginBottom: 2 }}>{PILARES.find(p => p.id === obj.pilar)?.emoji} {PILARES.find(p => p.id === obj.pilar)?.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{obj.titulo}</div>
                  {obj.veces > 1 && <div style={{ fontSize: 10, color: T.textSub }}>{obj.completadas}/{obj.veces} veces</div>}
                </div>
                <button onClick={() => toggleCompletar(obj.id)} style={{ background: T.accentBg, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "6px 10px", color: T.accentSoft, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓</button>
              </div>
            ))}
            {objetivos.filter(o => o.completadas < o.veces).length === 0 && (
              <div style={{ ...s.card, textAlign: "center", color: T.green, fontWeight: 700 }}>✅ ¡Todo completado hoy! Sos una bestia.</div>
            )}

            {/* Gratitud diaria */}
            <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8, fontWeight: 600, marginTop: 14 }}>GRATITUD DE HOY 🙏</div>
            <div style={{ ...s.card }}>
              {gratitud.filter(g => g.fecha === hoy()).length === 0 ? (
                <>
                  <textarea value={gratitudHoy} onChange={e => setGratitudHoy(e.target.value)} placeholder="¿Por qué 3 cosas estás agradecido hoy?" style={{ ...s.input, minHeight: 70, resize: "none", lineHeight: 1.5 }} />
                  <button onClick={() => { if (!gratitudHoy.trim()) return; setGratitud(p => [{ id: uid(), fecha: hoy(), texto: gratitudHoy }, ...p]); setGratitudHoy(""); showNotif("🙏 Gratitud registrada.", "ok"); }} style={{ marginTop: 8, width: "100%", padding: 9, borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Guardar gratitud
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>"{gratitud.find(g => g.fecha === hoy())?.texto}"</div>
              )}
            </div>
          </>
        )}

        {/* ═══ OBJETIVOS ═══════════════════════════════════════════════════ */}
        {tab === "objetivos" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[["Total", totalObj, T.accent], ["✅ Listos", completadosHoy, T.green], ["En curso", objetivos.filter(o => o.completadas > 0 && o.completadas < o.veces).length, T.yellow]].map(([l, v, c]) => (
                <div key={l} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.textSub }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Filtro pilares */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              <button style={s.btn(filtroPilar === "todos")} onClick={() => setFiltroPilar("todos")}>Todos</button>
              {PILARES.map(p => <button key={p.id} style={s.btn(filtroPilar === p.id)} onClick={() => setFiltroPilar(p.id)}>{p.emoji} {p.label}</button>)}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", gap: 5, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: T.textSub }}>Ordenar:</span>
              {[["hora", "⏰ Hora"], ["prioridad", "🔴 Prioridad"]].map(([v, l]) => <button key={v} style={s.btn(sortBy === v)} onClick={() => setSortBy(v)}>{l}</button>)}
            </div>

            {objetivosFiltrados.map(obj => {
              const pilarInfo = PILARES.find(p => p.id === obj.pilar);
              const pct = obj.veces > 1 ? (obj.completadas / obj.veces) * 100 : obj.completadas >= 1 ? 100 : 0;
              const done = obj.completadas >= obj.veces;
              return (
                <div key={obj.id} style={{ ...s.card, marginBottom: 9, borderColor: done ? `${T.green}33` : T.border }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, background: T.card2, borderRadius: 4, padding: "2px 6px", color: pilarInfo?.color || T.accent }}>{pilarInfo?.emoji} {pilarInfo?.label}</span>
                        {obj.todoElDia ? <span style={{ fontSize: 10, background: T.accentBg, borderRadius: 4, padding: "2px 6px", color: T.accentSoft }}>🔁 {obj.horaInicio}–{obj.horaFin}</span> : <span style={{ fontSize: 10, background: T.card2, borderRadius: 4, padding: "2px 6px", color: T.accentSoft }}>⏰ {obj.hora}</span>}
                        <span style={{ fontSize: 10, background: T.card2, borderRadius: 4, padding: "2px 6px" }}>{obj.prioridad}</span>
                        {obj.veces > 1 && <span style={{ fontSize: 10, background: T.card2, borderRadius: 4, padding: "2px 6px", color: T.yellow }}>🔄 {obj.completadas}/{obj.veces}x</span>}
                        <button onClick={() => setObjetivos(p => p.map(o => o.id === obj.id ? { ...o, alarmaOn: !o.alarmaOn } : o))} style={{ fontSize: 10, background: obj.alarmaOn ? `${T.yellow}22` : T.card2, borderRadius: 4, padding: "2px 6px", border: "none", cursor: "pointer", color: obj.alarmaOn ? T.yellow : T.textSub }}>{obj.alarmaOn ? "🔔" : "🔕"}</button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: done ? T.green : T.text, textDecoration: done ? "line-through" : "none" }}>{done ? "✅ " : ""}{obj.titulo}</div>
                    </div>
                    <button onClick={() => setObjetivos(p => p.filter(o => o.id !== obj.id))} style={{ background: "none", border: "none", color: T.border, cursor: "pointer", fontSize: 16, padding: "0 0 0 8px" }}>✕</button>
                  </div>
                  {obj.veces > 1 && <div style={{ background: T.card2, borderRadius: 4, height: 5, marginBottom: 10, overflow: "hidden" }}><div style={{ height: 5, borderRadius: 4, background: done ? T.green : `linear-gradient(90deg, ${T.accent}, ${T.accentSoft})`, width: `${pct}%`, transition: "width .4s" }} /></div>}
                  {!done && <button onClick={() => toggleCompletar(obj.id)} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${T.accent}44`, background: T.accentBg, color: T.accentSoft, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{obj.veces > 1 ? `✓ Completar una vez (${obj.completadas + 1}/${obj.veces})` : "✓ Marcar completado"}</button>}
                </div>
              );
            })}

            {!showAddObj ? (
              <button onClick={() => setShowAddObj(true)} style={{ width: "100%", padding: 13, borderRadius: 12, border: `2px dashed ${T.border}`, background: "none", color: T.textSub, fontSize: 14, cursor: "pointer" }}>+ Agregar objetivo</button>
            ) : (
              <div style={{ ...s.card, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.accentSoft }}>Nuevo objetivo</div>
                <input value={newObj.titulo} onChange={e => setNewObj({ ...newObj, titulo: e.target.value })} placeholder="¿Qué querés lograr?" style={{ ...s.input, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <button onClick={() => setNewObj({ ...newObj, todoElDia: false })} style={s.btn(!newObj.todoElDia)}>⏰ Hora fija</button>
                  <button onClick={() => setNewObj({ ...newObj, todoElDia: true })} style={s.btn(newObj.todoElDia)}>🔁 Todo el día</button>
                </div>
                {!newObj.todoElDia ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div><span style={s.label}>Hora</span><input type="time" value={newObj.hora} onChange={e => setNewObj({ ...newObj, hora: e.target.value })} style={s.input} /></div>
                    <div><span style={s.label}>Veces al día</span><input type="number" min={1} max={20} value={newObj.veces} onChange={e => setNewObj({ ...newObj, veces: parseInt(e.target.value) || 1 })} style={s.input} /></div>
                  </div>
                ) : (
                  <div style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><span style={s.label}>Desde</span><input type="time" value={newObj.horaInicio} onChange={e => setNewObj({ ...newObj, horaInicio: e.target.value })} style={s.input} /></div>
                      <div><span style={s.label}>Hasta</span><input type="time" value={newObj.horaFin} onChange={e => setNewObj({ ...newObj, horaFin: e.target.value })} style={s.input} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div><span style={s.label}>Cada cuántas horas</span><select value={newObj.frecuenciaHoras} onChange={e => setNewObj({ ...newObj, frecuenciaHoras: parseFloat(e.target.value) })} style={s.input}><option value={0.5}>30 min</option><option value={1}>1h</option><option value={2}>2h</option><option value={3}>3h</option><option value={4}>4h</option></select></div>
                      <div><span style={s.label}>Veces a completar</span><input type="number" min={1} max={30} value={newObj.veces} onChange={e => setNewObj({ ...newObj, veces: parseInt(e.target.value) || 1 })} style={s.input} /></div>
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 8 }}><span style={s.label}>Pilar de vida</span><select value={newObj.pilar} onChange={e => setNewObj({ ...newObj, pilar: e.target.value })} style={s.input}>{PILARES.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}</select></div>
                <div style={{ marginBottom: 10 }}><span style={s.label}>Prioridad</span><select value={newObj.prioridad} onChange={e => setNewObj({ ...newObj, prioridad: e.target.value })} style={s.input}>{PRIORIDADES.map(p => <option key={p}>{p}</option>)}</select></div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12, fontSize: 13, color: T.accentSoft }}><input type="checkbox" checked={newObj.alarmaOn} onChange={e => setNewObj({ ...newObj, alarmaOn: e.target.checked })} />🔔 Activar alarma</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={agregarObj} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Agregar</button>
                  <button onClick={() => setShowAddObj(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: "none", color: T.textSub, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ IA ══════════════════════════════════════════════════════════ */}
        {tab === "ia" && (
          <>
            {/* Selector de arquetipo */}
            {!arquetipo && (
              <div style={{ ...s.card, marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 10 }}>Primero elegí tu identidad para que la IA te hable desde ella:</div>
                <button onClick={() => setTab("diario")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Elegir identidad →</button>
              </div>
            )}

            {/* Identidad activa */}
            {arquetipo && (
              <div style={{ ...s.card, marginBottom: 10, display: "flex", alignItems: "center", gap: 10, borderColor: `${T.accent}44` }}>
                <span style={{ fontSize: 20 }}>{arquetipo === "custom" ? "✏️" : ARQUETIPOS.find(a => a.id === arquetipo)?.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: 1 }}>IDENTIDAD ACTIVA</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{arquetipo === "custom" ? customDesc.slice(0, 50) + "..." : ARQUETIPOS.find(a => a.id === arquetipo)?.nombre}</div>
                </div>
                <button onClick={() => { setArquetipo(null); }} style={{ fontSize: 10, color: T.textSub, background: "none", border: "none", cursor: "pointer" }}>Cambiar</button>
              </div>
            )}

            {/* Selector módulo */}
            <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
              {MODULOS.map(m => (
                <button key={m.id} onClick={() => { setModulo(m.id); setChat([]); }} style={{ flex: "0 0 auto", padding: "6px 12px", borderRadius: 20, border: `1px solid ${modulo === m.id ? m.color : T.border}`, background: modulo === m.id ? `${m.color}22` : "none", color: modulo === m.id ? m.color : T.textSub, fontSize: 11, fontWeight: modulo === m.id ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            {/* Descripción módulo */}
            <div style={{ fontSize: 11, color: T.textSub, marginBottom: 10, padding: "8px 12px", background: T.card2, borderRadius: 8, borderLeft: `3px solid ${moduloActivo?.color}` }}>
              {modulo === "coach" && "Tu coach responde desde la perspectiva de tu identidad elegida."}
              {modulo === "simulador" && "Preparate mentalmente para situaciones futuras antes de que pasen."}
              {modulo === "crisis" && "Para cuando estás al límite. Sin juicio, solo contención y acción."}
              {modulo === "reflexion" && "Cerrá el día extrayendo aprendizajes y preparando el de mañana."}
              {modulo === "ventas" && "Tu socio estratégico de ventas. Especializado en tu rubro."}
            </div>

            {/* Chat */}
            <div style={{ ...s.card, minHeight: 180, maxHeight: 320, overflowY: "auto", marginBottom: 10 }}>
              {chat.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 32 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{moduloActivo?.emoji}</div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{moduloActivo?.placeholder}</div>
                </div>
              ) : chat.map((msg, i) => (
                <div key={msg.id || i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: msg.role === "user" ? T.yellow : moduloActivo?.color, marginBottom: 3, fontWeight: 700, letterSpacing: 1 }}>{msg.role === "user" ? "VOS" : `${moduloActivo?.emoji} ${moduloActivo?.label?.toUpperCase()}`}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === "user" ? T.accentSoft : T.text, background: msg.role === "user" ? T.card2 : T.bg, borderRadius: 8, padding: "8px 11px", border: msg.role === "assistant" ? `1px solid ${T.border}` : "none", whiteSpace: "pre-wrap" }}>{msg.content}</div>
                </div>
              ))}
              {loadingAI && <div style={{ fontSize: 13, color: moduloActivo?.color, padding: "6px 11px" }}>Analizando...</div>}
              <div ref={chatEndRef} />
            </div>

            <textarea value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder={moduloActivo?.placeholder} style={{ ...s.input, minHeight: 75, resize: "none", lineHeight: 1.5 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={enviar} disabled={loadingAI || !inputMsg.trim()} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: loadingAI || !inputMsg.trim() ? T.card2 : moduloActivo?.color || T.accent, color: loadingAI || !inputMsg.trim() ? T.textSub : "#fff", fontWeight: 700, fontSize: 13, cursor: loadingAI || !inputMsg.trim() ? "not-allowed" : "pointer" }}>
                {loadingAI ? "Analizando..." : `${moduloActivo?.emoji} Consultar`}
              </button>
              {chat.length > 0 && <button onClick={() => setChat([])} style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.textSub, cursor: "pointer" }}>🗑</button>}
            </div>

            {/* Sugerencias */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: T.textSub, marginBottom: 5 }}>Sugerencias:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {moduloActivo?.sugerencias.map(s => <button key={s} onClick={() => setInputMsg(s)} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 20, border: `1px solid ${T.border}`, background: T.card, color: T.accentSoft, cursor: "pointer" }}>{s}</button>)}
              </div>
            </div>

            {/* Identidades */}
            {!arquetipo && (
              <>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 16, marginBottom: 8, fontWeight: 600 }}>ELEGÍ TU IDENTIDAD</div>
                {ARQUETIPOS.filter(a => a.id !== "custom").map(a => (
                  <div key={a.id} onClick={() => setArquetipo(a.id)} style={{ ...s.card, marginBottom: 8, cursor: "pointer", borderColor: arquetipo === a.id ? T.accent : T.border }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</div>
                        <div style={{ fontSize: 10, color: PILARES.find(p => p.id === a.pilar)?.color || T.accent }}>{PILARES.find(p => p.id === a.pilar)?.emoji} {PILARES.find(p => p.id === a.pilar)?.label}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub }}>{a.descripcion}</div>
                  </div>
                ))}
                <div style={{ ...s.card, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>✏️ Crear mi propio modelo</div>
                  <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)} onClick={() => setArquetipo("custom")} placeholder="Describí con tus palabras quién querés ser..." style={{ ...s.input, minHeight: 70, resize: "none", lineHeight: 1.5 }} />
                  {customDesc && <button onClick={() => setArquetipo("custom")} style={{ marginTop: 8, width: "100%", padding: 9, borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Usar este modelo</button>}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ VENTAS CRM ══════════════════════════════════════════════════ */}
        {tab === "ventas_crm" && (
          <>
            {/* Stats ventas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[["Prospectos", prospectos.filter(p => p.estado === "prospecto").length, T.textSub], ["Interesados", prospectos.filter(p => p.estado === "interesado").length, T.yellow], ["Negociando", prospectos.filter(p => p.estado === "negociando").length, T.accent], ["Cerrados", prospectos.filter(p => p.estado === "cerrado").length, T.green]].map(([l, v, c]) => (
                <div key={l} style={{ ...s.card, textAlign: "center", padding: "8px 4px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 8, color: T.textSub }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Acceso rápido coach ventas */}
            <button onClick={() => { setModulo("ventas"); setTab("ia"); }} style={{ width: "100%", marginBottom: 12, padding: 11, borderRadius: 10, border: `1px solid ${T.yellow}44`, background: `${T.yellow}11`, color: T.yellow, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              💼 Consultar coach de ventas →
            </button>

            {/* Lista prospectos */}
            {prospectos.map(p => (
              <div key={p.id} style={{ ...s.card, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{p.notas}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select value={p.estado} onChange={e => setProspectos(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: e.target.value } : pr))} style={{ fontSize: 10, background: T.card2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 6px", color: T.text }}>
                      <option value="prospecto">Prospecto</option>
                      <option value="interesado">Interesado</option>
                      <option value="negociando">Negociando</option>
                      <option value="cerrado">✅ Cerrado</option>
                    </select>
                    <button onClick={() => setProspectos(prev => prev.filter(pr => pr.id !== p.id))} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {!showAddProsp ? (
              <button onClick={() => setShowAddProsp(true)} style={{ width: "100%", padding: 13, borderRadius: 12, border: `2px dashed ${T.border}`, background: "none", color: T.textSub, fontSize: 14, cursor: "pointer" }}>+ Agregar prospecto</button>
            ) : (
              <div style={{ ...s.card, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.yellow }}>Nuevo prospecto</div>
                <input value={newProspecto.nombre} onChange={e => setNewProspecto({ ...newProspecto, nombre: e.target.value })} placeholder="Nombre del cliente" style={{ ...s.input, marginBottom: 8 }} />
                <textarea value={newProspecto.notas} onChange={e => setNewProspecto({ ...newProspecto, notas: e.target.value })} placeholder="Notas (qué busca, producto, contacto...)" style={{ ...s.input, minHeight: 60, resize: "none", marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { if (!newProspecto.nombre.trim()) return; setProspectos(p => [...p, { ...newProspecto, id: uid() }]); setNewProspecto({ nombre: "", estado: "prospecto", notas: "" }); setShowAddProsp(false); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: T.yellow, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Agregar</button>
                  <button onClick={() => setShowAddProsp(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: "none", color: T.textSub, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ PROGRESO ════════════════════════════════════════════════════ */}
        {tab === "progreso" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["Promedio", `${promedioSemanal}%`, T.accent], ["Racha", `${rachaActual}d`, T.yellow], ["Esta semana", `${progreso.filter(p => p.completados > 0).length}/7`, T.green]].map(([l, v, c]) => (
                <div key={l} style={{ ...s.card, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.textSub, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ ...s.card, padding: "14px 6px 8px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accentSoft, marginBottom: 10, paddingLeft: 8 }}>Objetivos completados — 7 días</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={progreso} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="dia" tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
                  <Bar dataKey="completados" fill={T.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...s.card, padding: "14px 6px 8px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 10, paddingLeft: 8 }}>% cumplimiento diario</div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={progreso.map(p => ({ ...p, pct: p.total > 0 ? Math.round((p.completados / p.total) * 100) : 0 }))} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="dia" tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: T.textSub, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} formatter={v => [`${v}%`]} />
                  <Line type="monotone" dataKey="pct" stroke={T.green} strokeWidth={2.5} dot={{ fill: T.green, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gratitud history */}
            {gratitud.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8, fontWeight: 600 }}>ÚLTIMAS GRATITUDES 🙏</div>
                {gratitud.slice(0, 5).map(g => (
                  <div key={g.id} style={{ ...s.card, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: T.textSub, marginBottom: 4 }}>{g.dia || ""} {g.fecha}</div>
                    <div style={{ fontSize: 13, color: T.text, fontStyle: "italic" }}>"{g.texto}"</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ═══ DIARIO ══════════════════════════════════════════════════════ */}
        {tab === "diario" && (
          <>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 14 }}>Cada consulta al motor IA queda guardada acá. Tu historial de crecimiento.</div>
            {diario.length === 0 ? (
              <div style={{ ...s.card, textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📔</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Tu diario está vacío</div>
                <div style={{ fontSize: 13, color: T.textSub }}>Las consultas al motor IA se guardan automáticamente.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 10 }}>{diario.length} entrada{diario.length !== 1 ? "s" : ""} registrada{diario.length !== 1 ? "s" : ""}</div>
                {diario.map(entrada => (
                  <div key={entrada.id} style={{ ...s.card, marginBottom: 10, overflow: "hidden" }}>
                    <div style={{ cursor: "pointer" }} onClick={() => setDiarioDetalle(diarioDetalle === entrada.id ? null : entrada.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13 }}>{entrada.arquetipoEmoji}</span>
                            <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>{entrada.arquetipoNombre}</span>
                            <span style={{ fontSize: 10, color: MODULOS.find(m => m.id === entrada.modulo)?.color || T.accent }}>• {MODULOS.find(m => m.id === entrada.modulo)?.label}</span>
                            <span style={{ fontSize: 10, color: T.textSub }}>{entrada.dia} {new Date(entrada.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{entrada.situacion.slice(0, 80)}{entrada.situacion.length > 80 ? "..." : ""}</div>
                        </div>
                        <span style={{ color: T.textSub, fontSize: 12, marginLeft: 8 }}>{diarioDetalle === entrada.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {diarioDetalle === entrada.id && (
                      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10 }}>
                        <div style={{ fontSize: 10, color: T.yellow, fontWeight: 700, marginBottom: 4 }}>TU CONSULTA</div>
                        <div style={{ fontSize: 13, color: T.accentSoft, lineHeight: 1.6, marginBottom: 10, background: T.card2, borderRadius: 8, padding: "8px 11px" }}>{entrada.situacion}</div>
                        <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginBottom: 4 }}>⚡ RESPUESTA</div>
                        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, background: T.bg, borderRadius: 8, padding: "8px 11px", whiteSpace: "pre-wrap" }}>{entrada.respuesta}</div>
                        <button onClick={() => { setDiario(p => p.filter(e => e.id !== entrada.id)); setDiarioDetalle(null); }} style={{ marginTop: 10, fontSize: 11, padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.red}33`, background: "none", color: T.red, cursor: "pointer" }}>Eliminar entrada</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
