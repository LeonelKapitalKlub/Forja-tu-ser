import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const QUOTES = [
  "El éxito no es el final, el fracaso no es fatal: lo que cuenta es el coraje de continuar.",
  "No esperes el momento perfecto. Toma el momento y hazlo perfecto.",
  "Cada día es una nueva oportunidad para cambiar tu vida.",
  "La disciplina es el puente entre las metas y los logros.",
  "Tú no eres el resultado de tu pasado. Eres el arquitecto de tu futuro.",
  "El único límite es el que tú mismo te pones.",
  "Las personas exitosas hacen lo que las personas sin éxito no quieren hacer.",
  "Hoy es siempre el mejor día para empezar.",
  "Tu única competencia eres tú del ayer.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Cada obstáculo es una oportunidad disfrazada.",
  "La grandeza no se construye en un día, pero sí se trabaja cada día.",
];

const PERSONAS = [
  { id: "lider", nombre: "Líder Visionario", emoji: "👑", descripcion: "Inspira, toma decisiones difíciles, asume responsabilidad y guía con el ejemplo." },
  { id: "vendedor", nombre: "Vendedor Elite", emoji: "🔥", descripcion: "Proactivo, persuasivo, resiliente ante el rechazo, siempre buscando oportunidades." },
  { id: "padre", nombre: "Padre Presente", emoji: "💪", descripcion: "Paciente, protector, educador, presente emocionalmente y ejemplo de valores." },
  { id: "atleta", nombre: "Atleta Mental", emoji: "⚡", descripcion: "Disciplinado, enfocado, convierte el dolor en combustible y no acepta excusas." },
  { id: "empresario", nombre: "Empresario Estratégico", emoji: "🚀", descripcion: "Calcula riesgos, delega, piensa en grande y convierte problemas en negocios." },
  { id: "estoico", nombre: "Guerrero Estoico", emoji: "🏛️", descripcion: "Domina sus emociones, acepta lo que no puede cambiar y actúa donde sí puede." },
];

const PRIORIDADES = ["🔴 Crítica", "🟠 Alta", "🟡 Media", "🟢 Baja"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];
const fmtTime = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const KEYS = { objetivos: "fts_objetivos", persona: "fts_persona", personaCustom: "fts_personaCustom", diario: "fts_diario", progreso: "fts_progreso", alarmas: "fts_alarmas" };

const load = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
};
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// ─── INIT DATA ────────────────────────────────────────────────────────────────
const OBJ_DEFAULT = [
  { id: uid(), titulo: "Meditación matutina", hora: "07:00", prioridad: "🔴 Crítica", veces: 1, completadas: 0, activo: true, alarmaOn: true },
  { id: uid(), titulo: "Leer 30 minutos", hora: "20:00", prioridad: "🟠 Alta", veces: 1, completadas: 0, activo: true, alarmaOn: true },
  { id: uid(), titulo: "Llamadas de prospección", hora: "10:00", prioridad: "🔴 Crítica", veces: 5, completadas: 2, activo: true, alarmaOn: false },
];

