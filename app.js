const STORAGE_KEY = "civicfix_reports_v1";
const STATUS = ["Reported", "In Progress", "Resolved"];
const CATEGORY_ICONS = {
  "Roads & potholes": "⌁",
  "Garbage & cleanliness": "♻",
  "Water leakage": "≋",
  "Streetlights": "☼",
  "Drainage": "≈",
  "Public property": "⌂",
  "Other": "✳"
};

const seedReports = [
  {id:"CF-240101",title:"Pothole near the main bus stop",category:"Roads & potholes",description:"A large pothole has formed near the bus stop and is difficult for two-wheelers to avoid, especially after rain. Please inspect the road surface.",location:"Main Bus Stop, Market Road",date:dateOffset(0),reporter:"Community member",status:"Reported",notes:"",image:"",createdAt:Date.now()-1000*60*60*3},
  {id:"CF-240102",title:"Overflowing public garbage bin",category:"Garbage & cleanliness",description:"The public bin near the corner is overflowing. Waste is spreading onto the footpath and needs collection.",location:"Near the public garden entrance",date:dateOffset(-1),reporter:"Local resident",status:"In Progress",notes:"Collection requested in this demo.",image:"",createdAt:Date.now()-1000*60*60*10},
  {id:"CF-240103",title:"Streetlight not working",category:"Streetlights",description:"The streetlight on this stretch has not been working recently, making the road difficult to see at night.",location:"Lane behind the community hall",date:dateOffset(-2),reporter:"Anonymous",status:"Resolved",notes:"Demo update: light reported as repaired.",image:"",createdAt:Date.now()-1000*60*60*24},
  {id:"CF-240104",title:"Water leaking from roadside pipe",category:"Water leakage",description:"Water appears to be leaking continuously from a roadside pipe. The area is becoming wet and slippery.",location:"Near the corner of Station Road",date:dateOffset(-1),reporter:"Community member",status:"Reported",notes:"",image:"",createdAt:Date.now()-1000*60*60*36},
  {id:"CF-240105",title:"Blocked roadside drain",category:"Drainage",description:"Leaves and waste have blocked the roadside drain. Water is not flowing away properly after rainfall.",location:"Residential lane, Ward 3",date:dateOffset(-3),reporter:"Local resident",status:"In Progress",notes:"A follow-up inspection is suggested.",image:"",createdAt:Date.now()-1000*60*60*48},
  {id:"CF-240106",title:"Damaged bench in public garden",category:"Public property",description:"A bench in the garden is damaged and may need repair or replacement.",location:"Central public garden",date:dateOffset(-4),reporter:"Anonymous",status:"Reported",notes:"",image:"",createdAt:Date.now()-1000*60*60*72}
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}
function safeReadReports() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not read saved CivicFix reports.", error);
  }
  return structuredCloneSafe(seedReports);
}
function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
let reports = safeReadReports();
let selectedImage = "";
let lastCreatedId = "";
let toastTimer;

function saveReports() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (error) {
    showToast("Browser storage is full. Try a smaller image.");
    return false;
  }
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}
function formatDate(value) {
  if (!value) return "Date not provided";
  const d = new Date(value + "T12:00:00");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}
