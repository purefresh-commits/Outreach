import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dphsubgrjauyujowrlgf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaHN1YmdyamF1eXVqb3dybGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTk0MTAsImV4cCI6MjA5MDQ3NTQxMH0.bbkcgkQ8w1Qu5FKHvymWGTkGO_x2fsyLRtXKjE8LvIk"
);

const STATUS = {
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

const TYPES = ["Restaurant", "Hotel", "Cruise", "Catering", "Other"];
const SOURCES = ["Instagram", "LinkedIn", "Google Maps", "Email", "Referral", "Other"];
const EMPTY = { firstName: "", companyName: "", email: "", phone: "", city: "", type: "", source: "", status: "Not Sent", followUp1: "", followUp2: "", lastContact: "", notes: "" };

function sendEmail(contact, updateFn) {
  if (!contact.email) return alert("No email address available.");
  var name = contact.firstName || "there";
  var sub = encodeURIComponent(name + ", thought this might be relevant");
  var bod = encodeURIComponent(
    "Hello,\n\nWe are food product manufacturers and have an interesting offer that we believe could be a great fit for your company.\n\n" +
    "* Excellent prices\n* 24-hour delivery across the US\n* No minimum order required\n* FREE samples available to try our products\n\n" +
    "Browse our full product catalog here: https://worldsgarden.eu/en/\n\n" +
    "Are you the right person to discuss a cost-effective food supply solution designed to maintain high quality, reduce waste, and improve margins?\n\n" +
    "If not, could you please point me to the appropriate contact to continue this conversation?\n\nThank you in advance for your reply.\n\nNatalia\nSales | worldsgarden.eu"
  );
  window.open("https://mail.google.com/mail/?view=cm&fs=1&to=" + contact.email + "&su=" + sub + "&body=" + bod, "_blank");
  updateFn(contact.id, "Sent");
}

function sendWA(contact) {
  var ph = contact.phone.replace(/[^0-9]/g, "");
  if (!ph) return alert("No phone number available.");
  var msg = "Hi! We are food product manufacturers — avocado products, guacamole, natural juices, exotic fruit purees, smoothies, corn tortillas, coconut milk, frozen fruits and more. All made with 100% natural ingredients, no additives or preservatives.\n\n" +
    "We currently have a special offer on our Authentic Guacamole for new partners, and we would love to send you FREE samples to try before committing to anything.\n\n" +
    "24-hour delivery across the US. No minimum order required.\n\n" +
    "Check out our full product range here: https://worldsgarden.eu/en/\n\n" +
    "Who would be the right person to talk to about this?\n\nNatalia Vargas\npurefresh@worldsgarden.eu\nworldsgarden.eu";
  window.open("https://wa.me/" + ph + "?text=" + encodeURIComponent(msg), "_blank");
}

function sendSMS(contact) {
  var ph = contact.phone.replace(/[^0-9]/g, "");
  if (!ph) return alert("No phone number available.");
  var msg = "Hi! We are food manufacturers with some interesting offers that could be a great fit for your kitchen. We would love to share more - who would be the best person to connect with? Learn more: https://worldsgarden.eu/en/ - Natalia | worldsgarden.eu";
  window.open("sms:/open?addresses=+" + ph + "&body=" + encodeURIComponent(msg), "_blank");
}

export default function App() {
  var [contacts, setContacts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [tab, setTab] = useState("tracker");
  var [filter, setFilter] = useState("All");
  var [search, setSearch] = useState("");
  var [modal, setModal] = useState(null);
  var [form, setForm] = useState(EMPTY);
  var [toast, setToast] = useState(null);
  var [del, setDel] = useState(null);

  useEffect(function() {
    setLoading(true);
    supabase.from("contacts").select("*").then(function(res) {
      if (res.error) showToast("Failed to load: " + res.error.message, "error");
      else setContacts(res.data || []);
      setLoading(false);
    });
  }, []);

  function showToast(msg, type) {
    setToast({ msg: msg, type: type || "success" });
    setTimeout(function() { setToast(null); }, 3000);
  }

  function openAdd() { setForm(Object.assign({}, EMPTY)); setModal("add"); }
  function openEdit(c) { setForm(Object.assign({}, c)); setModal("edit"); }
  function closeModal() { setModal(null); setForm(EMPTY); }

  function submitForm() {
    if (!form.firstName && !form.companyName) return showToast("Please enter a name or company", "error");
    setSaving(true);
    if (modal === "add") {
      supabase.from("contacts").insert([form]).select().then(function(res) {
        if (res.error) showToast("Error: " + res.error.message, "error");
        else { setContacts(function(p) { return p.concat(res.data[0]); }); showToast("Contact added!"); }
        setSaving(false); closeModal();
      });
    } else {
      var id = form.id;
      supabase.from("contacts").update(form).eq("id", id).select().then(function(res) {
        if (res.error) showToast("Error: " + res.error.message, "error");
        else { setContacts(function(p) { return p.map(function(c) { return c.id === id ? res.data[0] : c; }); }); showToast("Contact updated!"); }
        setSaving(false); closeModal();
      });
    }
  }

  function deleteContact(id) {
    setSaving(true);
    supabase.from("contacts").delete().eq("id", id).then(function(res) {
      if (res.error) showToast("Error: " + res.error.message, "error");
      else { setContacts(function(p) { return p.filter(function(c) { return c.id !== id; }); }); showToast("Deleted"); }
      setSaving(false); setDel(null);
    });
  }

  function updateStatus(id, status) {
    supabase.from("contacts").update({ status: status }).eq("id", id).then(function(res) {
      if (!res.error) setContacts(function(p) { return p.map(function(c) { return c.id === id ? Object.assign({}, c, { status: status }) : c; }); });
    });
  }

  function exportCSV() {
    var h = ["First Name","Company Name","Email","Phone","City","Type","Source","Status","Follow Up 1","Follow Up 2","Last Contact","Notes"];
    var rows = contacts.map(function(r) {
      return [r.firstName,r.companyName,r.email,r.phone,r.city,r.type,r.source,r.status,r.followUp1,r.followUp2,r.lastContact,r.notes].map(function(v) { return '"' + (v||"") + '"'; }).join(",");
    });
    var blob = new Blob([[h.join(",")].concat(rows).join("\n")], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "worldsgarden_outreach.csv";
    a.click();
  }

  function importCSV(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
      var lines = evt.target.result.split("\n").filter(function(l) { return l.trim(); });
      var headers = lines[0].split(",").map(function(h) { return h.replace(/"/g,"").trim().toLowerCase(); });
      var map = { "first name":"firstName","firstname":"firstName","company name":"companyName","companyname":"companyName","company":"companyName","email":"email","phone":"phone","city":"city","type":"type","source":"source","status":"status","follow up 1":"followUp1","followup1":"followUp1","follow up 2":"followUp2","followup2":"followUp2","last contact":"lastContact","lastcontact":"lastContact","notes":"notes" };
      var imported = lines.slice(1).map(function(line) {
        var vals = line.split(",").map(function(v) { return v.replace(/"/g,"").trim(); });
        var c = { status:"Not Sent",firstName:"",companyName:"",email:"",phone:"",city:"",type:"",source:"",followUp1:"",followUp2:"",lastContact:"",notes:"" };
        headers.forEach(function(h,i) { if (map[h]) c[map[h]] = vals[i] || ""; });
        return c;
      }).filter(function(c) { return c.firstName || c.companyName || c.email; });
      if (!imported.length) return showToast("No valid contacts found", "error");
      supabase.from("contacts").insert(imported).select().then(function(res) {
        if (res.error) showToast("Import failed: " + res.error.message, "error");
        else { setContacts(function(p) { return p.concat(res.data); }); showToast(res.data.length + " contacts imported!"); }
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  var filtered = contacts.filter(function(c) {
    return (filter === "All" || c.status === filter) &&
      (!search || ["firstName","companyName","email","city"].some(function(k) { return c[k] && c[k].toLowerCase().includes(search.toLowerCase()); }));
  });

  var stats = {
    total: contacts.length,
    sent: contacts.filter(function(c) { return c.status !== "Not Sent"; }).length,
    replied: contacts.filter(function(c) { return c.status === "Replied"; }).length,
    samples: contacts.filter(function(c) { return c.status === "Sample Requested"; }).length,
    converted: contacts.filter(function(c) { return c.status === "Converted"; }).length,
  };

  var G = { fontFamily: "Georgia, serif", background: "#f5f0e8", minHeight: "100vh" };

  return (
    <div style={G}>
      {toast && <div style={{ position:"fixed",top:"16px",right:"16px",zIndex:9999,background:toast.type==="error"?"#fee2e2":"#dcfce7",color:toast.type==="error"?"#991b1b":"#166534",padding:"10px 18px",borderRadius:"10px",fontWeight:"bold",fontSize:"13px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ background:"linear-gradient(135deg,#2d4a1e,#4a7a2e)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div>
          <div style={{ color:"#fff",fontSize:"18px",fontWeight:"bold" }}>world's garden</div>
          <div style={{ color:"#a8d060",fontSize:"10px",letterSpacing:"2px" }}>OUTREACH CRM - {saving ? "Saving..." : "Synced"}</div>
        </div>
        <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
          <button onClick={exportCSV} style={{ background:"#c8e880",color:"#2d4a1e",border:"none",borderRadius:"20px",padding:"7px 14px",fontWeight:"bold",fontSize:"11px",cursor:"pointer" }}>Export CSV</button>
          <label style={{ background:"#fff",color:"#2d4a1e",border:"none",borderRadius:"20px",padding:"7px 14px",fontWeight:"bold",fontSize:"11px",cursor:"pointer" }}>Import CSV<input type="file" accept=".csv" onChange={importCSV} style={{ display:"none" }} /></label>
          <button onClick={openAdd} style={{ background:"#4a7a2e",color:"#fff",border:"none",borderRadius:"20px",padding:"7px 14px",fontWeight:"bold",fontSize:"11px",cursor:"pointer" }}>+ Add Contact</button>
        </div>
      </div>

      <div style={{ background:"#2d4a1e",display:"flex",padding:"0 20px",gap:"2px" }}>
        {[["tracker","Contacts"],["template","Templates"],["instructions","Setup Guide"]].map(function(item) {
          return <button key={item[0]} onClick={function() { setTab(item[0]); }} style={{ background:tab===item[0]?"#f5f0e8":"transparent",color:tab===item[0]?"#2d4a1e":"#a8d060",border:"none",padding:"8px 14px",cursor:"pointer",borderRadius:"8px 8px 0 0",fontSize:"12px",fontWeight:"bold" }}>{item[1]}</button>;
        })}
      </div>

      <div style={{ padding:"16px 20px" }}>
        {tab === "tracker" && (
          <div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"10px",marginBottom:"16px" }}>
              {[["Total",stats.total,"#2d4a1e"],["Sent",stats.sent,"#1d4ed8"],["Replied",stats.replied,"#166534"],["Samples",stats.samples,"#6b21a8"],["Converted",stats.converted,"#065f46"]].map(function(item) {
                return <div key={item[0]} style={{ background:"#fff",borderRadius:"10px",padding:"12px",textAlign:"center",borderTop:"3px solid "+item[2] }}><div style={{ fontSize:"22px",fontWeight:"bold",color:item[2] }}>{item[1]}</div><div style={{ fontSize:"10px",color:"#666",marginTop:"2px" }}>{item[0]}</div></div>;
              })}
            </div>
            <div style={{ display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap" }}>
              <input placeholder="Search..." value={search} onChange={function(e) { setSearch(e.target.value); }} style={{ flex:1,minWidth:"160px",border:"1px solid #ddd",borderRadius:"8px",padding:"7px 12px",fontSize:"13px" }} />
              <select value={filter} onChange={function(e) { setFilter(e.target.value); }} style={{ border:"1px solid #ddd",borderRadius:"8px",padding:"7px 10px",fontSize:"12px" }}>
                <option value="All">All Statuses</option>
                {Object.keys(STATUS).map(function(s) { return <option key={s}>{s}</option>; })}
              </select>
            </div>
            {loading ? (
              <div style={{ textAlign:"center",padding:"60px",color:"#666" }}>Loading contacts...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center",padding:"60px",background:"#fff",borderRadius:"12px" }}>
                <div style={{ fontSize:"48px",marginBottom:"12px" }}>🥑</div>
                <div style={{ color:"#2d4a1e",fontWeight:"bold",marginBottom:"8px" }}>No contacts yet!</div>
                <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#4a7a2e,#7ab040)",color:"#fff",border:"none",borderRadius:"20px",padding:"10px 24px",fontWeight:"bold",cursor:"pointer" }}>+ Add First Contact</button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {filtered.map(function(c) {
                  return (
                    <div key={c.id} style={{ background:"#fff",borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",flexWrap:"wrap" }}>
                      <div style={{ width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#2d4a1e,#5a8a30)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"bold",fontSize:"14px",flexShrink:0 }}>
                        {(c.firstName||c.companyName||"?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1,minWidth:"120px" }}>
                        <div style={{ fontWeight:"bold",color:"#2d4a1e",fontSize:"14px" }}>{c.firstName} {c.companyName && <span style={{ color:"#666",fontWeight:"normal" }}>- {c.companyName}</span>}</div>
                        <div style={{ fontSize:"11px",color:"#888",marginTop:"2px" }}>{[c.email,c.city,c.type].filter(Boolean).join(" - ")}</div>
                      </div>
                      <select value={c.status||"Not Sent"} onChange={function(e) { updateStatus(c.id,e.target.value); }}
                        style={{ border:"none",borderRadius:"12px",padding:"4px 8px",fontSize:"11px",fontWeight:"bold",background:STATUS[c.status]?STATUS[c.status].bg:"#f3f4f6",color:STATUS[c.status]?STATUS[c.status].text:"#374151",cursor:"pointer" }}>
                        {Object.keys(STATUS).map(function(s) { return <option key={s}>{s}</option>; })}
                      </select>
                      <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
                        <button onClick={function() { sendEmail(c,updateStatus); }} style={{ background:"#fef9c3",color:"#854d0e",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px" }}>Email</button>
                        <button onClick={function() { sendWA(c); }} style={{ background:"#dcfce7",color:"#166534",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px" }}>WA</button>
                        <button onClick={function() { sendSMS(c); }} style={{ background:"#dbeafe",color:"#1d4ed8",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px" }}>SMS</button>
                        <button onClick={function() { openEdit(c); }} style={{ background:"#f0f7e6",color:"#2d4a1e",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px" }}>Edit</button>
                        <button onClick={function() { setDel(c.id); }} style={{ background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px" }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "template" && (
          <div style={{ maxWidth:"620px",margin:"0 auto" }}>
            {[
              { t:"Email - Initial Outreach", b:"Hello,\n\nWe are food product manufacturers and have an interesting offer that we believe could be a great fit for your company.\n\n* Excellent prices\n* 24-hour delivery across the US\n* No minimum order required\n* FREE samples available to try our products\n\nBrowse our full product catalog here: https://worldsgarden.eu/en/\n\nAre you the right person to discuss a cost-effective food supply solution designed to maintain high quality, reduce waste, and improve margins?\n\nIf not, could you please point me to the appropriate contact to continue this conversation?\n\nThank you in advance for your reply.\n\nNatalia\nSales | worldsgarden.eu" },
              { t:"WhatsApp Message", b:"Hi! We are food product manufacturers - avocado products, guacamole, natural juices, exotic fruit purees, smoothies, corn tortillas, coconut milk, frozen fruits and more. All made with 100% natural ingredients, no additives or preservatives.\n\nWe currently have a special offer on our Authentic Guacamole for new partners, and we would love to send you FREE samples.\n\n24-hour delivery across the US. No minimum order required.\n\nhttps://worldsgarden.eu/en/\n\nWho would be the right person to talk to?\n\nNatalia Vargas\npurefresh@worldsgarden.eu" },
              { t:"SMS Message", b:"Hi! We are food manufacturers with some interesting offers that could be a great fit for your kitchen. We would love to share more - who would be the best person to connect with? Learn more: https://worldsgarden.eu/en/ - Natalia | worldsgarden.eu" },
            ].map(function(item) {
              return (
                <div key={item.t} style={{ background:"#fff",borderRadius:"12px",padding:"20px",marginBottom:"16px" }}>
                  <div style={{ fontWeight:"bold",color:"#2d4a1e",marginBottom:"12px" }}>{item.t}</div>
                  <div style={{ background:"#f9fafb",borderRadius:"8px",padding:"14px",fontSize:"13px",lineHeight:"1.8",color:"#333",whiteSpace:"pre-line" }}>{item.b}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "instructions" && (
          <div style={{ maxWidth:"580px",margin:"0 auto",background:"#fff",borderRadius:"12px",padding:"24px" }}>
            <h2 style={{ color:"#2d4a1e",marginBottom:"20px",fontSize:"16px" }}>How to use this CRM</h2>
            {[["1","Add contacts","Use + Add Contact or Import CSV to add your prospects."],["2","Send emails","Click Email to open Gmail with the message pre-filled. Status updates to Sent automatically."],["3","WhatsApp and SMS","Click WA or SMS to send pre-filled messages."],["4","Track replies","Update the status dropdown as replies come in."],["5","Export","Click Export CSV to download your list for bulk campaigns."]].map(function(item) {
              return (
                <div key={item[0]} style={{ display:"flex",gap:"14px",marginBottom:"16px" }}>
                  <div style={{ background:"linear-gradient(135deg,#2d4a1e,#5a8a30)",color:"#fff",borderRadius:"50%",width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"12px",flexShrink:0 }}>{item[0]}</div>
                  <div><div style={{ fontWeight:"bold",color:"#2d4a1e",fontSize:"13px",marginBottom:"3px" }}>{item[1]}</div><div style={{ color:"#555",fontSize:"12px",lineHeight:"1.6" }}>{item[2]}</div></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}>
          <div style={{ background:"#fff",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
              <h3 style={{ color:"#2d4a1e",fontSize:"16px" }}>{modal==="add"?"Add New Contact":"Edit Contact"}</h3>
              <button onClick={closeModal} style={{ background:"#f3f4f6",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer" }}>X</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px" }}>
              {[["firstName","First Name","text"],["companyName","Company Name","text"],["email","Email","email"],["phone","Phone","text"],["city","City","text"]].map(function(item) {
                return (
                  <div key={item[0]} style={{ gridColumn:item[0]==="email"||item[0]==="companyName"?"span 2":"span 1" }}>
                    <label style={{ display:"block",fontSize:"11px",color:"#666",marginBottom:"4px" }}>{item[1]}</label>
                    <input type={item[2]} value={form[item[0]]||""} onChange={function(e) { setForm(function(f) { var n=Object.assign({},f); n[item[0]]=e.target.value; return n; }); }} style={{ width:"100%",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",boxSizing:"border-box" }} />
                  </div>
                );
              })}
              {[["type","Type",TYPES],["source","Source",SOURCES],["status","Status",Object.keys(STATUS)]].map(function(item) {
                return (
                  <div key={item[0]}>
                    <label style={{ display:"block",fontSize:"11px",color:"#666",marginBottom:"4px" }}>{item[1]}</label>
                    <select value={form[item[0]]||""} onChange={function(e) { setForm(function(f) { var n=Object.assign({},f); n[item[0]]=e.target.value; return n; }); }} style={{ width:"100%",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 10px",fontSize:"13px" }}>
                      <option value="">Select...</option>
                      {item[2].map(function(o) { return <option key={o}>{o}</option>; })}
                    </select>
                  </div>
                );
              })}
              {[["followUp1","Follow Up 1"],["followUp2","Follow Up 2"],["lastContact","Last Contact"]].map(function(item) {
                return (
                  <div key={item[0]}>
                    <label style={{ display:"block",fontSize:"11px",color:"#666",marginBottom:"4px" }}>{item[1]}</label>
                    <input type="date" value={form[item[0]]||""} onChange={function(e) { setForm(function(f) { var n=Object.assign({},f); n[item[0]]=e.target.value; return n; }); }} style={{ width:"100%",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 10px",fontSize:"13px" }} />
                  </div>
                );
              })}
              <div style={{ gridColumn:"span 2" }}>
                <label style={{ display:"block",fontSize:"11px",color:"#666",marginBottom:"4px" }}>Notes</label>
                <textarea value={form.notes||""} onChange={function(e) { setForm(function(f) { return Object.assign({},f,{notes:e.target.value}); }); }} rows={3} style={{ width:"100%",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",resize:"vertical",boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"flex",gap:"10px",marginTop:"20px",justifyContent:"flex-end" }}>
              <button onClick={closeModal} style={{ background:"#f3f4f6",color:"#374151",border:"none",borderRadius:"10px",padding:"10px 20px",cursor:"pointer",fontWeight:"bold" }}>Cancel</button>
              <button onClick={submitForm} style={{ background:"linear-gradient(135deg,#4a7a2e,#7ab040)",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 24px",cursor:"pointer",fontWeight:"bold" }}>{modal==="add"?"Add Contact":"Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}>
          <div style={{ background:"#fff",borderRadius:"16px",padding:"24px",maxWidth:"360px",textAlign:"center" }}>
            <div style={{ fontSize:"36px",marginBottom:"12px" }}>🗑️</div>
            <h3 style={{ color:"#2d4a1e",marginBottom:"8px" }}>Delete this contact?</h3>
            <p style={{ color:"#666",fontSize:"13px",marginBottom:"20px" }}>This cannot be undone.</p>
            <div style={{ display:"flex",gap:"10px",justifyContent:"center" }}>
              <button onClick={function() { setDel(null); }} style={{ background:"#f3f4f6",color:"#374151",border:"none",borderRadius:"10px",padding:"10px 20px",cursor:"pointer",fontWeight:"bold" }}>Cancel</button>
              <button onClick={function() { deleteContact(del); }} style={{ background:"#ef4444",color:"#fff",border:"none",borderRadius:"10px",padding:"10px 24px",cursor:"pointer",fontWeight:"bold" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
