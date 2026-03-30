import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dphsubgrjauyujowrlgf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaHN1YmdyamF1eXVqb3dybGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTk0MTAsImV4cCI6MjA5MDQ3NTQxMH0.bbkcgkQ8w1Qu5FKHvymWGTkGO_x2fsyLRtXKjE8LvIk"
);

const statusColors = {
  "Not Sent": { bg: "#f3f4f6", text: "#374151" },
  "Sent": { bg: "#dbeafe", text: "#1d4ed8" },
  "Opened": { bg: "#fef9c3", text: "#854d0e" },
  "Replied": { bg: "#dcfce7", text: "#166534" },
  "Not Interested": { bg: "#fee2e2", text: "#991b1b" },
  "Sample Requested": { bg: "#f3e8ff", text: "#6b21a8" },
  "Follow Up 1 Sent": { bg: "#ffedd5", text: "#9a3412" },
  "Follow Up 2 Sent": { bg: "#fce7f3", text: "#9d174d" },
  "Converted": { bg: "#d1fae5", text: "#065f46" },
};

const types = ["Restaurant", "Hotel", "Cruise", "Catering", "Other"];
const sources = ["Instagram", "LinkedIn", "Google Maps", "Email", "Referral", "Other"];
const emptyContact = { firstName: "", companyName: "", email: "", phone: "", city: "", type: "", source: "", status: "Not Sent", followUp1: "", followUp2: "", lastContact: "", notes: "" };

const openWhatsApp = (contact) => {
  const phone = contact.phone.replace(/[^0-9]/g, "");
  if (!phone) return alert("No phone number available for this contact.");
  const message = `Hi! 👋\n\nWe are food ingredient manufacturers, avocado products, purees, peppers & more. And we have recently launched some offers that could be a great fit for you.\n\nWho would be the right person to talk to about this?\n\nNatalia Vargas\n📧 purefresh@worldsgarden.eu\n🌐 worldsgarden.eu`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
};

