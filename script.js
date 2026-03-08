
const API_URL_FALLBACK="http://localhost:3000";
const API=(typeof API_URL!=="undefined" && !API_URL.includes("REMPLACE_PAR"))?API_URL:API_URL_FALLBACK;

const STAFF_IDS=["1246943697300619405","1246982124419154010","1247188738002386967","946284221150949396"];
const STAFF_ACCOUNTS={"Farm":"freddy123","oxiwanteed13":"1313","SuperCAT71":"FranceMulti_2026","Routier87":"200187"};

function getDiscordId(){return localStorage.getItem("discordId")||"";}
function getDiscordName(){return localStorage.getItem("discordName")||"";}
function isStaff(){return STAFF_IDS.includes(getDiscordId()) || localStorage.getItem("staffLogin")==="true";}

function loginStaff(){
  const user=prompt("Utilisateur staff");
  if(!user) return;
  const pass=prompt("Mot de passe");
  if(STAFF_ACCOUNTS[user] && STAFF_ACCOUNTS[user]===pass){
    localStorage.setItem("staffLogin","true");
    localStorage.setItem("staffUser",user);
    alert("Connexion staff réussie ✅");
    location.reload();
  }else alert("Identifiants incorrects");
}
function logoutAll(){
  ["discordId","discordName","discordToken","staffLogin","staffUser"].forEach(k=>localStorage.removeItem(k));
  location.reload();
}
function protectStaffPage(){
  if(document.body.dataset.protectStaff==="true" && !isStaff()){
    alert("Accès réservé au staff");
    window.location.href="index.html";
  }
}
function updateMenuVisibility(){
  document.querySelectorAll("[data-staff-only='true']").forEach(el=>{ if(!isStaff()) el.classList.add("hidden"); });
}
function renderUserBadge(){
  const box=document.getElementById("userBadge");
  if(!box) return;
  if(localStorage.getItem("staffLogin")==="true"){
    box.innerHTML=`<span class="user-badge">Connecté staff : ${localStorage.getItem("staffUser")||"staff"}</span>`; return;
  }
  if(getDiscordId()) box.innerHTML=`<span class="user-badge">Connecté Discord : ${getDiscordName()||"Discord"} (${getDiscordId()})</span>`;
  else box.innerHTML=`<span class="user-badge">Non connecté</span>`;
}
function setupButtons(){
  const loginBtn=document.getElementById("discordLoginBtn");
  if(loginBtn && typeof DISCORD_OAUTH_URL!=="undefined" && !DISCORD_OAUTH_URL.includes("REMPLACE_PAR")) loginBtn.href=DISCORD_OAUTH_URL;
  const logoutBtn=document.getElementById("logoutBtn"); if(logoutBtn) logoutBtn.onclick=logoutAll;
  const staffBtn=document.getElementById("staffLoginBtn"); if(staffBtn) staffBtn.onclick=loginStaff;
}
async function fetchDiscordUser(){
  const token=localStorage.getItem("discordToken");
  if(!token || getDiscordId()) return;
  try{
    const res=await fetch("https://discord.com/api/users/@me",{headers:{"Authorization":`Bearer ${token}`}});
    if(!res.ok) return;
    const user=await res.json();
    if(user && user.id){ localStorage.setItem("discordId",String(user.id)); localStorage.setItem("discordName",user.username||user.global_name||"Discord"); }
  }catch(e){}
}

