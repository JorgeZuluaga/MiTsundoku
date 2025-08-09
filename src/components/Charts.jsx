import React from "react";
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

export default function Charts({ stats, compact, currency, integer }) {
  return (
    <>
      {/* Secciones de gráficos en grid 2 columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, marginTop: 16 }}>
        <section className="card" style={{ gridColumn: "span 12 / span 12" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Libros por "Purchase Place" (top 20)</h2>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(stats.booksByPlace || []).slice(0, 20)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="place" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Cantidad" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card" style={{ gridColumn: "span 12 / span 12" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Valor total por "Purchase Place" (top 20)</h2>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(stats.valueByPlace || []).slice(0, 20)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="place" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => compact.format(v)} domain={[0, 'auto']} />
                <Tooltip formatter={(v) => currency.format(v)} />
                <Legend />
                <Bar dataKey="value" name="Valor" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Series temporales */}
      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Libros por mes</h2>
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.purchasesPerMonth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => integer.format(v)} />
              <Legend />
              <Line type="monotone" dataKey="count" name="Compras mensuales" stroke="#0ea5e9" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Valor comprado por mes</h2>
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.valuePerMonth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => compact.format(v)} domain={[0, 'auto']} />
              <Tooltip formatter={(v) => currency.format(v)} />
              <Legend />
              <Line type="monotone" dataKey="value" name="Valor mensual" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}


