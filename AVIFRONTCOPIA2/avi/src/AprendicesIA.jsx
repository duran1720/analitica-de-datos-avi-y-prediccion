import { useState, useEffect, useCallback, useRef } from "react";
import "./AprendicesIA.css";

function AprendicesIA() {
  const POWERBI_URL =
    import.meta.env.VITE_POWERBI_DASHBOARD ||
    "https://app.powerbi.com/reportEmbed?reportId=5ee80452-9c3c-4661-a78c-9ba23d95ffef&autoAuth=true&ctid=cbc2c381-2f2e-4d93-91d1-506c9316ace7";
  const API_POWERBI_SYNC  = import.meta.env.VITE_API_FABRIC_SYNC;
  const API_PREDICCIONES  = import.meta.env.VITE_API_DEMANDA_PROGRAMAS;

  const [syncing,      setSyncing]      = useState(false);
  const [syncResult,   setSyncResult]   = useState(null);
  const [predicciones, setPredicciones] = useState([]);
  const [loadingPred,  setLoadingPred]  = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeKey,    setIframeKey]    = useState(0);
  const [activeTab,    setActiveTab]    = useState("powerbi");
  const iframeRef = useRef(null);

  const fetchPredicciones = useCallback(async () => {
    setLoadingPred(true);
    try {
      const res  = await fetch(API_PREDICCIONES);
      const json = await res.json();
      setPredicciones(json.data || []);
    } catch {
      setPredicciones([]);
    } finally {
      setLoadingPred(false);
    }
  }, [API_PREDICCIONES]);

  useEffect(() => { fetchPredicciones(); }, [fetchPredicciones]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res  = await fetch(API_POWERBI_SYNC, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ enviar_a_powerbi: true }),
      });
      const json = await res.json();
      setSyncResult({
        ok:         json.ok,
        procesados: json.data?.procesados ?? 0,
        mensaje:    json.data?.mensaje ?? json.message,
        powerbi:    json.data?.powerbi,
      });
      if (json.ok) fetchPredicciones();
    } catch (e) {
      setSyncResult({ ok: false, mensaje: "Error de red: " + e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshIframe = () => {
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
  };

  const getTendenciaClass = (t) => {
    if (t === "Alta")  return "badge badge-alta";
    if (t === "Media") return "badge badge-media";
    return "badge badge-baja";
  };

  const getAccionClass = (a) => {
    if (a === "Aumentar")  return "badge badge-aumentar";
    if (a === "Suspender") return "badge badge-suspender";
    return "badge badge-mantener";
  };

  const formatFecha = (f) =>
    f
      ? new Date(f).toLocaleDateString("es-CO", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—";

  return (
    <div className="ia-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="ia-hero">
        <div className="ia-hero-left">
          <span className="ia-breadcrumb">Gestion Aprendices / Inteligencia Artificial</span>
          <h1 className="ia-hero-title">Dashboard Inteligente</h1>
          <p className="ia-hero-sub">
            Analisis predictivo de demanda por programa · Power BI Streaming Dataset
          </p>
        </div>

        <div className="ia-sync-panel">
          <div className="ia-sync-card">
            <div className="ia-sync-header">
              <span className="ia-sync-badge">Power BI Streaming</span>
              <span className="ia-sync-status">
                {syncing ? "Procesando..." : "Activo"}
              </span>
            </div>
            <p className="ia-sync-desc">
              Ejecuta la IA incremental y envia predicciones al Streaming Dataset de Power BI.
            </p>
            <button
              className={`ia-sync-btn ${syncing ? "ia-sync-btn--loading" : ""}`}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <><span className="ia-spinner" /> Sincronizando...</>
              ) : (
                <>Sincronizar con Power BI</>
              )}
            </button>

            {syncResult && (
              <div className={`ia-sync-result ${syncResult.ok ? "ia-sync-result--ok" : "ia-sync-result--err"}`}>
                {syncResult.ok ? (
                  <>
                    <strong>{syncResult.procesados} programas actualizados</strong>
                    <span>{syncResult.mensaje}</span>
                    {syncResult.powerbi && (
                      <span className="ia-fabric-detail">
                        Power BI: {syncResult.powerbi.enviados ?? 0} eventos enviados
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <strong>Error</strong>
                    <span>{syncResult.mensaje}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div className="ia-tabs">
        <button
          id="tab-powerbi"
          className={`ia-tab ${activeTab === "powerbi" ? "ia-tab--active" : ""}`}
          onClick={() => setActiveTab("powerbi")}
        >
          Dashboard PowerBI
        </button>
        <button
          id="tab-predicciones"
          className={`ia-tab ${activeTab === "predicciones" ? "ia-tab--active" : ""}`}
          onClick={() => setActiveTab("predicciones")}
        >
          Predicciones IA
          {predicciones.length > 0 && (
            <span className="ia-tab-count">{predicciones.length}</span>
          )}
        </button>
      </div>

      {/* ── TAB: DASHBOARD POWER BI ───────────────────────────────────────── */}
      {activeTab === "powerbi" && (
        <div className="ia-tab-content">
          <div className="ia-powerbi-wrapper">

            <div className="ia-powerbi-toolbar">
              <span className="ia-powerbi-toolbar-label">Dashboard Power BI — AVI SENA</span>
              <button
                className="ia-iframe-refresh-btn"
                onClick={handleRefreshIframe}
                title="Refrescar el dashboard de Power BI"
              >
                Refrescar dashboard
              </button>
            </div>

            {!iframeLoaded && (
              <div className="ia-powerbi-skeleton">
                <div className="ia-skeleton-bar" />
                <div className="ia-skeleton-bar ia-skeleton-bar--sm" />
                <div className="ia-skeleton-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="ia-skeleton-card" />
                  ))}
                </div>
              </div>
            )}

            <div className="ia-powerbi-auth-overlay">
              <h3>Panel de Analisis Seguro</h3>
              <p>
                Inicie sesion con su cuenta institucional SENA dentro del cuadro
                para visualizar las predicciones en tiempo real.
              </p>
            </div>

            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Dashboard Power BI — AVI"
              src={POWERBI_URL}
              frameBorder="0"
              style={{ border: "none" }}
              allowFullScreen
              loading="lazy"
              className={`ia-powerbi-frame ${iframeLoaded ? "ia-powerbi-frame--visible" : ""}`}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>
      )}

      {/* ── TAB: PREDICCIONES ────────────────────────────────────────────── */}
      {activeTab === "predicciones" && (
        <div className="ia-tab-content">
          <div className="ia-pred-header">
            <div>
              <h2 className="ia-pred-title">Historial de Predicciones</h2>
              <p className="ia-pred-sub">
                Resultados del modelo IA · Actualizados por sincronizacion incremental
              </p>
            </div>
            <button className="ia-refresh-btn" onClick={fetchPredicciones}>
              Actualizar
            </button>
          </div>

          {loadingPred ? (
            <div className="ia-loading-rows">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="ia-loading-row" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : predicciones.length === 0 ? (
            <div className="ia-empty-pred">
              <p>
                Sin predicciones disponibles. Use{" "}
                <strong>"Sincronizar con Power BI"</strong> para generarlas.
              </p>
            </div>
          ) : (
            <div className="ia-pred-table-wrap">
              <table className="ia-pred-table">
                <thead>
                  <tr>
                    <th>Programa</th>
                    <th>Nivel</th>
                    <th>Demanda</th>
                    <th>Tendencia</th>
                    <th>Confianza</th>
                    <th>Trimestre</th>
                    <th>Accion</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {predicciones.map((p) => (
                    <tr key={p.id} className="ia-pred-row">
                      <td className="ia-pred-programa">{p.programa}</td>
                      <td><span className="badge badge-nivel">{p.nivel}</span></td>
                      <td>
                        <div className="ia-demanda-bar-wrap">
                          <span className="ia-demanda-val">{p.demanda?.toFixed(1)}</span>
                          <div className="ia-demanda-bar">
                            <div
                              className="ia-demanda-fill"
                              style={{ width: `${Math.min(p.demanda, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td><span className={getTendenciaClass(p.tendencia)}>{p.tendencia}</span></td>
                      <td>
                        <div className="ia-confianza">
                          <span>{((p.confianza || 0) * 100).toFixed(0)}%</span>
                          <div className="ia-confianza-bar">
                            <div
                              className="ia-confianza-fill"
                              style={{ width: `${(p.confianza || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="ia-trimestre">{p.trimestre}</td>
                      <td><span className={getAccionClass(p.accion)}>{p.accion}</span></td>
                      <td className="ia-fecha">{formatFecha(p.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AprendicesIA;