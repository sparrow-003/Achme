import React, { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import "../Styles/tailwind.css";
import axios from "axios";

const Task = () => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedtaskId, setSelectedtaskId] = useState(null);

  const fetchtask = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/task");
      setTasks(res.data);
    } catch (err) {
      console.log("Fetch Error:", err);
    }
  };

  const [teamMembers, setTeamMembers] = useState([]);

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/teammember");
      setTeamMembers(res.data);
    } catch (_) {}
  };

  useEffect(() => { fetchtask(); fetchTeamMembers(); }, []);

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/task/${id}`);
      fetchtask();
    } catch (err) { console.log("delete error", err); }
  };

  const [form, setForm] = useState({
    project_name: "",
    task_title: "",
    client_name: "",
    staff_name: "",
    created_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    project_status: "",
    project_priority: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveTask = async (e) => {
    e.preventDefault();
    if (!form.project_name || !form.task_title || !form.project_status || !form.project_priority) {
      alert("Please fill all required fields");
      return;
    }
    try {
      if (isEdit) {
        await axios.put(`http://localhost:3000/api/task/${selectedtaskId}`, form);
      } else {
        await axios.post("http://localhost:3000/api/task", form);
      }
      resetForm();
      setOpen(false);
      fetchtask();
    } catch (err) {
      console.log("Save Error:", err);
      alert(err.response?.data?.message || "Failed to save task. Check backend.");
    }
  };

  const resetForm = () => {
    setForm({
      project_name: "", task_title: "", client_name: "", staff_name: "",
      created_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      project_status: "", project_priority: "",
    });
    setIsEdit(false);
    setSelectedtaskId(null);
  };

  const openEditModal = (t) => {
    setForm({
      project_name: t.project_name || "",
      task_title: t.task_title || "",
      client_name: t.client_name || "",
      staff_name: t.staff_name || "",
      created_date: t.created_date?.split("T")[0] || new Date().toISOString().slice(0, 10),
      due_date: t.due_date?.split("T")[0] || new Date().toISOString().slice(0, 10),
      project_status: t.project_status || "",
      project_priority: t.project_priority || "",
    });
    setSelectedtaskId(t.id);
    setIsEdit(true);
    setOpen(true);
  };

  useEffect(() => {
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  // Filter by project name
  const filtered = tasks.filter(t =>
    t.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newTasks = filtered.filter(t => t.project_status === "New");
  const processTasks = filtered.filter(t => t.project_status === "Process");
  const completedTasks = filtered.filter(t => t.project_status === "Completed");

  const TaskCard = ({ t, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm text-gray-800">{t.task_title}</p>
        <span className={`px-2 py-0.5 text-xs rounded-full text-white font-medium ${
          t.project_priority === "High" || t.project_priority === "Urgent"
            ? "bg-red-500" : t.project_priority === "Normal" ? "bg-blue-500" : "bg-gray-400"
        }`}>{t.project_priority}</span>
      </div>
      <p className="text-xs text-gray-500">📁 <span className="text-gray-700">{t.project_name}</span></p>
      <p className="text-xs text-gray-500 mt-1">👤 <span className="text-gray-700">{t.client_name}</span></p>
      <p className="text-xs text-gray-500 mt-1">🗓 {t.created_date?.split("T")[0]} → {t.due_date?.split("T")[0]}</p>
      <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={() => openEditModal(t)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
        <button type="button" onClick={() => deleteTask(t.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen">
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-[#1694CE]">Tasks</h1>
        <a className="text-sm text-gray-500" href="/dashboard">Dashboard &gt; Tasks</a>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-[#F3F8FA] p-4 rounded-xl flex justify-between items-center shadow mb-4">
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow border w-80">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by project name..."
            className="outline-none text-sm w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { resetForm(); setOpen(true); }} className="bg-[#FF3355] text-white w-12 h-12 rounded-full flex justify-center items-center shadow-lg hover:bg-[#e62848]">
          <Plus size={24} />
        </button>
      </div>

      {/* MODAL */}
      <div className={`overlay ${open ? "show" : ""} justify-items-center`}>
        <div className={`${open ? "show" : ""} task-application bg-white shadow-2xl p-9 rounded-xl w-[60%] z-50`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-700">{isEdit ? "Edit Task" : "Add New Task"}</h2>
            <span className="x-icon cursor-pointer" onClick={() => { setOpen(false); resetForm(); }}><X /></span>
          </div>

          <form onSubmit={saveTask} className="task-form space-y-5">
            {[
              { label: "Project Name *", name: "project_name", type: "text" },
              { label: "Task Title *", name: "task_title", type: "text" },
              { label: "Client Name", name: "client_name", type: "text" },
              { label: "Created Date", name: "created_date", type: "date" },
              { label: "Due Date", name: "due_date", type: "date" },
            ].map(f => (
              <div key={f.name} className="flex items-center gap-6">
                <label className="w-40 text-sm text-gray-600">{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                  className="form-control w-[60%] border rounded-lg p-2 outline-none focus:border-blue-400" />
              </div>
            ))}

            {/* Staff Name — dropdown from Team Members */}
            <div className="flex items-center gap-6">
              <label className="w-40 text-sm text-gray-600">Staff Name</label>
              <select
                name="staff_name"
                value={form.staff_name}
                onChange={handleChange}
                className="form-control w-[60%] border rounded-lg p-2 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">-- Select Staff --</option>
                {teamMembers.map(t => (
                  <option key={t.id} value={`${t.first_name} ${t.last_name || ""}`.trim()}>
                    {t.first_name} {t.last_name || ""} {t.job_title ? `(${t.job_title})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="w-40 text-sm text-gray-600">Status *</label>
              <select name="project_status" value={form.project_status} onChange={handleChange}
                className="form-control w-[60%] border rounded-lg p-2 outline-none">
                <option value="" disabled>Select Status</option>
                <option value="New">New</option>
                <option value="Process">Process</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="w-40 text-sm text-gray-600">Priority *</label>
              <select name="project_priority" value={form.project_priority} onChange={handleChange}
                className="form-control w-[60%] border rounded-lg p-2 outline-none">
                <option value="" disabled>Select Priority</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition shadow">Submit</button>
              <button type="button" onClick={() => { setOpen(false); resetForm(); }} className="bg-gray-400 text-white px-8 py-2 rounded-lg hover:bg-red-500 transition">Close</button>
            </div>
          </form>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="bg-[#FFF8F0] rounded-xl shadow p-4 min-h-[300px]">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span> New
            <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-semibold">{newTasks.length}</span>
          </h3>
          {newTasks.map(t => <TaskCard key={t.id} t={t} color="orange" />)}
          {newTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No new tasks</p>}
        </div>

        <div className="bg-[#F0F4FF] rounded-xl shadow p-4 min-h-[100px]">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> In Process
            <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">{processTasks.length}</span>
          </h3>
          {processTasks.map(t => <TaskCard key={t.id} t={t} color="blue" />)}
          {processTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No tasks in process</p>}
        </div>

        <div className="bg-[#F0FFF6] rounded-xl shadow p-4 min-h-[100px]">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Completed
            <span className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-semibold">{completedTasks.length}</span>
          </h3>
          {completedTasks.map(t => <TaskCard key={t.id} t={t} color="green" />)}
          {completedTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No completed tasks</p>}
        </div>
      </div>
    </div>
  );
};

export default Task;