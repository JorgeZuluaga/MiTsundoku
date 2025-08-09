import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Upload } from "lucide-react";
const Charts = React.lazy(() => import("./components/Charts.jsx"));

function normalizeKey(key) {
  if (!key) return "";
  return key
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const aliases = {
  title: ["title", "titulo", "título"],
  place: [
    "purchase place",
    "purchaseplace",
    "lugar de compra",
    "sitio de compra",
    "purchase  place",
  ],
  price: ["purchase price", "precio", "precio de compra", "price"],
  date: [
    "purchase date",
    "fecha de compra",
    "date",
    "date added",
    "added date",
    "fecha añadido",
    "fecha de añadido",
    "fecha agregado",
    "fecha de agregado",
  ],
};

function findKey(obj, wantedAliases) {
  const keys = Object.keys(obj);
  for (const k of keys) {
    const nk = normalizeKey(k);
    for (const a of wantedAliases) {
      if (nk === normalizeKey(a)) return k;
    }
  }
  // fallback: contains
  for (const k of keys) {
    const nk = normalizeKey(k);
    for (const a of wantedAliases) {
      if (nk.includes(normalizeKey(a))) return k;
    }
  }
  return null;
}

function parsePrice(v) {
  if (v == null) return NaN;
  if (typeof v === "number") return isFinite(v) ? v : NaN;
  let s = String(v).trim();
  if (!s) return NaN;
  // remove currency symbols and spaces
  s = s.replace(/[^0-9,.-]/g, "");
  // if both comma and dot appear, assume dot = thousands, comma = decimal (es-CO style)
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "");
    s = s.replace(/,/g, ".");
  } else if (s.includes(",") && !s.includes(".")) {
    // only comma, treat as decimal comma
    s = s.replace(/,/g, ".");
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}

function toMonthKey(d) {
  if (!d) return null;
  const m = dayjs(d);
  return m.isValid() ? m.format("YYYY-MM") : null;
}