async function loadConvoys(){
  const container=document.getElementById("convoys");
  const last=document.getElementById("lastConvoy");
  const adminConvoys=document.getElementById("adminConvoys");
  if(!container && !last && !adminConvoys) return;
  const res=await fetch(`${API}/convoys`);
  const convoys=await res.json();

  if(container){
    container.innerHTML=convoys.length?convoys.map(c=>`
      <div class="card">
        <h3>🚛 ${c.depart} ➜ ${c.arrivee}</h3>
        <p class="muted">${c.entrepriseDepart||"-"} ➜ ${c.entrepriseArrivee||"-"}</p>
        <p>📅 ${c.date||"-"} | ⏰ ${c.heure||"-"} | 🖥️ ${c.serveur||"-"}</p>
        <p class="small">👍 ${c.likes||0} &nbsp; 👎 ${c.dislikes||0}</p>
        <div class="convoy-actions">
          <button class="btn btn-green" onclick="voteConvoy(${c.id},'like')">👍 Stylé</button>
          <button class="btn btn-gold" onclick="voteConvoy(${c.id},'dislike')">👎 Pas stylé</button>
        </div>
      </div>`).join(""):`<div class="card">Aucun convoi pour le moment.</div>`;
  }
  if(last){
    if(convoys.length){
      const c=convoys[convoys.length-1];
      last.innerHTML=`<strong>🚛 ${c.depart} ➜ ${c.arrivee}</strong><br><span class="muted">${c.date} | ${c.heure}</span>`;
    } else last.textContent="Aucun convoi pour le moment";
  }
  if(adminConvoys){
    adminConvoys.innerHTML=convoys.length?convoys.map(c=>`
      <div class="card">
        <strong>${c.depart} ➜ ${c.arrivee}</strong><br>
        <span class="muted">${c.date} | ${c.heure}</span>
        <div class="admin-actions">
          <button class="btn btn-red" onclick="deleteConvoy(${c.id})">Supprimer le convoi</button>
        </div>
      </div>`).join(""):`<div class="card">Aucun convoi.</div>`;
  }
}
async function voteConvoy(convoyId,type){
  const userId=getDiscordId();
  if(!userId){ alert("Connecte-toi à Discord avant de voter"); return; }
  const r=await fetch(`${API}/vote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({convoyId,userId,type})});
  const data=await r.json();
  if(!data.ok) alert("Tu as déjà voté sur ce convoi");
  loadConvoys();
}
function convoyFormSetup(){
  const form=document.getElementById("convoyForm");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    if(!getDiscordId() && localStorage.getItem("staffLogin")!=="true"){ alert("Connecte-toi avant de créer un convoi"); return; }
    const body={
      entrepriseDepart:document.getElementById("entrepriseDepart").value,
      depart:document.getElementById("depart").value,
      entrepriseArrivee:document.getElementById("entrepriseArrivee").value,
      arrivee:document.getElementById("arrivee").value,
      date:document.getElementById("date").value,
      heure:document.getElementById("heure").value,
      serveur:document.getElementById("serveur").value
    };
    const res=await fetch(`${API}/convoys`,{method:"POST",headers:{"Content-Type":"application/json","userId":getDiscordId()||"946284221150949396"},body:JSON.stringify(body)});
    if(res.status===403){ alert("Accès refusé"); return; }
    alert("Convoi créé ✅"); form.reset(); loadConvoys();
  });
}
async function deleteConvoy(id){
  const res=await fetch(`${API}/convoys/${id}`,{method:"DELETE",headers:{"userId":getDiscordId()||"946284221150949396"}});
  if(res.status===403){ alert("Accès refusé"); return; }
  loadConvoys();
}

function applicationFormSetup(){
  const form=document.getElementById("applicationForm");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const choix=[]; document.querySelectorAll("input[name='choix']:checked").forEach(el=>choix.push(el.value));
    if(!choix.length){ alert("Choisis Trucky, TrucksBook ou les deux"); return; }
    const body={
      discord:document.getElementById("discord").value,
      age:document.getElementById("age").value,
      experience:document.getElementById("experience").value,
      choix,
      motivation:document.getElementById("motivation").value
    };
    await fetch(`${API}/applications`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    alert("Candidature envoyée ✅"); form.reset();
  });
}
async function loadAdminApplications(){
  const target=document.getElementById("adminApplications");
  if(!target) return;
  const res=await fetch(`${API}/admin/applications`,{headers:{"userId":getDiscordId()||"946284221150949396"}});
  if(res.status===403){ target.innerHTML=`<div class="card">Accès refusé.</div>`; return; }
  const data=await res.json();
  target.innerHTML=data.length?data.map(a=>`
    <div class="card">
      <strong>${a.discord}</strong><br>
      <span class="muted">Âge: ${a.age||"-"} | Expérience: ${a.experience||"-"}</span><br>
      <span class="muted">Choix: ${(a.choix||[]).join(", ")||"-"}</span><br>
      <span class="muted">Statut: ${a.status}</span>
      <p>${a.motivation||""}</p>
      <div class="admin-actions">
        <button class="btn btn-green" onclick="adminApplication(${a.id},'accept')">Valider</button>
        <button class="btn btn-gold" onclick="adminApplication(${a.id},'reject')">Refuser</button>
        <button class="btn btn-red" onclick="adminApplication(${a.id},'delete')">Supprimer</button>
      </div>
    </div>`).join(""):`<div class="card">Aucune candidature.</div>`;
}
async function adminApplication(id,action){
  await fetch(`${API}/admin/applications/${id}/${action}`,{method:"POST",headers:{"userId":getDiscordId()||"946284221150949396"}});
  loadAdminApplications();
}

async function loadCargoes(){
  const list=document.getElementById("adminCargoes");
  if(!list) return;
  const res=await fetch(`${API}/cargoes`);
  const data=await res.json();
  list.innerHTML=data.length?data.map(c=>`
    <div class="card">
      <strong>${c.nom}</strong><br>
      <span class="muted">${c.poids} | ${c.depart} ➜ ${c.arrivee}</span>
      <div class="admin-actions">
        <button class="btn btn-red" onclick="deleteCargo(${c.id})">Supprimer cargaison</button>
      </div>
    </div>`).join(""):`<div class="card">Aucune cargaison.</div>`;
}
function cargoFormSetup(){
  const form=document.getElementById("cargoForm");
  if(!form) return;
  form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    await fetch(`${API}/cargoes`,{
      method:"POST",
      headers:{"Content-Type":"application/json","userId":getDiscordId()||"946284221150949396"},
      body:JSON.stringify({
        nom:document.getElementById("cargoNom").value,
        poids:document.getElementById("cargoPoids").value,
        depart:document.getElementById("cargoDepart").value,
        arrivee:document.getElementById("cargoArrivee").value
      })
    });
    alert("Cargaison créée ✅"); form.reset(); loadCargoes();
  });
}
async function deleteCargo(id){
  await fetch(`${API}/cargoes/${id}`,{method:"DELETE",headers:{"userId":getDiscordId()||"946284221150949396"}});
  loadCargoes();
}

(async function init(){
  await fetchDiscordUser();
  protectStaffPage();
  updateMenuVisibility();
  renderUserBadge();
  setupButtons();
  loadConvoys();
  convoyFormSetup();
  applicationFormSetup();
  loadAdminApplications();
  cargoFormSetup();
  loadCargoes();
})();