// generar semana de progreso simulada para demo
const genProgreso = () => {
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dias.push({
      fecha: d.toISOString().split("T")[0],
      dia: DIAS[d.getDay()],
      completados: i === 0 ? 0 : Math.floor(Math.random() * 4) + 1,
      total: 3,
      racha: i < 3 ? true : Math.random() > 0.3,
    });
  }
  return dias;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ForjaTuSer() {
  const [tab, setTab] = useState("cronograma");
  const [objetivos, setObjetivos] = useState(() => load(KEYS.objetivos, OBJ_DEFAULT));
  const [persona, setPersona] = useState(() => load(KEYS.persona, null));
  const [personaCustom, setPersonaCustom] = useState(() => load(KEYS.personaCustom, ""));
  const [diario, setDiario] = useState(() => load(KEYS.diario, []));
  const [progreso, setProgreso] = useState(() => load(KEYS.progreso, genProgreso()));
  const [chatHistory, setChatHistory] = useState([]);
  const [situacion, setSituacion] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [ticker, setTicker] = useState(new Date());
  const [showAddObj, setShowAddObj] = useState(false);
  const [sortBy, setSortBy] = useState("hora");
  const [notif, setNotif] = useState(null);
  const [newObj, setNewObj] = useState({ titulo: "", hora: "08:00", prioridad: "🟡 Media", veces: 1, alarmaOn: true });
  const [alarmasPerm, setAlarmasPerm] = useState(false);
  const [diarioDetalle, setDiarioDetalle] = useState(null);
  const [graficoTipo, setGraficoTipo] = useState("barras");
  const chatEndRef = useRef(null);
  const alarmaRef = useRef([]);

  // ── Persistencia ──
  useEffect(() => { save(KEYS.objetivos, objetivos); }, [objetivos]);
  useEffect(() => { save(KEYS.persona, persona); }, [persona]);
  useEffect(() => { save(KEYS.personaCustom, personaCustom); }, [personaCustom]);
  useEffect(() => { save(KEYS.diario, diario); }, [diario]);
  useEffect(() => { save(KEYS.progreso, progreso); }, [progreso]);

  // ── Reloj ──
  useEffect(() => {
    const iv = setInterval(() => setTicker(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Quote rotatoria cada 3 min ──
  useEffect(() => {
    const iv = setInterval(() => {
      const idx = Math.floor(Math.random() * QUOTES.length);
      setQuoteIdx(idx);
      showNotif("✨ " + QUOTES[idx], "quote");
    }, 180000);
    return () => clearInterval(iv);
  }, []);

  // ── Scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ── Solicitar permiso notificaciones del navegador ──
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") setAlarmasPerm(true);
    }
  }, []);

  const pedirPermiso = async () => {
    if (!("Notification" in window)) { showNotif("Tu navegador no soporta notificaciones.", "error"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") { setAlarmasPerm(true); showNotif("🔔 ¡Alarmas activadas! Te vamos a recordar tus objetivos.", "ok"); }
    else showNotif("Permiso de notificaciones denegado.", "error");
  };

  // ── Motor de alarmas con Notification API ──
  const programarAlarmas = useCallback(() => {
    alarmaRef.current.forEach(clearTimeout);
    alarmaRef.current = [];
    if (!alarmasPerm) return;
    const ahora = new Date();
    objetivos.filter(o => o.alarmaOn && o.completadas < o.veces).forEach(obj => {
      const [hh, mm] = obj.hora.split(":").map(Number);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      if (target <= ahora) target.setDate(target.getDate() + 1);
      const diff = target - ahora;
      const tid = setTimeout(() => {
        new Notification(`⏰ ${obj.titulo}`, {
          body: obj.veces > 1 ? `Llevas ${obj.completadas}/${obj.veces} veces. ¡Dale!` : "Es hora de tu objetivo diario.",
          icon: "https://api.iconify.design/twemoji/fire.svg",
        });
        showNotif(`⏰ Alarma: ${obj.titulo}`, "alarm");
      }, diff);
      alarmaRef.current.push(tid);
    });
    // Frase motivadora a las 8, 12, 17 y 21hs
    [{ h: 8, m: 0 }, { h: 12, m: 0 }, { h: 17, m: 0 }, { h: 21, m: 0 }].forEach(({ h, m }) => {
      const t = new Date(); t.setHours(h, m, 0, 0);
      if (t <= ahora) return;
      const tid = setTimeout(() => {
        const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        new Notification("💬 Forja Tu Ser", { body: q });
      }, t - ahora);
      alarmaRef.current.push(tid);
    });
  }, [alarmasPerm, objetivos]);

  useEffect(() => { programarAlarmas(); }, [programarAlarmas]);

  // ── Notificación in-app ──
  const [notifType, setNotifType] = useState("info");
  const showNotif = (msg, type = "info") => {
    setNotif(msg); setNotifType(type);
    setTimeout(() => setNotif(null), 5000);
  };

  // ── Ordenar objetivos ──
  const objetivosOrdenados = [...objetivos].sort((a, b) => {
    if (sortBy === "prioridad") return PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad);
    if (sortBy === "hora") return a.hora.localeCompare(b.hora);
    if (sortBy === "progreso") return (b.completadas / b.veces) - (a.completadas / a.veces);
    return 0;
  });

  const toggleCompletar = (id) => {
    setObjetivos(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = Math.min(o.completadas + 1, o.veces);
      if (next === o.veces) {
        showNotif(`✅ ¡Completaste "${o.titulo}"!`, "ok");
        actualizarProgreso();
      }
      return { ...o, completadas: next };
    }));
  };

  const actualizarProgreso = () => {
    const hoyStr = hoy();
    setProgreso(prev => {
      const idx = prev.findIndex(p => p.fecha === hoyStr);
      const completadosHoy = objetivos.filter(o => o.completadas >= o.veces).length + 1;
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], completados: completadosHoy };
        return updated;
      }
      return [...prev, { fecha: hoyStr, dia: DIAS[new Date().getDay()], completados: completadosHoy, total: objetivos.length, racha: true }];
    });
  };

  const eliminarObj = (id) => setObjetivos(p => p.filter(o => o.id !== id));

  const agregarObj = () => {
    if (!newObj.titulo.trim()) return;
    setObjetivos(p => [...p, { ...newObj, id: uid(), completadas: 0, activo: true }]);
    setNewObj({ titulo: "", hora: "08:00", prioridad: "🟡 Media", veces: 1, alarmaOn: true });
    setShowAddObj(false);
    showNotif("🎯 Objetivo agregado al cronograma.", "ok");
  };

  const toggleAlarma = (id) => {
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, alarmaOn: !o.alarmaOn } : o));
  };

  // ── MOTOR IA ──────────────────────────────────────────────────────────────
  const getPersonaInfo = () => {
    if (!persona) return { nombre: "", desc: "" };
    if (persona === "custom") return { nombre: "Mi modelo propio", desc: personaCustom };
    const p = PERSONAS.find(p => p.id === persona);
    return { nombre: p?.nombre || "", desc: p?.descripcion || "" };
  };

  const callIA = async (userMsg) => {
    const { nombre, desc } = getPersonaInfo();
    const system = `Eres un coach de desarrollo personal de élite. El usuario está forjando su identidad como: "${nombre}".
Descripción del arquetipo: ${desc}.
INSTRUCCIONES:
1. Respondé SIEMPRE desde la perspectiva de ese arquetipo, en primera persona plural ("nosotros" o hablando al usuario directamente).
2. Analizá la situación y decí exactamente cómo actuaría esa persona.
3. Dá 2-3 pasos concretos y accionables para HOY.
4. Nombrá el rasgo clave del arquetipo que se activa en esta situación.
5. Cerrá con UNA pregunta de reflexión poderosa.
Sé directo, sin rodeos, inspirador y práctico. Respondé en español rioplatense, de manera personal. Máximo 200 palabras.`;

    const resp = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [
          ...chatHistory.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMsg },
        ],
      }),
    });
    const data = await resp.json();
    return data.content?.map(c => c.text || "").join("") || "Error al conectar.";
  };

  const enviarSituacion = async () => {
    if (!situacion.trim() || !persona || loadingAI) return;
    setLoadingAI(true);
    const userMsg = situacion;
    setSituacion("");
    const newUserMsg = { id: uid(), role: "user", content: userMsg };
    setChatHistory(p => [...p, newUserMsg]);

    try {
      const reply = await callIA(userMsg);
      const newAssistantMsg = { id: uid(), role: "assistant", content: reply };
      setChatHistory(p => [...p, newAssistantMsg]);
      // Guardar en diario
      guardarEnDiario(userMsg, reply);
    } catch (e) {
      setChatHistory(p => [...p, { id: uid(), role: "assistant", content: "Error de conexión. Revisá tu acceso." }]);
    }
    setLoadingAI(false);
  };

  const guardarEnDiario = (situacion, respuesta) => {
    const { nombre, emoji } = persona === "custom"
      ? { nombre: "Mi modelo", emoji: "✏️" }
      : { nombre: PERSONAS.find(p => p.id === persona)?.nombre || "", emoji: PERSONAS.find(p => p.id === persona)?.emoji || "" };

    const entrada = {
      id: uid(),
      fecha: new Date().toISOString(),
      dia: DIAS[new Date().getDay()],
      situacion,
      respuesta,
      personaNombre: nombre,
      personaEmoji: emoji,
    };
    setDiario(prev => [entrada, ...prev].slice(0, 100));
    showNotif("📔 Situación guardada en tu diario.", "ok");
  };

  // ── STATS ──────────────────────────────────────────────────────────────────
  const totalObjetivos = objetivos.length;
  const completadosHoy = objetivos.filter(o => o.completadas >= o.veces).length;
  const enProgreso = objetivos.filter(o => o.completadas > 0 && o.completadas < o.veces).length;
  const pctHoy = totalObjetivos > 0 ? Math.round((completadosHoy / totalObjetivos) * 100) : 0;
  const rachaActual = progreso.filter(p => p.racha).length;
  const promedioSemanal = progreso.length > 0
    ? Math.round(progreso.reduce((a, p) => a + (p.total > 0 ? (p.completados / p.total) * 100 : 0), 0) / progreso.length)
    : 0;

  // ── COLORES NOTIF ──────────────────────────────────────────────────────────
  const notifColors = { info: "#7c3aed", ok: "#10b981", error: "#ef4444", alarm: "#f59e0b", quote: "#06b6d4" };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e6f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 500, margin: "0 auto", position: "relative" }}>

      {/* NOTIFICACIÓN IN-APP */}
      {notif && (
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", background: "#1a1625", border: `1px solid ${notifColors[notifType]}`, borderRadius: 12, padding: "11px 18px", zIndex: 9999, maxWidth: 440, width: "92%", fontSize: 13, color: "#e8e6f0", boxShadow: `0 4px 24px ${notifColors[notifType]}44`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1 }}>{notif}</span>
          <button onClick={() => setNotif(null)} style={{ background: "none", border: "none", color: "#7c6f9a", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #13101f 0%, #0a0a0f 100%)", padding: "20px 16px 14px", borderBottom: "1px solid #1e1b2e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 3, marginBottom: 2 }}>FORJA TU SER</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
              {fmtDate(ticker).charAt(0).toUpperCase() + fmtDate(ticker).slice(1)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa", letterSpacing: -1 }}>{fmtTime(ticker)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: "#1e1b2e", borderRadius: 10, padding: "8px 12px", minWidth: 80 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: pctHoy >= 80 ? "#10b981" : pctHoy >= 40 ? "#f59e0b" : "#a78bfa" }}>{pctHoy}%</div>
              <div style={{ fontSize: 9, color: "#7c6f9a" }}>HOY</div>
            </div>
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>🔥 {rachaActual} días racha</div>
          </div>
        </div>
        {/* Quote del día */}
        <div style={{ marginTop: 12, background: "#1a1625", borderLeft: "3px solid #7c3aed", borderRadius: "0 8px 8px 0", padding: "9px 12px", fontSize: 12, color: "#c4b5fd", fontStyle: "italic", lineHeight: 1.5 }}>
          "{QUOTES[quoteIdx]}"
        </div>
        {/* Permiso alarmas */}
        {!alarmasPerm && (
          <button onClick={pedirPermiso} style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #f59e0b44", background: "#f59e0b11", color: "#f59e0b", fontSize: 12, cursor: "pointer" }}>
            🔔 Activar alarmas y recordatorios del dispositivo
          </button>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "#0f0d1a", borderBottom: "1px solid #1e1b2e", overflowX: "auto" }}>
        {[["cronograma", "📋", "Objetivos"], ["progreso", "📊", "Progreso"], ["identidad", "🧠", "Identidad"], ["coaching", "⚡", "Coaching"], ["diario", "📔", "Diario"]].map(([id, ico, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: "0 0 auto", padding: "11px 12px", background: "none", border: "none", color: tab === id ? "#a78bfa" : "#504868", fontSize: 11, fontWeight: tab === id ? 700 : 400, cursor: "pointer", borderBottom: tab === id ? "2px solid #7c3aed" : "2px solid transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 64 }}>
            <span style={{ fontSize: 16 }}>{ico}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 14px 80px" }}>

        {/* ═══════════════════ CRONOGRAMA ═══════════════════════════════════ */}
        {tab === "cronograma" && (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["Total", totalObjetivos, "#7c3aed"], ["Completados", completadosHoy, "#10b981"], ["En progreso", enProgreso, "#f59e0b"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "#13101f", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #1e1b2e" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: "#7c6f9a", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Ordenar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: "#7c6f9a" }}>Ordenar:</span>
              {[["hora", "⏰ Hora"], ["prioridad", "🔴 Prioridad"], ["progreso", "📈 Progreso"]].map(([v, l]) => (
                <button key={v} onClick={() => setSortBy(v)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, border: "1px solid", borderColor: sortBy === v ? "#7c3aed" : "#1e1b2e", background: sortBy === v ? "#7c3aed22" : "none", color: sortBy === v ? "#a78bfa" : "#7c6f9a", cursor: "pointer" }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Objetivos */}
            {objetivosOrdenados.map(obj => {
              const pct = obj.veces > 1 ? (obj.completadas / obj.veces) * 100 : obj.completadas >= 1 ? 100 : 0;
              const done = obj.completadas >= obj.veces;
              return (
                <div key={obj.id} style={{ background: "#13101f", borderRadius: 12, padding: 13, marginBottom: 9, border: done ? "1px solid #10b98133" : "1px solid #1e1b2e", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, background: "#1e1b2e", borderRadius: 4, padding: "2px 6px", color: "#a78bfa" }}>⏰ {obj.hora}</span>
                        <span style={{ fontSize: 10, background: "#1e1b2e", borderRadius: 4, padding: "2px 6px" }}>{obj.prioridad}</span>
                        {obj.veces > 1 && <span style={{ fontSize: 10, background: "#1e1b2e", borderRadius: 4, padding: "2px 6px", color: "#f59e0b" }}>🔄 {obj.completadas}/{obj.veces}x</span>}
                        <button onClick={() => toggleAlarma(obj.id)} style={{ fontSize: 10, background: obj.alarmaOn ? "#f59e0b22" : "#1e1b2e", borderRadius: 4, padding: "2px 6px", border: "none", cursor: "pointer", color: obj.alarmaOn ? "#f59e0b" : "#504868" }}>
                          {obj.alarmaOn ? "🔔" : "🔕"}
                        </button>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: done ? "#10b981" : "#e8e6f0", textDecoration: done && "line-through" }}>
                        {done ? "✅ " : ""}{obj.titulo}
                      </div>
                    </div>
                    <button onClick={() => eliminarObj(obj.id)} style={{ background: "none", border: "none", color: "#2a2535", cursor: "pointer", fontSize: 16, padding: "0 0 0 8px", lineHeight: 1 }}>✕</button>
                  </div>
                  {obj.veces > 1 && (
                    <div style={{ background: "#1e1b2e", borderRadius: 4, height: 5, marginBottom: 10, overflow: "hidden" }}>
                      <div style={{ height: 5, borderRadius: 4, background: done ? "#10b981" : "linear-gradient(90deg, #7c3aed, #a78bfa)", width: `${pct}%`, transition: "width .4s" }} />
                    </div>
                  )}
                  {!done && (
                    <button onClick={() => toggleCompletar(obj.id)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #7c3aed44", background: "#7c3aed11", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {obj.veces > 1 ? `✓ Completar una vez (${obj.completadas + 1}/${obj.veces})` : "✓ Marcar completado"}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Agregar */}
            {!showAddObj ? (
              <button onClick={() => setShowAddObj(true)} style={{ width: "100%", padding: 13, borderRadius: 12, border: "2px dashed #1e1b2e", background: "none", color: "#504868", fontSize: 14, cursor: "pointer", marginTop: 2 }}>
                + Agregar objetivo
              </button>
            ) : (
              <div style={{ background: "#13101f", borderRadius: 12, padding: 14, border: "1px solid #7c3aed44", marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#a78bfa" }}>Nuevo objetivo</div>
                <input value={newObj.titulo} onChange={e => setNewObj({ ...newObj, titulo: e.target.value })} placeholder="¿Qué querés lograr?" style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1b2e", borderRadius: 8, padding: "10px 12px", color: "#e8e6f0", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#7c6f9a", marginBottom: 3 }}>Hora</div>
                    <input type="time" value={newObj.hora} onChange={e => setNewObj({ ...newObj, hora: e.target.value })} style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1b2e", borderRadius: 8, padding: "8px", color: "#e8e6f0", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#7c6f9a", marginBottom: 3 }}>Veces al día</div>
                    <input type="number" min={1} max={20} value={newObj.veces} onChange={e => setNewObj({ ...newObj, veces: parseInt(e.target.value) || 1 })} style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1b2e", borderRadius: 8, padding: "8px", color: "#e8e6f0", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#7c6f9a", marginBottom: 3 }}>Prioridad</div>
                  <select value={newObj.prioridad} onChange={e => setNewObj({ ...newObj, prioridad: e.target.value })} style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1b2e", borderRadius: 8, padding: "8px", color: "#e8e6f0", fontSize: 13 }}>
                    {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12, fontSize: 13, color: "#c4b5fd" }}>
                  <input type="checkbox" checked={newObj.alarmaOn} onChange={e => setNewObj({ ...newObj, alarmaOn: e.target.checked })} />
                  🔔 Activar alarma para este objetivo
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={agregarObj} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Agregar</button>
                  <button onClick={() => setShowAddObj(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #1e1b2e", background: "none", color: "#7c6f9a", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ PROGRESO ════════════════════════════════════ */}
        {tab === "progreso" && (
          <>
            {/* Stats semanales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["Promedio", `${promedioSemanal}%`, "#7c3aed"], ["Racha", `${rachaActual}d`, "#f59e0b"], ["Esta semana", `${progreso.filter(p => p.completados > 0).length}/7`, "#10b981"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "#13101f", borderRadius: 10, padding: "12px 8px", textAlign: "center", border: "1px solid #1e1b2e" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: "#7c6f9a", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Toggle gráfico */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[["barras", "Barras"], ["linea", "Línea"]].map(([v, l]) => (
                <button key={v} onClick={() => setGraficoTipo(v)} style={{ fontSize: 11, padding: "5px 14px", borderRadius: 20, border: "1px solid", borderColor: graficoTipo === v ? "#7c3aed" : "#1e1b2e", background: graficoTipo === v ? "#7c3aed22" : "none", color: graficoTipo === v ? "#a78bfa" : "#7c6f9a", cursor: "pointer" }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Gráfico semanal */}
            <div style={{ background: "#13101f", borderRadius: 12, padding: "14px 6px 8px", border: "1px solid #1e1b2e", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 12, paddingLeft: 8 }}>Objetivos completados — últimos 7 días</div>
              <ResponsiveContainer width="100%" height={160}>
                {graficoTipo === "barras" ? (
                  <BarChart data={progreso} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1b2e" />
                    <XAxis dataKey="dia" tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid #7c3aed44", borderRadius: 8, color: "#e8e6f0", fontSize: 12 }} cursor={{ fill: "#7c3aed11" }} formatter={(v) => [v, "Completados"]} />
                    <Bar dataKey="completados" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={progreso} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1b2e" />
                    <XAxis dataKey="dia" tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid #7c3aed44", borderRadius: 8, color: "#e8e6f0", fontSize: 12 }} formatter={(v) => [v, "Completados"]} />
                    <Line type="monotone" dataKey="completados" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Gráfico porcentaje semanal */}
            <div style={{ background: "#13101f", borderRadius: 12, padding: "14px 6px 8px", border: "1px solid #1e1b2e", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 12, paddingLeft: 8 }}>% de cumplimiento diario</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={progreso.map(p => ({ ...p, pct: p.total > 0 ? Math.round((p.completados / p.total) * 100) : 0 }))} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1b2e" />
                  <XAxis dataKey="dia" tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#7c6f9a", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid #10b98144", borderRadius: 8, color: "#e8e6f0", fontSize: 12 }} formatter={(v) => [`${v}%`, "Cumplimiento"]} />
                  <Bar dataKey="pct" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Listado días */}
            {progreso.slice().reverse().map(p => (
              <div key={p.fecha} style={{ background: "#13101f", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #1e1b2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.dia} <span style={{ color: "#504868", fontWeight: 400, fontSize: 11 }}>{p.fecha}</span></div>
                  <div style={{ fontSize: 11, color: "#7c6f9a", marginTop: 2 }}>{p.completados || 0} de {p.total} objetivos</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {p.racha && <span style={{ fontSize: 12 }}>🔥</span>}
                  <div style={{ fontSize: 16, fontWeight: 800, color: (p.completados / p.total) >= 0.8 ? "#10b981" : (p.completados / p.total) >= 0.5 ? "#f59e0b" : "#7c6f9a" }}>
                    {p.total > 0 ? Math.round((p.completados / p.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══════════════════ IDENTIDAD ════════════════════════════════════ */}
        {tab === "identidad" && (
          <>
            <div style={{ fontSize: 13, color: "#7c6f9a", marginBottom: 14, lineHeight: 1.6 }}>
              Elegí el arquetipo que querés forjar. Tu coach de IA siempre responderá desde esta perspectiva.
            </div>
            {PERSONAS.map(p => (
              <div key={p.id} onClick={() => setPersona(p.id)} style={{ background: "#13101f", borderRadius: 12, padding: 14, marginBottom: 9, border: persona === p.id ? "1px solid #7c3aed" : "1px solid #1e1b2e", cursor: "pointer", transition: "all .2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 26 }}>{p.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: persona === p.id ? "#a78bfa" : "#e8e6f0", fontSize: 15 }}>{p.nombre}</div>
                    {persona === p.id && <div style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700, letterSpacing: 1 }}>✓ ACTIVO</div>}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#7c6f9a", lineHeight: 1.5 }}>{p.descripcion}</div>
              </div>
            ))}
            <div style={{ background: "#13101f", borderRadius: 12, padding: 14, border: persona === "custom" ? "1px solid #7c3aed" : "1px solid #1e1b2e" }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>✏️ Crear mi propio modelo</div>
              <textarea value={personaCustom} onChange={e => setPersonaCustom(e.target.value)} onClick={() => setPersona("custom")} placeholder="Describí exactamente qué tipo de persona querés ser..." style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e1b2e", borderRadius: 8, padding: 10, color: "#e8e6f0", fontSize: 13, minHeight: 90, resize: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
              {personaCustom && <button onClick={() => setPersona("custom")} style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Usar este modelo</button>}
            </div>
            {persona && (
              <div style={{ marginTop: 12, background: "#10b98111", border: "1px solid #10b98144", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>✅ Identidad activa</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {persona === "custom" ? `"${personaCustom.slice(0, 80)}..."` : `${PERSONAS.find(p => p.id === persona)?.emoji} ${PERSONAS.find(p => p.id === persona)?.nombre}`}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ COACHING IA ══════════════════════════════════ */}
        {tab === "coaching" && (
          <>
            {!persona ? (
              <div style={{ background: "#13101f", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🧠</div>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Sin modelo de identidad</div>
                <div style={{ fontSize: 13, color: "#7c6f9a", marginBottom: 16 }}>Definí quién querés ser primero.</div>
                <button onClick={() => setTab("identidad")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Elegir identidad →</button>
              </div>
            ) : (
              <>
                <div style={{ background: "#13101f", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid #7c3aed33", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{persona === "custom" ? "✏️" : PERSONAS.find(p => p.id === persona)?.emoji}</span>
                  <div>
                    <div style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700, letterSpacing: 1 }}>FORJANDO IDENTIDAD</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{persona === "custom" ? personaCustom.slice(0, 55) + "..." : PERSONAS.find(p => p.id === persona)?.nombre}</div>
                  </div>
                </div>

                {/* Chat */}
                <div style={{ background: "#13101f", borderRadius: 12, padding: 12, marginBottom: 10, minHeight: 180, maxHeight: 300, overflowY: "auto", border: "1px solid #1e1b2e" }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: 36 }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>⚡</div>
                      <div style={{ fontSize: 13, color: "#504868", lineHeight: 1.6 }}>Contame una situación del día. Tu coach responde como la persona que querés ser.</div>
                    </div>
                  ) : chatHistory.map((msg, i) => (
                    <div key={msg.id || i} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 9, color: msg.role === "user" ? "#f59e0b" : "#7c3aed", marginBottom: 3, fontWeight: 700, letterSpacing: 1 }}>
                        {msg.role === "user" ? "TÚ" : "⚡ COACH IA"}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === "user" ? "#c4b5fd" : "#e8e6f0", background: msg.role === "user" ? "#1e1b2e" : "#0f0d1a", borderRadius: 8, padding: "8px 11px", border: msg.role === "assistant" ? "1px solid #1e1b2e" : "none", whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loadingAI && (
                    <div style={{ fontSize: 13, color: "#7c3aed", padding: "6px 11px" }}>⚡ Analizando tu situación...</div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <textarea value={situacion} onChange={e => setSituacion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && e.metaKey) enviarSituacion(); }} placeholder="¿Qué situación enfrentás hoy? (Cmd+Enter para enviar)" style={{ width: "100%", background: "#13101f", border: "1px solid #1e1b2e", borderRadius: 10, padding: 12, color: "#e8e6f0", fontSize: 13, minHeight: 75, resize: "none", boxSizing: "border-box", lineHeight: 1.5 }} />

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={enviarSituacion} disabled={loadingAI || !situacion.trim()} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: loadingAI || !situacion.trim() ? "#1e1b2e" : "#7c3aed", color: loadingAI || !situacion.trim() ? "#504868" : "#fff", fontWeight: 700, fontSize: 13, cursor: loadingAI || !situacion.trim() ? "not-allowed" : "pointer" }}>
                    {loadingAI ? "Analizando..." : "⚡ Consultar"}
                  </button>
                  {chatHistory.length > 0 && (
                    <button onClick={() => setChatHistory([])} style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid #1e1b2e", background: "none", color: "#504868", cursor: "pointer", fontSize: 13 }}>🗑</button>
                  )}
                </div>

                {/* Sugerencias */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: "#504868", marginBottom: 5 }}>Situaciones frecuentes:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {["Tuve un conflicto", "Me rechazaron", "Tomé una mala decisión", "Alguien me desafió", "Perdí motivación", "Debo tomar una decisión difícil"].map(s => (
                      <button key={s} onClick={() => setSituacion(s)} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 20, border: "1px solid #1e1b2e", background: "#13101f", color: "#a78bfa", cursor: "pointer" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════ DIARIO ═══════════════════════════════════════ */}
        {tab === "diario" && (
          <>
            <div style={{ fontSize: 13, color: "#7c6f9a", marginBottom: 14 }}>
              Cada consulta al coach queda guardada acá. Tu historial de situaciones y crecimiento.
            </div>

            {diario.length === 0 ? (
              <div style={{ background: "#13101f", borderRadius: 12, padding: 24, textAlign: "center", border: "1px solid #1e1b2e" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📔</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Tu diario está vacío</div>
                <div style={{ fontSize: 13, color: "#504868" }}>Las situaciones que consultes al coach se guardarán aquí automáticamente.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#504868", marginBottom: 10 }}>{diario.length} situación{diario.length !== 1 ? "es" : ""} registrada{diario.length !== 1 ? "s" : ""}</div>
                {diario.map(entrada => (
                  <div key={entrada.id} style={{ background: "#13101f", borderRadius: 12, marginBottom: 10, border: "1px solid #1e1b2e", overflow: "hidden" }}>
                    <div style={{ padding: "11px 14px", cursor: "pointer" }} onClick={() => setDiarioDetalle(diarioDetalle === entrada.id ? null : entrada.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 14 }}>{entrada.personaEmoji}</span>
                            <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>{entrada.personaNombre}</span>
                            <span style={{ fontSize: 10, color: "#504868" }}>• {entrada.dia} {new Date(entrada.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e6f0", lineHeight: 1.4 }}>
                            {entrada.situacion.slice(0, 80)}{entrada.situacion.length > 80 ? "..." : ""}
                          </div>
                        </div>
                        <span style={{ color: "#504868", fontSize: 12, marginLeft: 8 }}>{diarioDetalle === entrada.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {diarioDetalle === entrada.id && (
                      <div style={{ borderTop: "1px solid #1e1b2e", padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>TU SITUACIÓN</div>
                        <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.6, marginBottom: 12, background: "#1e1b2e", borderRadius: 8, padding: "8px 11px" }}>{entrada.situacion}</div>
                        <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>⚡ RESPUESTA DEL COACH</div>
                        <div style={{ fontSize: 13, color: "#e8e6f0", lineHeight: 1.6, background: "#0a0a0f", borderRadius: 8, padding: "8px 11px", whiteSpace: "pre-wrap" }}>{entrada.respuesta}</div>
                        <button onClick={() => { const d = [...diario]; d.splice(d.findIndex(e => e.id === entrada.id), 1); setDiario(d); setDiarioDetalle(null); }} style={{ marginTop: 10, fontSize: 11, padding: "5px 12px", borderRadius: 6, border: "1px solid #ef444433", background: "none", color: "#ef4444", cursor: "pointer" }}>
                          Eliminar entrada
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {diario.length > 5 && (
                  <button onClick={() => { if (window.confirm("¿Borrar todo el diario?")) setDiario([]); }} style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #ef444433", background: "none", color: "#ef444488", cursor: "pointer", fontSize: 12 }}>
                    Limpiar diario completo
                  </button>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
                }
