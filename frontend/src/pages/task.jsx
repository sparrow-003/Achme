import React, { useState, useEffect } from "react";
import { Search, Plus, X, TrendingUp, Target as TargetIcon, Calendar, BarChart3, Users, CheckCircle } from "lucide-react";
import "../Styles/tailwind.css";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const Task = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedtaskId, setSelectedtaskId] = useState(null);

  // Task Target states
  const [taskTargets, setTaskTargets] = useState([]);
  const [myTarget, setMyTarget] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [updateCount, setUpdateCount] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");

  // Target form state
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({
    user_name: "",
    yearly_target: "",
    monthly_target: ""
  });

  const [teamMembers, setTeamMembers] = useState([]);

  /* Admin: Fetch all tasks and targets */
  const fetchAllTasks = async () => {
    try {
      const [tasksRes, targetsRes] = await Promise.all([
        axios.get("http://localhost:3000/api/task"),
        axios.get("http://localhost:3000/api/task/targets")
      ]);
      setTasks(tasksRes.data);
      setTaskTargets(targetsRes.data);
    } catch (err) {
      console.error("Fetch tasks/targets error:", err);
    }
  };

  /* User: Fetch my tasks and target */
  const fetchMyTasks = async () => {
    try {
      const [tasksRes, targetRes, assignedRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/task/assigned/${encodeURIComponent(user?.name || "")}`),
        axios.get(`http://localhost:3000/api/task/targets/my?user_name=${encodeURIComponent(user?.name || "")}`),
        axios.get(`http://localhost:3000/api/task/targets/history?user_name=${encodeURIComponent(user?.name || "")}&months=12`)
      ]);
      setMyTasks(tasksRes.data);
      setMyTarget(targetRes.data);
      setTaskHistory(assignedRes.data);
      // Format for graph
      const graph = assignedRes.data.map(h => ({
        month: h.month_year,
        achieved: parseInt(h.achieved_count) || 0,
        target: parseInt(h.monthly_target) || 0
      }));
      setGraphData(graph.reverse());
    } catch (err) {
      console.error("Fetch my tasks error:", err);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/teammember");
      setTeamMembers(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllTasks();
    } else {
      fetchMyTasks();
    }
    fetchTeamMembers();
  }, []);

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/task/${id}`);
      if (isAdmin) {
        fetchAllTasks();
      } else {
        fetchMyTasks();
      }
    } catch (err) { console.log("delete error", err); }
  };

  const resetForm = () => {
    setForm({
      project_name: "",
      task_title: "",
      client_name: "",
      staff_name: "",
      created_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      project_status: "",
      project_priority: "",
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

  /* Target Management Functions */
  const saveTarget = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/task/targets", {
        ...targetForm,
        created_by_admin: user?.name || "Admin"
      });
      alert("Task target saved successfully");
      setTargetOpen(false);
      fetchAllTasks();
    } catch (err) {
      alert("Failed to save target: " + (err.response?.data?.error || err.message));
    }
  };

  const updateTaskAchievement = async () => {
    if (!updateCount) return alert("Please enter task count");
    try {
      await axios.post("http://localhost:3000/api/task/targets/update", {
        user_id: user?.id,
        user_name: user?.name,
        count: parseInt(updateCount),
        description: updateDesc
      });
      alert("Task achievement updated!");
      setUpdateCount("");
      setUpdateDesc("");
      fetchMyTasks();
    } catch (err) {
      alert("Failed to update: " + (err.response?.data?.error || err.message));
    }
  };

  const assignTask = async (taskId, userName, userId) => {
    try {
      await axios.post("http://localhost:3000/api/task/assign", {
        task_id: taskId,
        assigned_to_user_name: userName,
        assigned_to_user_id: userId,
        assigned_by: user?.name || "Admin"
      });
      alert("Task assigned successfully!");
      fetchAllTasks();
    } catch (err) {
      alert("Failed to assign task: " + (err.response?.data?.error || err.message));
    }
  };

  const updateTaskStatus = async (assignmentId, status) => {
    try {
      await axios.put(`http://localhost:3000/api/task/assignment/${assignmentId}/status`, { status });
      fetchMyTasks();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
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
      let taskId;
      if (isEdit) {
        await axios.put(`http://localhost:3000/api/task/${selectedtaskId}`, form);
        taskId = selectedtaskId;
      } else {
        const res = await axios.post("http://localhost:3000/api/task", form);
        taskId = res.data.id;
      }

      // If staff_name is specified and we're admin, assign the task
      if (form.staff_name && isAdmin && taskId) {
        const selectedStaff = teamMembers.find(t => `${t.first_name} ${t.last_name || ""}`.trim() === form.staff_name);
        if (selectedStaff) {
          await assignTask(taskId, form.staff_name, selectedStaff.id);
        }
      }

      resetForm();
      setOpen(false);
      if (isAdmin) {
        fetchAllTasks();
      } else {
        fetchMyTasks();
      }
    } catch (err) {
      console.log("Save Error:", err);
      alert(err.response?.data?.message || "Failed to save task. Check backend.");
    }
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

  const TaskCard = ({ t, color, isAdmin = false, onAssign, teamMembers = [] }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm text-gray-800">{t.task_title}</p>
        <span className={`px-2 py-0.5 text-xs rounded-full text-white font-medium ${
          t.project_priority === "High" || t.project_priority === "Urgent"
            ? "bg-red-500" : t.project_priority === "Normal" ? "bg-blue-500" : "bg-gray-400"
        }`}>{t.project_priority}</span>
      </div>
      <p className="text-xs text-gray-500">📁 <span className="text-gray-700">{t.project_name}</span></p>
      <p className="text-xs text-gray-500 mt-1">👤 <span className="text-gray-700">{t.client_name || "---"}</span></p>
      <p className="text-xs text-gray-500 mt-1">🗓 {t.created_date?.split("T")[0]} → {t.due_date?.split("T")[0]}</p>
      {t.staff_name && <p className="text-xs text-gray-500 mt-1">👷 <span className="text-gray-700">{t.staff_name}</span></p>}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        {isAdmin && !t.staff_name ? (
          <select
            onChange={(e) => {
              const selectedStaff = teamMembers.find(tm => `${tm.first_name} ${tm.last_name || ""}`.trim() === e.target.value);
              if (selectedStaff && onAssign) {
                onAssign(t.id, e.target.value, selectedStaff.id);
              }
            }}
            className="text-xs border rounded px-2 py-1"
            defaultValue=""
          >
            <option value="" disabled>Assign to...</option>
            {teamMembers.map(tm => (
              <option key={tm.id} value={`${tm.first_name} ${tm.last_name || ""}`.trim()}>
                {tm.first_name} {tm.last_name || ""} ({tm.job_title || "Staff"})
              </option>
            ))}
          </select>
        ) : (
          <div></div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => openEditModal(t)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
          <button type="button" onClick={() => deleteTask(t.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1694CE]">
          {isAdmin ? "Task Management" : "My Tasks"}
        </h1>
        <a className="text-sm text-gray-500" href="/dashboard">Dashboard > Tasks</a>
      </div>

      {/* Admin View */}
      {isAdmin ? (
        <>
          {/* Search + Buttons */}
          <div className="bg-[#F3F8FA] p-4 rounded-xl flex justify-between items-center shadow mb-4">
            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow border w-80">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search by project name..."
                className="outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTargetOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <TargetIcon size={18} /> Set Targets
              </button>
              <button
                onClick={() => { resetForm(); setOpen(true); }}
                className="bg-[#FF3355] text-white w-12 h-12 rounded-full flex justify-center items-center shadow-lg hover:bg-[#e62848]"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          {/* Task Targets Table */}
          <div className="bg-white rounded-xl shadow overflow-x-auto mb-6">
            <h3 className="text-lg font-semibold p-4 border-b">Task Targets Overview</h3>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase text-gray-500 font-bold border-b">
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-right">Yearly Target</th>
                  <th className="p-3 text-right">Monthly Target</th>
                  <th className="p-3 text-right">Completed (MTD)</th>
                  <th className="p-3 text-right">Pending (MTD)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {taskTargets.filter(t => t.user_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{t.user_name}</td>
                    <td className="p-3 text-right">{t.yearly_target}</td>
                    <td className="p-3 text-right">{t.monthly_target}</td>
                    <td className="p-3 text-right text-green-600 font-medium">{t.achieved_count}</td>
                    <td className="p-3 text-right text-orange-600 font-medium">{t.pending_count}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.achieved_count >= t.monthly_target ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {t.achieved_count >= t.monthly_target ? "Achieved" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tasks List */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#FFF8F0] rounded-xl shadow p-4 min-h-[300px]">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span> New
                <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {tasks.filter(t => t.project_status === "New").length}
                </span>
              </h3>
              {tasks.filter(t => t.project_status === "New" && t.project_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                <TaskCard key={t.id} t={t} color="orange" isAdmin={true} onAssign={assignTask} teamMembers={teamMembers} />
              ))}
              {tasks.filter(t => t.project_status === "New").length === 0 && <p className="text-xs text-gray-400 text-center py-8">No new tasks</p>}
            </div>

            <div className="bg-[#F0F4FF] rounded-xl shadow p-4 min-h-[300px]">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> In Process
                <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {tasks.filter(t => t.project_status === "Process").length}
                </span>
              </h3>
              {tasks.filter(t => t.project_status === "Process" && t.project_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                <TaskCard key={t.id} t={t} color="blue" isAdmin={true} onAssign={assignTask} teamMembers={teamMembers} />
              ))}
              {tasks.filter(t => t.project_status === "Process").length === 0 && <p className="text-xs text-gray-400 text-center py-8">No tasks in process</p>}
            </div>

            <div className="bg-[#F0FFF6] rounded-xl shadow p-4 min-h-[300px]">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Completed
                <span className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {tasks.filter(t => t.project_status === "Completed").length}
                </span>
              </h3>
              {tasks.filter(t => t.project_status === "Completed" && t.project_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                <TaskCard key={t.id} t={t} color="green" isAdmin={true} onAssign={assignTask} teamMembers={teamMembers} />
              ))}
              {tasks.filter(t => t.project_status === "Completed").length === 0 && <p className="text-xs text-gray-400 text-center py-8">No completed tasks</p>}
            </div>
          </div>
        </>
      ) : (
        /* User View */
        <div className="space-y-6">
          {/* My Task Target Card */}
          {myTarget ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-500">Yearly Target</p>
                  <p className="text-2xl font-bold text-blue-600">{myTarget.yearly_target}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-500">Monthly Target</p>
                  <p className="text-2xl font-bold text-green-600">{myTarget.monthly_target}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-500">Pending (MTD)</p>
                  <p className="text-2xl font-bold text-orange-600">{myTarget.pending_count}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-yellow-700">No task target set for you yet. Please contact admin.</p>
            </div>
          )}

          {/* Update Achievement */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" /> Update Task Achievement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tasks Completed Today</label>
                <input
                  type="number"
                  value={updateCount}
                  onChange={(e) => setUpdateCount(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <input
                  type="text"
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="e.g. Completed client presentation tasks"
                />
              </div>
              <button
                onClick={updateTaskAchievement}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Update Achievement
              </button>
            </div>
          </div>

          {/* Progress Graph */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Monthly Task Progress
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} tasks`} />
                  <Line type="monotone" dataKey="target" stroke="#6366f1" name="Target" strokeWidth={2} />
                  <Line type="monotone" dataKey="achieved" stroke="#22c55e" name="Achieved" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* My Assigned Tasks */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">My Assigned Tasks</h3>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks assigned yet</p>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{task.task_title}</h4>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Project: {task.project_name}</p>
                    <p className="text-sm text-gray-600 mb-1">Client: {task.client_name}</p>
                    <p className="text-sm text-gray-600">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === "Completed" ? "bg-green-100 text-green-700" :
                        task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.priority === "Urgent" ? "bg-red-100 text-red-700" :
                        task.priority === "High" ? "bg-orange-100 text-orange-700" :
                        task.priority === "Normal" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievement History */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Task Achievement History</h3>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase text-gray-500 font-bold border-b">
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Target</th>
                  <th className="p-2 text-right">Achieved</th>
                  <th className="p-2 text-right">Balance</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.map(h => (
                  <tr key={h.month_year} className="border-b hover:bg-gray-50">
                    <td className="p-2">{h.month_year}</td>
                    <td className="p-2 text-right">{h.monthly_target}</td>
                    <td className="p-2 text-right text-green-600">{h.achieved_count}</td>
                    <td className="p-2 text-right text-orange-600">{h.monthly_target - h.achieved_count}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        h.achieved_count >= h.monthly_target ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {h.achieved_count >= h.monthly_target ? "Achieved" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEdit ? "Edit Task" : "Create New Task"}</h2>
              <X className="cursor-pointer" onClick={() => setOpen(false)} />
            </div>
            <form onSubmit={saveTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Name *</label>
                  <input
                    type="text"
                    name="project_name"
                    value={form.project_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Task Title *</label>
                  <input
                    type="text"
                    name="task_title"
                    value={form.task_title}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Client Name</label>
                  <input
                    type="text"
                    name="client_name"
                    value={form.client_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Staff Name</label>
                  <select
                    name="staff_name"
                    value={form.staff_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1 bg-white"
                  >
                    <option value="">-- Select Staff --</option>
                    {teamMembers.map(t => (
                      <option key={t.id} value={`${t.first_name} ${t.last_name || ""}`.trim()}>
                        {t.first_name} {t.last_name || ""} {t.job_title ? `(${t.job_title})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created Date</label>
                  <input
                    type="date"
                    name="created_date"
                    value={form.created_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status *</label>
                  <select
                    name="project_status"
                    value={form.project_status}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="New">New</option>
                    <option value="Process">Process</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Priority *</label>
                <select
                  name="project_priority"
                  value={form.project_priority}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Task</button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Setting Modal */}
      {targetOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Set Task Target</h2>
              <X className="cursor-pointer" onClick={() => setTargetOpen(false)} />
            </div>
            <form onSubmit={saveTarget} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">User Name</label>
                <input
                  type="text"
                  name="user_name"
                  value={targetForm.user_name}
                  onChange={(e) => setTargetForm({...targetForm, [e.target.name]: e.target.value})}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="e.g. Prince.SD"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Yearly Target (Tasks)</label>
                <input
                  type="number"
                  name="yearly_target"
                  value={targetForm.yearly_target}
                  onChange={(e) => setTargetForm({...targetForm, [e.target.name]: e.target.value})}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="e.g. 1200"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Monthly Target (Tasks)</label>
                <input
                  type="number"
                  name="monthly_target"
                  value={targetForm.monthly_target}
                  onChange={(e) => setTargetForm({...targetForm, [e.target.name]: e.target.value})}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="e.g. 100"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Set Target</button>
                <button type="button" onClick={() => setTargetOpen(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;