const openSMS = (contact) => {
  const phone = contact.phone.replace(/[^0-9]/g, "");
  if (!phone) return alert("No phone number available for this contact.");
  const message = `Hi! We manufacture avocado products, purees & peppers. We have some offers that could be a great fit for you. Who's the right person to discuss this?\n\n- Natalia | purefresh@worldsgarden.eu | worldsgarden.eu`;
  window.open(`sms:/open?addresses=+${phone}&body=${encodeURIComponent(message)}`, "_blank");
};

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("tracker");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyContact);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("contacts").select("*");
      if (error) showToast("Failed to load: " + error.message, "error");
      else setContacts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setForm({ ...emptyContact }); setModal({ mode: "add" }); };
  const openEdit = (c) => { setForm({ ...c }); setModal({ mode: "edit" }); };
  const closeModal = () => { setModal(null); setForm(emptyContact); };

  const submitForm = async () => {
    if (!form.firstName && !form.companyName) return showToast("Please enter at least a name or company", "error");
    setSaving(true);
    if (modal.mode === "add") {
      const { data, error } = await supabase.from("contacts").insert([form]).select();
      if (error) showToast("Error: " + error.message, "error");
      else { setContacts(prev => [...prev, data[0]]); showToast("Contact added! 🥑"); }
    } else {
      const { id, ...rest } = form;
      const { data, error } = await supabase.from("contacts").update(rest).eq("id", id).select();
      if (error) showToast("Error: " + error.message, "error");
      else { setContacts(prev => prev.map(c => c.id === id ? data[0] : c)); showToast("Contact updated!"); }
    }
    setSaving(false);
    closeModal();
  };

  const deleteContact = async (id) => {
    setSaving(true);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else { setContacts(prev => prev.filter(c => c.id !== id)); showToast("Contact deleted"); }
    setSaving(false);
    setDeleteConfirm(null);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("contacts").update({ status }).eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const exportCSV = () => {
    const headers = ["First Name","Company Name","Email","Phone","City","Type","Source","Status","Follow Up 1","Follow Up 2","Last Contact","Notes"];
    const rows = contacts.map(r =>
      [r.firstName,r.companyName,r.email,r.phone,r.city,r.type,r.source,r.status,r.followUp1,r.followUp2,r.lastContact,r.notes]
        .map(v => `"${v||""}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "worldsgarden_outreach.csv";
    a.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.replace(/"/g,"").trim().toLowerCase());
        const map = {
          "first name": "firstName", "firstname": "firstName",
          "company name": "companyName", "companyname": "companyName", "company": "companyName",
          "email": "email", "phone": "phone", "city": "city", "type": "type",
          "source": "source", "status": "status",
          "follow up 1": "followUp1", "followup1": "followUp1",
          "follow up 2": "followUp2", "followup2": "followUp2",
          "last contact": "lastContact", "lastcontact": "lastContact",
          "notes": "notes",
        };
        const imported = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.replace(/"/g,"").trim());
          const contact = { status: "Not Sent", firstName:"", companyName:"", email:"", phone:"", city:"", type:"", source:"", followUp1:"", followUp2:"", lastContact:"", notes:"" };
          headers.forEach((h, i) => { if (map[h]) contact[map[h]] = vals[i] || ""; });
          return contact;
        }).filter(c => c.firstName || c.companyName || c.email);
        if (imported.length === 0) return showToast("No valid contacts found", "error");
        const { data, error } = await supabase.from("contacts").insert(imported).select();
        if (error) throw new Error(error.message);
        setContacts(prev => [...prev, ...data]);
        showToast(`✅ ${data.length} contacts imported!`);
      } catch (e) { showToast("Failed to import: " + e.message, "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = contacts.filter(c => {
    const mf = filter === "All" || c.status === filter;
    const ms = !search || [c.firstName,c.companyName,c.email,c.city].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return mf && ms;
  });

  const stats = {
    total: contacts.length,
    sent: contacts.filter(c => c.status !== "Not Sent").length,
    replied: contacts.filter(c => c.status === "Replied").length,
    samples: contacts.filter(c => c.status === "Sample Requested").length,
    converted: contacts.filter(c => c.status === "Converted").length,
  };

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f0e8", minHeight: "100vh" }}>
      {toast && (
        <div style={{ position:"fixed", top:"16px", right:"16px", zIndex:9999, background: toast.type==="error"?"#fee2e2":"#dcfce7", color: toast.type==="error"?"#991b1b":"#166534", padding:"10px 18px", borderRadius:"10px", fontWeight:"bold", fontSize:"13px", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ background:"linear-gradient(135deg,#2d4a1e,#4a7a2e)", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:"#fff", fontSize:"18px", fontWeight:"bold" }}>world's garden 🥑</div>
          <div style={{ color:"#a8d060", fontSize:"10px", letterSpacing:"2px" }}>OUTREACH CRM · {saving ? "Saving..." : "Synced ✓"}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <button onClick={exportCSV} style={{ background:"#c8e880", color:"#2d4a1e", border:"none", borderRadius:"20px", padding:"7px 14px", fontWeight:"bold", fontSize:"11px", cursor:"pointer" }}>⬇️ Export CSV</button>
          <label style={{ background:"#fff", color:"#2d4a1e", border:"none", borderRadius:"20px", padding:"7px 14px", fontWeight:"bold", fontSize:"11px", cursor:"pointer" }}>
            ⬆️ Import CSV
            <input type="file" accept=".csv" onChange={importCSV} style={{ display:"none" }} />
          </label>
          <button onClick={openAdd} style={{ background:"#4a7a2e", color:"#fff", border:"none", borderRadius:"20px", padding:"7px 14px", fontWeight:"bold", fontSize:"11px", cursor:"pointer" }}>+ Add Contact</button>
        </div>
      </div>

      <div style={{ background:"#2d4a1e", display:"flex", padding:"0 20px", gap:"2px" }}>
        {[["tracker","📊 Contacts"],["template","✉️ Templates"],["instructions","📋 Setup Guide"]].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background:activeTab===t?"#f5f0e8":"transparent", color:activeTab===t?"#2d4a1e":"#a8d060", border:"none", padding:"8px 14px", cursor:"pointer", borderRadius:"8px 8px 0 0", fontSize:"12px", fontWeight:"bold" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:"16px 20px" }}>
        {activeTab === "tracker" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"10px", marginBottom:"16px" }}>
              {[["Total",stats.total,"#2d4a1e"],["Sent",stats.sent,"#1d4ed8"],["Replied",stats.replied,"#166534"],["Samples",stats.samples,"#6b21a8"],["Converted",stats.converted,"#065f46"]].map(([l,v,c]) => (
                <div key={l} style={{ background:"#fff", borderRadius:"10px", padding:"12px", textAlign:"center", borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:"22px", fontWeight:"bold", color:c }}>{v}</div>
                  <div style={{ fontSize:"10px", color:"#666", marginTop:"2px" }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
              <input placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ flex:1, minWidth:"160px", border:"1px solid #ddd", borderRadius:"8px", padding:"7px 12px", fontSize:"13px" }} />
              <select value={filter} onChange={e=>setFilter(e.target.value)}
                style={{ border:"1px solid #ddd", borderRadius:"8px", padding:"7px 10px", fontSize:"12px" }}>
                <option value="All">All Statuses</option>
                {Object.keys(statusColors).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#666" }}>Loading contacts from cloud... ☁️</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", background:"#fff", borderRadius:"12px" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>🥑</div>
                <div style={{ color:"#2d4a1e", fontWeight:"bold", fontSize:"16px", marginBottom:"8px" }}>No contacts yet!</div>
                <div style={{ color:"#888", fontSize:"13px", marginBottom:"20px" }}>Start adding your foodservice prospects</div>
                <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#4a7a2e,#7ab040)", color:"#fff", border:"none", borderRadius:"20px", padding:"10px 24px", fontWeight:"bold", cursor:"pointer" }}>+ Add First Contact</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {filtered.map(c => (
                  <div key={c.id} style={{ background:"#fff", borderRadius:"12px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", flexWrap:"wrap" }}>
                    <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#2d4a1e,#5a8a30)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"bold", fontSize:"14px", flexShrink:0 }}>
                      {(c.firstName||c.companyName||"?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:"120px" }}>
                      <div style={{ fontWeight:"bold", color:"#2d4a1e", fontSize:"14px" }}>{c.firstName} {c.companyName && <span style={{ color:"#666", fontWeight:"normal" }}>· {c.companyName}</span>}</div>
                      <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>{[c.email,c.city,c.type].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                      {c.source && <span style={{ background:"#f0f7e6", color:"#4a7a2e", fontSize:"10px", padding:"2px 8px", borderRadius:"10px" }}>{c.source}</span>}
                      <select value={c.status||"Not Sent"} onChange={e=>updateStatus(c.id,e.target.value)}
                        style={{ border:"none", borderRadius:"12px", padding:"4px 8px", fontSize:"11px", fontWeight:"bold", background:statusColors[c.status]?.bg||"#f3f4f6", color:statusColors[c.status]?.text||"#374151", cursor:"pointer" }}>
                        {Object.keys(statusColors).map(s=><option key={s}>{s}</option>)}
                      </select>
                      {c.notes && <span style={{ fontSize:"11px", color:"#888", maxWidth:"100px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={c.notes}>📝 {c.notes}</span>}
                    </div>
                    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      <button onClick={()=>openWhatsApp(c)} style={{ background:"#dcfce7", color:"#166534", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", fontSize:"12px" }}>💬 WA</button>
                      <button onClick={()=>openSMS(c)} style={{ background:"#dbeafe", color:"#1d4ed8", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", fontSize:"12px" }}>📱 SMS</button>
                      <button onClick={()=>openEdit(c)} style={{ background:"#f0f7e6", color:"#2d4a1e", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", fontSize:"12px" }}>✏️ Edit</button>
                      <button onClick={()=>setDeleteConfirm(c.id)} style={{ background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", fontSize:"12px" }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "template" && (
          <div style={{ maxWidth:"620px", margin:"0 auto" }}>
            {[
              { label:"📧 Email 1 — Initial Outreach", subject:'{{First Name}}, thought this might be relevant', body:`Hi {{First Name}},\n\nI wanted to reach out because we supply premium Mexican food products — authentic guacamole, smashed avocado, tomatillo, jalapeño & more — with 24hr delivery across the US and no minimum order.\n\nWe're currently offering a special discount on our Authentic Guacamole for new foodservice partners at {{Company Name}}. We'd also love to send you FREE samples so you can taste the quality before committing to anything.\n\nAre you the right person to discuss a cost-effective food supply solution designed to maintain high quality, reduce waste and improve margins? If not, could you point me to the right contact?\n\nLooking forward to hearing from you!\n\nNatalia Vargas\n📧 purefresh@worldsgarden.eu\n📞 (832) 217-9616\n🌐 worldsgarden.eu` },
              { label:"📧 Email 2 — Follow Up (Day 3)", subject:"Just checking in, {{First Name}}", body:`Hi {{First Name}},\n\nI reached out a few days ago about our premium Mexican food products and wanted to make sure my email didn't get buried in your inbox!\n\nWe still have a special discounted price on our Authentic Guacamole available for new partners at {{Company Name}}. We'd love to send you FREE samples — no commitment needed.\n\nWould you be the right person to chat with, or could you point me to who handles food purchasing?\n\nNatalia Vargas\n📧 purefresh@worldsgarden.eu\n📞 (832) 217-9616\n🌐 worldsgarden.eu` },
            ].map(t => (
              <div key={t.label} style={{ background:"#fff", borderRadius:"12px", padding:"20px", marginBottom:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight:"bold", color:"#2d4a1e", marginBottom:"14px", fontSize:"14px" }}>{t.label}</div>
                <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Subject</div>
                <div style={{ background:"#f0f7e6", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:"#2d4a1e", fontWeight:"bold", marginBottom:"12px" }}>{t.subject}</div>
                <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Body</div>
                <div style={{ background:"#f9fafb", borderRadius:"8px", padding:"14px", fontSize:"13px", lineHeight:"1.8", color:"#333", whiteSpace:"pre-line" }}>{t.body}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "instructions" && (
          <div style={{ maxWidth:"580px", margin:"0 auto", background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ color:"#2d4a1e", marginBottom:"20px", fontSize:"16px" }}>📋 How to use with Gmail + YAMM</h2>
            {[
              ["1","Add your contacts","Use the + Add Contact button. Everything saves to the cloud automatically and syncs across all devices."],
              ["2","Update status as you go","Update each contact's status as you send emails and get replies."],
              ["3","Export to CSV","Click Export CSV to download your contact list whenever you need to send emails."],
              ["4","Import into Google Sheets","sheets.google.com → New Sheet → File → Import → Upload your CSV."],
              ["5","Install YAMM","Extensions → Add-ons → Get add-ons → Search 'Yet Another Mail Merge' → Install (free)."],
              ["6","Create Gmail draft","Create a draft in Gmail using the templates tab. Use {{First Name}} and {{Company Name}} as shown."],
              ["7","Send with YAMM","Extensions → Yet Another Mail Merge → Start Mail Merge → Select draft → Send!"],
              ["8","Track replies","Come back and update each contact's status as replies come in."],
            ].map(([s,t,d]) => (
              <div key={s} style={{ display:"flex", gap:"14px", marginBottom:"16px" }}>
                <div style={{ background:"linear-gradient(135deg,#2d4a1e,#5a8a30)", color:"#fff", borderRadius:"50%", width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", fontSize:"12px", flexShrink:0 }}>{s}</div>
                <div>
                  <div style={{ fontWeight:"bold", color:"#2d4a1e", fontSize:"13px", marginBottom:"3px" }}>{t}</div>
                  <div style={{ color:"#555", fontSize:"12px", lineHeight:"1.6" }}>{d}</div>
                </div>
              </div>
            ))}
            <div style={{ background:"#f0f7e6", borderRadius:"8px", padding:"12px 14px", fontSize:"12px", color:"#2d4a1e", borderLeft:"3px solid #5a8a30" }}>
              ⚠️ <strong>Daily limit:</strong> YAMM free plan = 50 emails/day.
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", width:"100%", maxWidth:"500px", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"#2d4a1e", fontSize:"16px" }}>{modal.mode==="add"?"➕ Add New Contact":"✏️ Edit Contact"}</h3>
              <button onClick={closeModal} style={{ background:"#f3f4f6", border:"none", borderRadius:"8px", padding:"6px 10px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {[["firstName","First Name","text"],["companyName","Company Name","text"],["email","Email","email"],["phone","Phone","text"],["city","City","text"]].map(([f,l,t]) => (
                <div key={f} style={{ gridColumn:f==="email"||f==="companyName"?"span 2":"span 1" }}>
                  <label style={{ display:"block", fontSize:"11px", color:"#666", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>{l}</label>
                  <input type={t} value={form[f]||""} onChange={e=>setForm({...form,[f]:e.target.value})}
                    style={{ width:"100%", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"8px 12px", fontSize:"13px", boxSizing:"border-box" }} />
                </div>
              ))}
              {[["type","Type",types],["source","Source",sources],["status","Status",Object.keys(statusColors)]].map(([f,l,opts]) => (
                <div key={f}>
                  <label style={{ display:"block", fontSize:"11px", color:"#666", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>{l}</label>
                  <select value={form[f]||""} onChange={e=>setForm({...form,[f]:e.target.value})}
                    style={{ width:"100%", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"8px 10px", fontSize:"13px" }}>
                    <option value="">Select...</option>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[["followUp1","Follow Up 1"],["followUp2","Follow Up 2"],["lastContact","Last Contact"]].map(([f,l]) => (
                <div key={f}>
                  <label style={{ display:"block", fontSize:"11px", color:"#666", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>{l}</label>
                  <input type="date" value={form[f]||""} onChange={e=>setForm({...form,[f]:e.target.value})}
                    style={{ width:"100%", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"8px 10px", fontSize:"13px" }} />
                </div>
              ))}
              <div style={{ gridColumn:"span 2" }}>
                <label style={{ display:"block", fontSize:"11px", color:"#666", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Notes</label>
                <textarea value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} rows={3}
                  style={{ width:"100%", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"8px 12px", fontSize:"13px", resize:"vertical", boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", marginTop:"20px", justifyContent:"flex-end" }}>
              <button onClick={closeModal} style={{ background:"#f3f4f6", color:"#374151", border:"none", borderRadius:"10px", padding:"10px 20px", cursor:"pointer", fontWeight:"bold", fontSize:"13px" }}>Cancel</button>
              <button onClick={submitForm} style={{ background:"linear-gradient(135deg,#4a7a2e,#7ab040)", color:"#fff", border:"none", borderRadius:"10px", padding:"10px 24px", cursor:"pointer", fontWeight:"bold", fontSize:"13px" }}>
                {modal.mode==="add"?"Add Contact ✓":"Save Changes ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", maxWidth:"360px", textAlign:"center" }}>
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>🗑️</div>
            <h3 style={{ color:"#2d4a1e", marginBottom:"8px" }}>Delete this contact?</h3>
            <p style={{ color:"#666", fontSize:"13px", marginBottom:"20px" }}>This action cannot be undone.</p>
            <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ background:"#f3f4f6", color:"#374151", border:"none", borderRadius:"10px", padding:"10px 20px", cursor:"pointer", fontWeight:"bold" }}>Cancel</button>
              <button onClick={()=>deleteContact(deleteConfirm)} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:"10px", padding:"10px 24px", cursor:"pointer", fontWeight:"bold" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