function formatShortDate(value) {
  if (!value) return "Date not provided";
  const d = new Date(value + "T12:00:00");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined,{day:"numeric",month:"short"});
}
function statusClass(status) {
  if (status === "Resolved") return "status-resolved";
  if (status === "In Progress") return "status-progress";
  return "status-reported";
}
function statusPill(status) {
  return `<span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span>`;
}
function iconFor(category) {
  return CATEGORY_ICONS[category] || "✳";
}
function getCounts() {
  return {
    total: reports.length,
    reported: reports.filter(r => r.status === "Reported").length,
    progress: reports.filter(r => r.status === "In Progress").length,
    resolved: reports.filter(r => r.status === "Resolved").length
  };
}
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function reportImage(report, detail=false) {
  if (report.image) return `<img src="${report.image}" alt="${escapeHTML(report.title)}">`;
  return `<span class="image-placeholder" aria-hidden="true">${iconFor(report.category)}</span>`;
}
function issueCard(report) {
  return `<article class="issue-card" tabindex="0" role="link" data-open-report="${escapeHTML(report.id)}" aria-label="View ${escapeHTML(report.title)}">
    <div class="issue-image">${reportImage(report)}<span class="category-pill">${escapeHTML(report.category)}</span></div>
    <div class="issue-body">
      <div class="issue-meta"><span>${escapeHTML(report.id)} · ${formatShortDate(report.date)}</span>${statusPill(report.status)}</div>
      <h3>${escapeHTML(report.title)}</h3>
      <p>${escapeHTML(report.description)}</p>
      <div class="issue-location"><span>⌖</span>${escapeHTML(report.location)}</div>
    </div>
  </article>`;
}
function statCard(icon, value, label, tone) {
  return `<article class="stat-card"><span class="stat-icon ${tone}">${icon}</span><span><strong>${value}</strong><small>${label}</small></span></article>`;
}
function renderStats(targetId, mode="home") {
  const c = getCounts();
  const target = document.getElementById(targetId);
  if (!target) return;
  if (mode === "home") {
    target.innerHTML = statCard("▤", c.total, "Total reports", "green") +
      statCard("◷", c.reported + c.progress, "Needs attention", "yellow") +
      statCard("✓", c.resolved, "Marked resolved", "coral");
  } else if (mode === "dashboard") {
    target.innerHTML = statCard("▤", c.total, "Total reports", "green") +
      statCard("◷", c.reported, "Reported", "yellow") +
      statCard("↗", c.progress, "In progress", "coral") +
      statCard("✓", c.resolved, "Resolved", "green");
  } else {
    target.innerHTML = statCard("▤", c.total, "All reports", "green") +
      statCard("◷", c.reported + c.progress, "Open reports", "yellow") +
      statCard("✓", c.resolved, "Resolved reports", "coral");
  }
}
function renderHome() {
  renderStats("homeStats","home");
  const target = document.getElementById("recentReports");
  if (!target) return;
  const recent = [...reports].sort((a,b) => b.createdAt - a.createdAt).slice(0,3);
  target.innerHTML = recent.map(issueCard).join("");
}
function renderExplore() {
  const search = (document.getElementById("searchReports")?.value || "").trim().toLowerCase();
  const category = document.getElementById("filterCategory")?.value || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const sort = document.getElementById("sortReports")?.value || "newest";
  let list = reports.filter(r => {
    const haystack = [r.title,r.location,r.id,r.description,r.category].join(" ").toLowerCase();
    return (!search || haystack.includes(search)) && (!category || r.category === category) && (!status || r.status === status);
  });
  list.sort((a,b) => sort === "oldest" ? a.createdAt-b.createdAt : b.createdAt-a.createdAt);
  document.getElementById("resultCount").textContent = `${list.length} ${list.length === 1 ? "report" : "reports"}`;
  document.getElementById("allReports").innerHTML = list.map(issueCard).join("");
  document.getElementById("emptyReports").classList.toggle("hidden", list.length > 0);
}
function renderDetails(id) {
  const report = reports.find(r => r.id === id);
  const target = document.getElementById("detailsContent");
  if (!report) {
    target.innerHTML = `<div class="empty-state"><span>⌕</span><h3>Report not found</h3><p>This report may have been removed from this browser.</p><a class="button button-primary" href="#explore">Back to reports</a></div>`;
    return;
  }
  const stages = [
    {name:"Reported",description:"Issue submitted to the CivicFix demo",active:true},
    {name:"In Progress",description:"Work or follow-up has been recorded",active:["In Progress","Resolved"].includes(report.status)},
    {name:"Resolved",description:"Issue marked as resolved",active:report.status === "Resolved"}
  ];
  const timeline = stages.map((stage,index) => `<div class="timeline-item ${stage.active ? "" : "pending"}"><span class="timeline-dot"></span><div><b>${stage.name}</b><small>${stage.active ? (index===0 ? formatDate(report.date) : (report.notes && index===1 ? escapeHTML(report.notes) : "Recorded in this demo")) : "Waiting for status update"}</small></div></div>`).join("");
  target.innerHTML = `<div class="details-layout">
    <div class="detail-main">
      <div class="detail-image">${reportImage(report,true)}</div>
      <div class="detail-meta" style="margin-top:18px"><span>${escapeHTML(report.id)}</span><span>·</span><span>${formatDate(report.date)}</span><span>·</span><span>${escapeHTML(report.category)}</span></div>
      <h1 class="issue-title-large">${escapeHTML(report.title)}</h1>
      ${statusPill(report.status)}
      <p class="detail-description">${escapeHTML(report.description)}</p>
      <div class="panel detail-info"><h3>⌖ Reported location</h3><p>${escapeHTML(report.location)}</p></div>
      ${report.notes ? `<div class="panel detail-info"><h3>Latest progress note</h3><p>${escapeHTML(report.notes)}</p></div>` : ""}
      <div class="panel detail-info"><h3>Submitted by</h3><p>${escapeHTML(report.reporter || "Anonymous")}</p></div>
    </div>
    <aside class="detail-side"><div class="panel timeline"><h3>Report progress</h3>${timeline}</div><div class="panel detail-info"><h3>About this report</h3><p>This is a CivicFix prototype record. Status updates are demo data and are not official municipal confirmations.</p></div><a class="button button-primary full-button" style="margin-top:15px" href="#explore">Explore more reports ↗</a></aside>
  </div>`;
}
function renderDashboard() {
  renderStats("dashboardStats","dashboard");
  const counts = getCounts();
  const statusData = [
    ["Reported",counts.reported],
    ["In Progress",counts.progress],
    ["Resolved",counts.resolved]
  ];
  const maxStatus = Math.max(1,...statusData.map(item=>item[1]));
  document.getElementById("statusChart").innerHTML = statusData.map(([name,count]) => `<div class="bar-row"><span>${name}</span><div class="bar-track"><div class="bar-fill" style="width:${count/maxStatus*100}%"></div></div><strong>${count}</strong></div>`).join("");
  const categories = Object.keys(CATEGORY_ICONS).map(name => [name,reports.filter(r=>r.category===name).length]).filter(item=>item[1]>0).sort((a,b)=>b[1]-a[1]);
  document.getElementById("categoryChart").innerHTML = categories.length ? categories.map(([name,count])=>`<div class="category-row"><span class="category-dot"></span><span class="category-name">${escapeHTML(name)}</span><strong>${count}</strong></div>`).join("") : `<p class="admin-empty">No category data yet.</p>`;
  const activity = [...reports].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
  document.getElementById("activityList").innerHTML = activity.length ? activity.map(r=>`<div class="activity-row"><span class="activity-symbol">${iconFor(r.category)}</span><div class="activity-copy"><b>${escapeHTML(r.title)}</b><small>${escapeHTML(r.id)} · ${formatShortDate(r.date)} · ${escapeHTML(r.location)}</small></div>${statusPill(r.status)}</div>`).join("") : `<p class="admin-empty">No reports have been submitted yet.</p>`;
}
function renderAdmin() {
  renderStats("adminStats","admin");
  const search = (document.getElementById("adminSearch")?.value || "").trim().toLowerCase();
  const list = [...reports].filter(r => [r.title,r.location,r.id,r.category].join(" ").toLowerCase().includes(search)).sort((a,b)=>b.createdAt-a.createdAt);
  const target = document.getElementById("adminList");
  if (!list.length) {
    target.innerHTML = `<p class="admin-empty">No reports match your search.</p>`;
    return;
  }
  target.innerHTML = list.map(r=>`<article class="admin-item" data-admin-item="${escapeHTML(r.id)}">
    <div><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.id)} · ${escapeHTML(r.category)}</p><small>⌖ ${escapeHTML(r.location)}</small></div>
    <div><label for="status-${escapeHTML(r.id)}" class="sr-only">Status for ${escapeHTML(r.id)}</label><select class="admin-status-select" id="status-${escapeHTML(r.id)}" data-status-id="${escapeHTML(r.id)}">${STATUS.map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></div>
    <div><label class="sr-only" for="note-${escapeHTML(r.id)}">Progress note for ${escapeHTML(r.id)}</label><input class="admin-note" id="note-${escapeHTML(r.id)}" data-note-id="${escapeHTML(r.id)}" maxlength="300" placeholder="Add a progress note..." value="${escapeHTML(r.notes||"")}"><button class="text-button save-note" data-save-note="${escapeHTML(r.id)}">Save note ↗</button> <button class="text-button delete-report" data-delete-id="${escapeHTML(r.id)}" style="color:#b45b48">Delete</button></div>
  </article>`).join("");
}
function renderAll() {
  renderHome();
  renderExplore();
  renderDashboard();
  renderAdmin();
}
function navigate() {
  let route = location.hash.replace("#","") || "home";
  let page = route;
  if (route.startsWith("details/")) page = "details";
  const valid = ["home","report","explore","details","dashboard","admin"];
  if (!valid.includes(page)) page = "home";
  document.querySelectorAll(".page").forEach(el => el.classList.toggle("active",el.id === `page-${page}`));
  document.querySelectorAll(".nav-links a[data-page]").forEach(a => a.classList.toggle("active",a.dataset.page===page));
  document.getElementById("navLinks").classList.remove("open");
  if (page === "details") renderDetails(decodeURIComponent(route.slice("details/".length)));
  if (page === "explore") renderExplore();
  if (page === "dashboard") renderDashboard();
  if (page === "admin") renderAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
}
function createComplaintId() {
  let id;
  do {
    id = "CF-" + Math.floor(100000 + Math.random()*900000);
  } while (reports.some(r=>r.id===id));
  return id;
}
function clearReportForm() {
  document.getElementById("reportForm").reset();
  document.getElementById("issueDate").value = dateOffset(0);
  selectedImage = "";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("imagePreview").classList.add("hidden");
  document.getElementById("issueImage").value = "";
}
function openSuccessModal(id) {
  document.getElementById("newComplaintId").textContent = id;
  document.getElementById("successModal").classList.remove("hidden");
}
function closeSuccessModal() {
  document.getElementById("successModal").classList.add("hidden");
}
function compressImage(file) {
  return new Promise((resolve,reject)=>{
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    if (file.size > 8*1024*1024) return reject(new Error("Please choose an image smaller than 8 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This image could not be opened."));
      img.onload = () => {
        const max = 1000;
        const ratio = Math.min(1,max/Math.max(img.width,img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1,Math.round(img.width*ratio));
        canvas.height = Math.max(1,Math.round(img.height*ratio));
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("issueDate").value = dateOffset(0);
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("navLinks").classList.toggle("open"));
window.addEventListener("hashchange",navigate);

document.getElementById("issueImage").addEventListener("change",async event=>{
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    selectedImage = await compressImage(file);
    const preview = document.getElementById("imagePreview");
    preview.innerHTML = `<img src="${selectedImage}" alt="Selected image preview"><button type="button" class="remove-image" id="removeImage">Remove image ×</button>`;
    preview.classList.remove("hidden");
    document.getElementById("removeImage").addEventListener("click",()=>{
      selectedImage = "";
      event.target.value = "";
      preview.innerHTML = "";
      preview.classList.add("hidden");
    });
  } catch(error) {
    event.target.value = "";
    selectedImage = "";
    showToast(error.message);
  }
});

document.getElementById("reportForm").addEventListener("submit",event=>{
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const report = {
    id:createComplaintId(),
    title:String(data.get("title")).trim(),
    category:String(data.get("category")),
    description:String(data.get("description")).trim(),
    location:String(data.get("location")).trim(),
    date:String(data.get("date")),
    reporter:String(data.get("reporter")||"").trim() || "Anonymous",
    status:"Reported",
    notes:"",
    image:selectedImage,
    createdAt:Date.now()
  };
  if (!report.title || !report.description || !report.location) {
    showToast("Please complete all required fields.");
    return;
  }
  reports.unshift(report);
  if (!saveReports()) {
    reports = reports.filter(r=>r.id!==report.id);
    return;
  }
  lastCreatedId = report.id;
  renderAll();
  clearReportForm();
  openSuccessModal(report.id);
});
document.getElementById("closeModal").addEventListener("click",closeSuccessModal);
document.getElementById("successModal").addEventListener("click",event=>{
  if (event.target.id==="successModal") closeSuccessModal();
});
document.getElementById("copyId").addEventListener("click",async()=>{
  try {
    await navigator.clipboard.writeText(lastCreatedId);
    showToast("Complaint ID copied.");
  } catch {
    showToast("Your complaint ID is " + lastCreatedId);
  }
});
document.getElementById("viewNewReport").addEventListener("click",()=>{
  closeSuccessModal();
  location.hash = "details/" + encodeURIComponent(lastCreatedId);
});
document.getElementById("reportAnother").addEventListener("click",()=>{
  closeSuccessModal();
  location.hash = "report";
});
["searchReports","filterCategory","filterStatus","sortReports"].forEach(id=>{
  document.getElementById(id).addEventListener("input",renderExplore);
  document.getElementById(id).addEventListener("change",renderExplore);
});
document.getElementById("clearFilters").addEventListener("click",()=>{
  document.getElementById("searchReports").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("sortReports").value = "newest";
  renderExplore();
});
document.getElementById("adminSearch").addEventListener("input",renderAdmin);

document.getElementById("adminList").addEventListener("change",event=>{
  const select = event.target.closest("[data-status-id]");
  if (!select) return;
  const report = reports.find(r=>r.id===select.dataset.statusId);
  if (!report) return;
  report.status = select.value;
  if (select.value === "Resolved" && !report.notes) report.notes = "Status updated in the CivicFix demo.";
  saveReports();
  renderAll();
  showToast("Report status updated.");
});
document.getElementById("adminList").addEventListener("click",event=>{
  const saveButton = event.target.closest("[data-save-note]");
  if (saveButton) {
    const id = saveButton.dataset.saveNote;
    const report = reports.find(r=>r.id===id);
    const input = document.querySelector(`[data-note-id="${CSS.escape(id)}"]`);
    if (!report || !input) return;
    report.notes = input.value.trim();
    saveReports();
    renderAll();
    showToast("Progress note saved.");
    return;
  }
  const deleteButton = event.target.closest("[data-delete-id]");
  if (deleteButton) {
    const id = deleteButton.dataset.deleteId;
    const report = reports.find(r=>r.id===id);
    if (!report) return;
    if (!confirm(`Delete demo report "${report.title}" (${id})? This cannot be undone.`)) return;
    reports = reports.filter(r=>r.id!==id);
    saveReports();
    renderAll();
    showToast("Demo report deleted.");
  }
});
document.addEventListener("click",event=>{
  const card = event.target.closest("[data-open-report]");
  if (card && !event.target.closest("button,a")) location.hash = "details/" + encodeURIComponent(card.dataset.openReport);
});
document.addEventListener("keydown",event=>{
  const card = event.target.closest("[data-open-report]");
  if (card && (event.key==="Enter" || event.key===" ")) {
    event.preventDefault();
    location.hash = "details/" + encodeURIComponent(card.dataset.openReport);
  }
});

renderAll();
navigate();