// Intenta convertir distintos formatos de fecha a un objeto Date válido
function coerceDate(value) {
  if (value == null || value === "") return null;

  // Ya es Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Números: pueden ser serial de Excel (días), timestamp en ms o en s
  if (typeof value === "number") {
    // Timestamps grandes (ms)
    if (value > 1e12) return new Date(value);
    // Timestamp en segundos (10 dígitos típicamente)
    if (value > 1e9) return new Date(value * 1000);
    // Probable serial de Excel (días desde 1899-12-30)
    if (value > 10000) {
      const d = dayjs("1899-12-30").add(value, "day").toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    // Otros números pequeños: no son fechas válidas
    return null;
  }

  // Strings: intentar como número primero (por si viene el serial de Excel como texto)
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const asNum = Number(trimmed);
    if (isFinite(asNum)) {
      return coerceDate(asNum);
    }
    // Intento genérico
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  // aplicar atributo data-theme al <html> para habilitar tokens CSS
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  async function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    try {
      const XLSX = await import("xlsx");
      if (isCSV) {
        const text = await file.text();
        const wb = XLSX.read(text, { type: "string" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        setRows(json);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        setRows(json);
      }
    } catch (e) {
      console.error(e);
      alert("No pude leer el archivo. Asegúrate de subir un CSV o Excel válido.");
    }
  }

  const mapped = useMemo(() => {
    if (!rows?.length) return [];
    // detect headers once using first row
    const sample = rows[0] || {};
    const kTitle = findKey(sample, aliases.title);
    const kPlace = findKey(sample, aliases.place);
    const kPrice = findKey(sample, aliases.price);
    // Preferimos detectar ambas fechas para distintas lógicas
    const kPurchaseDate = findKey(sample, [
      "purchase date",
      "fecha de compra",
      "date",
    ]);
    const kDateAdded = findKey(sample, [
      "date added",
      "added date",
      "fecha añadido",
      "fecha de añadido",
      "fecha agregado",
      "fecha de agregado",
    ]);

    return rows.map((r, i) => {
      const title = kTitle ? r[kTitle] : null;
      const placeRaw = kPlace ? r[kPlace] : null;
      const place = placeRaw == null || String(placeRaw).trim() === "" ? "(Sin lugar)" : String(placeRaw);
      const price = kPrice ? parsePrice(r[kPrice]) : NaN;
      const datePurchaseRaw = kPurchaseDate ? r[kPurchaseDate] : null;
      const dateAddedRaw = kDateAdded ? r[kDateAdded] : null;
      const datePurchase = coerceDate(datePurchaseRaw);
      const dateAdded = coerceDate(dateAddedRaw);
      return { title, place, price, datePurchase, dateAdded };
    });
  }, [rows]);

  const stats = useMemo(() => {
    const totalBooks = mapped.length;
    const withPrice = mapped.filter((r) => Number.isFinite(r.price));

    const totalValue = withPrice.reduce((acc, r) => acc + r.price, 0);

    // books by place (counts)
    const countByPlace = new Map();
    for (const r of withPrice) {
      countByPlace.set(r.place, (countByPlace.get(r.place) || 0) + 1);
    }
    const booksByPlace = Array.from(countByPlace, ([place, count]) => ({ place, count }))
      .sort((a, b) => b.count - a.count);

    // value by place (sum)
    const sumByPlace = new Map();
    for (const r of withPrice) {
      sumByPlace.set(r.place, (sumByPlace.get(r.place) || 0) + r.price);
    }
    const valueByPlace = Array.from(sumByPlace, ([place, value]) => ({ place, value }))
      .sort((a, b) => b.value - a.value);

    // purchases per month (count) y value per month (sum), usando fecha de compra si existe; si no, Date Added
    const countByMonth = new Map();
    const valueSumByMonth = new Map();
    for (const r of withPrice) {
      const purchaseMonth = toMonthKey(r.datePurchase) || toMonthKey(r.dateAdded);
      if (!purchaseMonth) continue;
      countByMonth.set(purchaseMonth, (countByMonth.get(purchaseMonth) || 0) + 1);
      valueSumByMonth.set(purchaseMonth, (valueSumByMonth.get(purchaseMonth) || 0) + (r.price || 0));
    }

    // determinar mes inicial usando el más antiguo Date Added entre los que tienen precio
    let startMonth = null;
    for (const r of withPrice) {
      const mAdded = toMonthKey(r.dateAdded);
      if (!mAdded) continue;
      if (!startMonth || mAdded < startMonth) startMonth = mAdded;
    }
    // si no hay Date Added, usar el más antiguo presente en los conteos
    if (!startMonth && countByMonth.size > 0) {
      startMonth = Array.from(countByMonth.keys()).sort((a, b) => a.localeCompare(b))[0];
    }

    // determinar mes final a partir de los conteos
    let endMonth = null;
    if (countByMonth.size > 0) {
      endMonth = Array.from(countByMonth.keys()).sort((a, b) => a.localeCompare(b)).slice(-1)[0];
    }

    // construir serie continua desde startMonth hasta endMonth
    const purchasesPerMonth = [];
    const valuePerMonth = [];
    if (startMonth && endMonth) {
      let cursor = dayjs(startMonth + "-01");
      const last = dayjs(endMonth + "-01");
      while (cursor.isBefore(last) || cursor.isSame(last, "month")) {
        const key = cursor.format("YYYY-MM");
        purchasesPerMonth.push({ month: key, count: countByMonth.get(key) || 0 });
        valuePerMonth.push({ month: key, value: valueSumByMonth.get(key) || 0 });
        cursor = cursor.add(1, "month");
      }
    }

    const withPriceCount = withPrice.length;

    return { totalBooks, withPriceCount, totalValue, booksByPlace, valueByPlace, purchasesPerMonth, valuePerMonth };
  }, [mapped]);

  const currency = useMemo(() => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }), []);
  const integer = useMemo(() => new Intl.NumberFormat("es-CO"), []);
  const compact = useMemo(() => new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }), []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text)" }}>
      <div className="container">
        <header style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Reporte de libros</h1>
            <p style={{ color: "var(--muted)", marginTop: 6 }}>Sube tu archivo CSV/XLSX de BookBuddy para ver estadísticas.</p>
          </div>
          <div>
            <button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid var(--card-border)`,
                background: "var(--card-bg)",
                color: "var(--text)",
                cursor: "pointer"
              }}
            >
              {theme === "light" ? "Oscuro" : "Claro"}
            </button>
          </div>
        </header>

        {/* Uploader + resumen en un grid de 1-4 columnas responsivo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
          <div className="card" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", textAlign: "center" }}>
              <Upload style={{ height: 40, width: 40, marginBottom: 8 }} />
              <div>
                <p style={{ margin: 0 }}>Archivo <strong>BookBuddy</strong> (.csv o .xlsx)</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Incluye columnas: Title, Purchase Date, Purchase Place, Purchase Price.</p>
              </div>
              <div style={{ marginTop: 12 }}>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>
              {fileName && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Archivo cargado: {fileName}</p>}
            </div>
          </div>

          {/* KPI cards */}
          <div className="card" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div style={{ gridColumn: "span 12 / span 12" }} className="kpi-grid">
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Total de libros (todos)</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{integer.format(stats.totalBooks || 0)}</p>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Con precio (para estadísticas)</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{integer.format(stats.withPriceCount || 0)}</p>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Valor total (solo con precio)</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{currency.format(stats.totalValue || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos: se cargan de forma diferida para reducir bundle inicial */}
        <React.Suspense fallback={<div className="card" style={{ marginTop: 16 }}>Cargando gráficos…</div>}>
          {(stats?.withPriceCount || 0) > 0 && (
            <Charts stats={stats} compact={compact} currency={currency} integer={integer} />
          )}
        </React.Suspense>

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
          Nota: Las estadísticas excluyen filas sin precio; el total de libros incluye todos los registros.
        </p>

        <footer style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid var(--card-border)', color: 'var(--muted)', fontSize: 14 }}>
          Desarrollado en Cursor por{' '}
          <a
            href="https://github.com/JorgeZuluaga/MiTsundoku"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Jorge I. Zuluaga
          </a>
        </footer>
      </div>
    </div>
  );
}
