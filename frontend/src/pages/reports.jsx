import React, { useState, useEffect } from "react";
import "../Styles/tailwind.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { normalizeDate, getToday } from "../utils/leadutil";

const Reports = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("day"); // day | week | month | year

  const [telecalls, setTelecalls] = useState([]);
  const [walkins, setWalkins] = useState([]);
  const [fields, setFields] = useState([]);
  const [performaInvoices, setPerformaInvoices] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:3000/api/Telecalls"),
      axios.get("http://localhost:3000/api/Walkins"),
      axios.get("http://localhost:3000/api/Fields"),
      axios.get("http://localhost:3000/api/performainvoice"),
    ]).then(([t, w, f, pi]) => {
      setTelecalls(t.data);
      setWalkins(w.data);
      setFields(f.data);
      setPerformaInvoices(pi.data);
    }).catch(console.error);
  }, []);

  const today = getToday();

  const getStartDate = () => {
    const d = new Date();
    if (filter === "day") {
      return today;
    } else if (filter === "week") {
      d.setDate(d.getDate() - 6);
    } else if (filter === "month") {
      d.setDate(1);
    } else if (filter === "year") {
      d.setMonth(0);
      d.setDate(1);
    }
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  const startDate = getStartDate();

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = normalizeDate(dateStr);
    return d >= startDate && d <= today;
  };

  // Filter data
  const filteredCalls = telecalls.filter(t => inRange(t.call_date));
  const filteredWalkins = walkins.filter(w => inRange(w.walkin_date));
  const filteredFields = fields.filter(f => inRange(f.visit_date));
  const filteredInvoices = performaInvoices.filter(p => inRange(p.invoice_date));

  // Metrics
  const totalSales = filteredInvoices.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
  const totalCalls = filteredCalls.length;
  const totalVisitors = filteredWalkins.length;
  const totalFieldWork = filteredFields.length;

  const convertedCalls = filteredCalls.filter(t => t.call_outcome === "Converted").length;
  const convertedWalkins = filteredWalkins.filter(w => w.walkin_status === "Converted").length;
  const convertedFields = filteredFields.filter(f => f.field_outcome === "Converted").length;

  const filterLabel = { day: "Today", week: "This Week", month: "This Month", year: "This Year" };

  const MetricCard = ({ title, value, sub, color, onClick }) => (
    <div
      className="rounded-xl p-6 bg-shell text-shell-text shadow-lg cursor-pointer hover:shadow-xl transition"
      onClick={onClick}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h2>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  // Build day-by-day breakdown for the selected range
  const getDaysInRange = () => {
    const days = [];
    const start = new Date(startDate);
    const end = new Date(today);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      days.push(dateStr);
    }
    return days;
  };

  const days = getDaysInRange();

  const formatDisplayDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short",
      year: (filter === "month" || filter === "year") ? "numeric" : undefined
    });
  };

  // For yearly view, group by month instead of day-by-day
  const getYearlyMonths = () => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, "0");
      return `${year}-${m}`;
    });
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="w-full p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1694CE]">Reports</h2>
          <span className="text-sm text-gray-500">Dashboard &gt; Reports</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {["day", "week", "month", "year"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                filter === f
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "day" ? "Day" : f === "week" ? "Weekly" : f === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6 italic">Showing data for: <strong className="text-gray-600">{filterLabel[filter]}</strong></p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          title="Total Sales"
          value={`₹${totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${filteredInvoices.length} invoice(s)`}
          color="text-blue-600"
          onClick={() => navigate("/dashboard/performainvoice")}
        />
        <MetricCard
          title="Visitors (Walk-ins)"
          value={totalVisitors}
          sub={`${convertedWalkins} converted`}
          color="text-green-600"
          onClick={() => navigate("/dashboard/walkins")}
        />
        <MetricCard
          title="Total Calls"
          value={totalCalls}
          sub={`${convertedCalls} converted`}
          color="text-orange-500"
          onClick={() => navigate("/dashboard/telecalling")}
        />
        <MetricCard
          title="Field Work"
          value={totalFieldWork}
          sub={`${convertedFields} converted`}
          color="text-purple-600"
          onClick={() => navigate("/dashboard/field")}
        />
      </div>

      {/* Detailed Table */}
      <div className="bg-shell text-shell-text rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {filter === "year" ? "Month-wise Breakdown" : "Day-wise Breakdown"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse min-w-[600px]">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 border-b text-left">{filter === "year" ? "Month" : "Date"}</th>
                <th className="px-4 py-3 border-b">Sales (₹)</th>
                <th className="px-4 py-3 border-b">Visitors</th>
                <th className="px-4 py-3 border-b">Calls</th>
                <th className="px-4 py-3 border-b">Field Work</th>
              </tr>
            </thead>
            <tbody>
              {filter === "year"
                ? getYearlyMonths().map((ym, idx) => {
                    const [y, m] = ym.split("-");
                    const mSales = performaInvoices
                      .filter(p => { const d = normalizeDate(p.invoice_date); return d.startsWith(`${y}-${m}`); })
                      .reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
                    const mVisitors = walkins.filter(w => normalizeDate(w.walkin_date).startsWith(`${y}-${m}`)).length;
                    const mCalls = telecalls.filter(t => normalizeDate(t.call_date).startsWith(`${y}-${m}`)).length;
                    const mField = fields.filter(f => normalizeDate(f.visit_date).startsWith(`${y}-${m}`)).length;
                    return (
                      <tr key={ym} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-left font-medium text-gray-700">{monthNames[idx]} {y}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{mSales > 0 ? `₹${mSales.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-4 py-3">{mVisitors || "—"}</td>
                        <td className="px-4 py-3">{mCalls || "—"}</td>
                        <td className="px-4 py-3">{mField || "—"}</td>
                      </tr>
                    );
                  })
                : days.map(day => {
                    const daySales = performaInvoices
                      .filter(p => normalizeDate(p.invoice_date) === day)
                      .reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
                    const dayVisitors = walkins.filter(w => normalizeDate(w.walkin_date) === day).length;
                    const dayCalls = telecalls.filter(t => normalizeDate(t.call_date) === day).length;
                    const dayField = fields.filter(f => normalizeDate(f.visit_date) === day).length;
                    return (
                      <tr key={day} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-left font-medium text-gray-700">{formatDisplayDate(day)}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{daySales > 0 ? `₹${daySales.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-4 py-3">{dayVisitors || "—"}</td>
                        <td className="px-4 py-3">{dayCalls || "—"}</td>
                        <td className="px-4 py-3">{dayField || "—"}</td>
                      </tr>
                    );
                  })
              }
              {/* Totals row */}
              <tr className="bg-blue-50 font-bold text-gray-800 border-t-2 border-blue-200">
                <td className="px-4 py-3 text-left text-blue-700">TOTAL</td>
                <td className="px-4 py-3 text-blue-700">₹{totalSales.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-blue-700">{totalVisitors}</td>
                <td className="px-4 py-3 text-blue-700">{totalCalls}</td>
                <td className="px-4 py-3 text-blue-700">{totalFieldWork}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-shell text-shell-text rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-600 mb-4 border-b pb-2">Telecalling Outcomes</h4>
          {["New", "Converted", "Disqualified"].map(status => {
            const count = filteredCalls.filter(t => t.call_outcome === status).length;
            return (
              <div key={status} className="flex justify-between items-center py-2">
                <span className="text-sm">{status}</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs text-white ${
                  status === "Converted" ? "bg-green-500" : status === "New" ? "bg-orange-500" : "bg-red-500"
                }`}>{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-shell text-shell-text rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-600 mb-4 border-b pb-2">Walk-in Outcomes</h4>
          {["New", "Converted", "Disqualified"].map(status => {
            const count = filteredWalkins.filter(w => w.walkin_status === status).length;
            return (
              <div key={status} className="flex justify-between items-center py-2">
                <span className="text-sm">{status}</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs text-white ${
                  status === "Converted" ? "bg-green-500" : status === "New" ? "bg-orange-500" : "bg-red-500"
                }`}>{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-shell text-shell-text rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-600 mb-4 border-b pb-2">Field Work Outcomes</h4>
          {["New", "Converted", "Disqualified"].map(status => {
            const count = filteredFields.filter(f => f.field_outcome === status).length;
            return (
              <div key={status} className="flex justify-between items-center py-2">
                <span className="text-sm">{status}</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs text-white ${
                  status === "Converted" ? "bg-green-500" : status === "New" ? "bg-orange-500" : "bg-red-500"
                }`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;
