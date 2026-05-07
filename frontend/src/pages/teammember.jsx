import React, { useState,useEffect} from "react";
import "../Styles/tailwind.css";
import { Search, Plus, X,Trash2,Edit,Mail } from "lucide-react";
import axios from "axios";

const Team = () => {
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailMessage, setMailMessage] = useState("");
  const [mailName, setMailName] = useState("");

const [team,setTeam] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [isEdit, setIsEdit] = useState(false);
const [editId, setEditId] = useState(null);

const tabopen = () => {
  resetForm();
  setOpen(true);
};

//  Fetch All Data;
const fetchTeam = async()=>{
 try {
  const res = await axios.get("http://localhost:3000/api/teammember");
  setTeam(res.data);
 } catch (err) {
  console.log("Error fetching team:", err);
 }
};

useEffect(()=>{
 fetchTeam();
},[]);

  const [form, setForm] = useState({
         first_name:"",
         last_name: "",
         emp_email: "",
         mobile: "",
         job_title: "",
         emp_role: "",
         quotation_count: 0
    });
  

  const handleChange = (e) =>{
    setForm({...form, [e.target.name]: e.target.value});
  };

 const saveTeam = async (e) =>{
  e.preventDefault();

  try {
    if(isEdit){
      await axios.put(`http://localhost:3000/api/teammember/${editId}`, form);
      alert("Successfully Updated");
    } else{
      await axios.post("http://localhost:3000/api/teammember/new", form);
      alert("Successfully Created");
    }

    fetchTeam();  
    resetForm();
    setOpen(false);
  } catch (err) {
    console.log("Error saving team member:", err);
  }
};



//  Edit
const editTeam = (data)=>{
  setForm({
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    emp_email: data.emp_email || "",
    mobile: data.mobile || "",
    job_title: data.job_title || "",
    emp_role: data.emp_role || "",
    quotation_count: data.quotation_count || 0
  });

  setEditId(data.id);
  setIsEdit(true);
  setOpen(true);
};


// Reset Form:
const resetForm = ()=>{
 setForm({
  first_name:"",
  last_name:"",
  emp_email:"",
  mobile:"",
  job_title:"",
  emp_role:"",
  quotation_count: 0
 });
 setIsEdit(false);
 setEditId(null);
};



// Delete:
 const deletefield = async (id) => {
  if(!window.confirm("Are you sure?")) return;
  try {
    await axios.delete(`http://localhost:3000/api/teammember/${id}`);
    fetchTeam();
    window.dispatchEvent(new Event("refresh-dashboard")); 
  } catch (err) {
    alert("Error deleting team member", err)
  }
};

const openMailModal = (member) => {
  setMailTo(member.emp_email || "");
  setMailName(member.first_name || "");
  setMailSubject("Work Information");
  setMailMessage(`Hello ${member.first_name},\n\n`);
  setMailOpen(true);
};

