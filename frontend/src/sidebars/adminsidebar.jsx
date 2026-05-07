import React, { useState, useEffect } from "react";
import {
  Home, Users, ListTodo, Phone, ShoppingCart,
  FileText, Briefcase, Headphones, Users2, BarChart2, ChevronDown, Wrench, Bell, TargetIcon
} from "lucide-react";
import "../Styles/tailwind.css";
import { Link } from "react-router-dom";
import axios from "axios";


const Sidebar = ({ onNavigate }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/auth/notifications");
        // Count unread notifications (is_read = 0)
        const unreadCount = res.data.filter(n => n.is_read === 0).length;
        setPendingCount(unreadCount);
      } catch (_) {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    window.addEventListener("refresh-pending-count", fetchPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-pending-count", fetchPending);
    };
  }, []);

  const menu = [
    { icon: <Home size={20} />, title: "Dashboard", path: "/dashboard" },
    { icon: <Bell size={20} />, title: "Notifications", path: "/dashboard/notifications", badge: pendingCount },
    { icon: <TargetIcon size={20} />, title: "Targets", path: "/dashboard/targets" },
    { icon: <Users size={20} />, title: "Customers", subitems: [{label: "Clients", path: "/dashboard/clients"}] },
    { icon: <ListTodo size={20} />, title: "Tasks", label:"Task", path:"/dashboard/task" },
    { icon: <FileText size={20} />, title: "Contracts", path: "/dashboard/contract" },
    { icon: <Wrench size={20} />, title: "AMC/ALC Services", path: "/dashboard/amc" },
    { icon: <Phone size={20} />, title: "Leads", 
     subitems:[
        {label:"Telecalling Summary",path:"/dashboard/telecalling"}, 
        {label:"Walkins Summary",path:"/dashboard/walkins"},
       {label:"Field Work Summary",path:"/dashboard/field"},
     ]
    },

    { icon: <ShoppingCart size={20} />, title: "Sales", subitems: [
      { label: "Estimation", path: "/dashboard/estimateinvoice" },
      { label: "Proforma Invoice", path: "/dashboard/performainvoice" },
    ] },

    { icon: <FileText size={20} />, title: "Proposals", path: "/dashboard/proposal" },
    {
      icon: <Wrench size={20} />,
      title: "Services",
      subitems: [
        { label: "Products", path: "/dashboard/products" },
        { label: "Service Estimation", path: "/dashboard/serviceestimation" },
        { label: "Call Report", path: "/dashboard/call-report" },
      ]
    },
    { icon: <Briefcase size={20} />, title: "Contracts",
     subitems:[{label:"Contracts", path:"/dashboard/contracts"}] },
    { icon: <Users2 size={20} />, title: "Team",subitems:[{label: "Team Member", path:"/dashboard/team"},"Time Sheets" ] },
    { icon: <BarChart2 size={20} />, title: "Reports", path: "/dashboard/reports" }
  ];

  const toggleMenu = (i) => setOpenMenu(openMenu === i ? null : i);

  return (
   <aside className="side-mainbar">
  <ul className="space-y-1">
    {menu.map((item, i) => (
      <li key={i}>

        {/* MAIN ITEM → With direct path (Dashboard) */}
        {item.path ? (
          <Link
            to={item.path}
            onClick={onNavigate}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-primary-text hover:hover:text-blue-500"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            {item.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </Link>
        ) : (
          <>
            {/* MAIN ITEM → With sub menu (Projects, Sales, etc.) */}
            <button
              onClick={() => toggleMenu(i)}
              className="w-full flex items-center justify-between px-3 py-2 text-primary-text hover:text-blue-500"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.title}</span>
              </div>

              {item.subitems && (
                <ChevronDown
                  size={18}
                  className={`${openMenu === i ? "rotate-180" : ""} transition  `}
                />
              )}
            </button>

            {/* SUBMENU */}
            {openMenu === i && item.subitems && (
              <ul className="ml-9 mt-1 space-y-1 ">
                {item.subitems.map((s, j) => (
                  <li key={j}>
                    <Link
                      to={s.path}
                      onClick={onNavigate}
                      className="text-sm text-primary-text hover:text-blue-500 block submenu font-[Times-Roman] text-[16px]"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

      </li>
    ))}
  </ul>
</aside>

  );
};

export default Sidebar;