const handleSendMail = () => {
  if (!mailTo) return alert("No email address for this member");
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(mailTo)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailMessage)}`;
  window.open(gmailUrl, "_blank");
  setMailOpen(false);
};


  return (
    <div className="invoices-main-tab">
      <div className="invoice-heading-tab flex gap-4 justify-between item-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1694CE] uppercase">Team Members</h2>
          <a className="text-sm text-gray-500" href="/dashboard">
            Dashboard &gt; Team &gt; Team Member
          </a>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-3 bg-gray px-2 py-1 rounded-lg  border w-50 h-9 mt-3">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by employee name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="Search outline-none text-sm w-full bg-gray-100"
            />
          </div>

          <div className="mt-2">
            <button
              onClick={tabopen}
              className="bg-[#FF3355] text-white w-12 h-12 rounded-full flex justify-center items-center shadow-lg hover:bg-[#e62848] "
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto ">
        <div className={`overlay ${open ? "show" : ""} overflow-y-auto  `}>
          <div className={`task-application bg-white shadow-2xl ml-[25%] w-[60%] mt-[60px] mb-[50px] overflow-y-auto p-8 rounded-xl z-50 ${open ? "show" : ""}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold mb-8 text-gray-700 mt-[10px]">
                {isEdit ? "Edit Team Member" : "Create A New Team Member"}
              </h2>
              <span className="mt-[-20px] x-icon cursor-pointer" onClick={() => setOpen(false)} >
                <X />
              </span>
            </div>
     
          {/* Form */}

            <form onSubmit={saveTeam} className=" invoice-form space-y-6 relative ">

          {/* First Name */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label className="text-sm text-gray-600 text-left">First Name <span className="text-red-500">*</span></label>
            <input type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Enter first name" required className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* Last Name */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label className="text-sm text-gray-600 text-left">Last Name <span className="text-red-500">*</span></label>
            <input type="text" name="last_name" placeholder="Enter last name" value={form.last_name} onChange={handleChange} required className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* Email */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label  className="text-sm text-gray-600 text-left">Email <span className="text-red-500">*</span></label>
            <input type="email" name="emp_email" value={form.emp_email} onChange={handleChange} placeholder="Enter email address" required className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label className="text-sm text-gray-600 text-left">Phone</label>
            <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="Enter phone number" className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* Job Title */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label className="text-sm text-gray-600 text-left">Job Title <span className="text-red-500">*</span></label>
            <input type="text" name="job_title" value={form.job_title} onChange={handleChange} placeholder="Enter job title" required className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* Quotation Count */}
          <div className="grid grid-cols-4 items-center gap-6">
            <label className="text-sm text-gray-600 text-left">Quotation Count</label>
            <input type="number" name="quotation_count" value={form.quotation_count} onChange={handleChange} placeholder="Enter quotation count" className="col-span-3 border rounded-md px-3 py-2 outline-none bg-white w-[100%]" />
          </div>

          {/* ROLE – CUSTOM DROPDOWN */}
           <div className="grid grid-cols-4 items-center gap-6 ">
               <label className="text-sm text-gray-600 text-left">Role <span className="text-red-500">*</span></label>

            <div className="select-method-tab relative w-full col-span-3">
               <input
                readOnly
                value={form.emp_role}
                onClick={() => setRoleOpen(!roleOpen)}
                name="emp_role"
                placeholder="Select role"
                required
                className=" border rounded-md px-3 py-2 outline-none bg-white w-[100%] cursor-pointer"
                />

              <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-[#cfcfcf] z-30 transition-all duration-200 ${roleOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                {["Developer", "BDM", "Manager", "Sales"].map((item) => (
                  <div key={item} onClick={() => { setRoleOpen(false); setForm({ ...form, emp_role: item }); }} className="px-3 py-2 cursor-pointer hover:bg-blue-600 hover:text-white text-left">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[13px] text-[#777]">* Required</p>

          <div className="flex gap-4 pt-4">
                <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">Submit</button>
                <button onClick={() => setOpen(false)} type="button" className="bg-gray-400 text-white px-8 py-2 rounded-lg hover:bg-red-500 transition shadow-md">Close</button>
              </div>
        </form>           
          </div>
        </div>

        {/* table */}
       <div className="mt-[60px] bg-white shadow rounded-xl overflow-hidden">
    <table className="w-full border-collapse bg-white font-[Times-New-Roman] text-center">
  <thead className="bg-[#f8faf9] border-b">
    <tr className="text-sm text-[#1694CE] uppercase">
      <th className="p-4 border">ID </th>
      <th className="p-4 border">Employee Name </th>
      <th className="p-4 border">Email</th>
      <th className="p-4 border">Job Title</th>
       <th className="p-4 border">Job Role</th>
       <th className="p-4 border">Quotes</th>
      <th className="p-4 border">Action</th>
    </tr>
  </thead>

  <tbody>
  {team.length === 0 ? (
    <tr>
      <td colSpan="7" className="text-center py-10 text-gray-400 italic">No members found</td>
    </tr>
  ) : (
    team.filter(E => `${E.first_name} ${E.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map((E) => (
      <tr key={E.id} className="border-b hover:bg-gray-50 transition text-sm">
        <td className="p-4 border">{E.id}</td>
        <td className="p-4 border font-medium">{E.first_name} {E.last_name}</td>
        <td className="p-4 border">{E.emp_email || "---"}</td>
        <td className="p-4 border">{E.job_title || "---"}</td>
        <td className="p-4 border">{E.emp_role || "---"}</td>
        <td className="p-4 border">{E.quotation_count || 0}</td>
        <td className="p-4 border">
         <div className="flex justify-center gap-3">
             <button type="button" onClick={() => deletefield(E.id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
               <Trash2 size={18} />
             </button>
              <button type="button" onClick={() => editTeam(E)} className="text-green-600 hover:text-green-800 transition" title="Edit">
                <Edit size={18} />
               </button>
               <button type="button" onClick={() => openMailModal(E)} className="text-yellow-600 hover:text-yellow-800 transition" title="Send Email">
                <Mail size={18} />
               </button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>
</table>
</div> 
      </div>

      {/* Mail Modal */}
      {mailOpen && (
        <div className="overlay show flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-lg p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Mail size={20} /> Send Email to {mailName}</h2>
              <X className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setMailOpen(false)} />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">To (Email)</label>
                <input type="email" value={mailTo} readOnly className="border rounded-lg px-4 py-2 outline-none bg-gray-50 text-gray-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                <input type="text" value={mailSubject} onChange={e => setMailSubject(e.target.value)} className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
                <textarea value={mailMessage} onChange={e => setMailMessage(e.target.value)} rows={5} className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button onClick={handleSendMail} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow transition">
                Open in Gmail
              </button>
              <button onClick={() => setMailOpen(false)} className="bg-gray-200 text-gray-600 px-8 py-2.5 rounded-lg hover:bg-gray-300 font-bold transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
