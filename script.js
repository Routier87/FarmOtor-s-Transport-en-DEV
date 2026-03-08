const API_URL_FALLBACK="http://localhost:3000";
const API=(typeof API_URL!=="undefined" && !API_URL.includes("REMPLACE_PAR"))?API_URL:API_URL_FALLBACK;

const STAFF_IDS=[
"1246943697300619405",
"1246982124419154010",
"1247188738002386967",
"946284221150949396"
];

const STAFF_ACCOUNTS={
"Farm":"freddy123",
"oxiwanteed13":"1313",
"SuperCAT71":"FranceMulti_2026",
"Routier87":"200187"
};

function getDiscordId(){return localStorage.getItem("discordId")||"";}
function getDiscordName(){return localStorage.getItem("discordName")||"";}

function isStaff(){
return STAFF_IDS.includes(getDiscordId()) || localStorage.getItem("staffLogin")==="true";
}

function loginStaff(){

const user=prompt("Utilisateur staff");
if(!user)return;

const pass=prompt("Mot de passe");

if(STAFF_ACCOUNTS[user] && STAFF_ACCOUNTS[user]===pass){

localStorage.setItem("staffLogin","true");
localStorage.setItem("staffUser",user);

alert("Connexion staff réussie");
location.reload();

}else{
alert("Identifiants incorrects");
}

}

function logoutAll(){

["discordId","discordName","discordToken","staffLogin","staffUser"]
.forEach(k=>localStorage.removeItem(k));

location.reload();

}

function protectStaffPage(){

if(document.body.dataset.protectStaff==="true" && !isStaff()){

alert("Accès réservé au staff");
window.location.href="index.html";

}

}

function updateMenuVisibility(){

document.querySelectorAll("[data-staff-only='true']")
.forEach(el=>{
if(!isStaff()) el.classList.add("hidden");
});

}

function renderUserBadge(){

const box=document.getElementById("userBadge");
if(!box) return;

if(localStorage.getItem("staffLogin")==="true"){

box.innerHTML=`<span class="user-badge">Connecté staff : ${localStorage.getItem("staffUser")}</span>`;
return;

}

if(getDiscordId()){

box.innerHTML=`<span class="user-badge">Connecté Discord : ${getDiscordName()}</span>`;

}else{

box.innerHTML=`<span class="user-badge">Non connecté</span>`;

}

}

function setupButtons(){

const loginBtn=document.getElementById("discordLoginBtn");

if(loginBtn && typeof DISCORD_OAUTH_URL!=="undefined"){

loginBtn.href=DISCORD_OAUTH_URL;

}

const logoutBtn=document.getElementById("logoutBtn");
if(logoutBtn) logoutBtn.onclick=logoutAll;

const staffBtn=document.getElementById("staffLoginBtn");
if(staffBtn) staffBtn.onclick=loginStaff;

}

function fileToBase64(file){

return new Promise((resolve,reject)=>{

if(!file) return resolve("");

const reader=new FileReader();

reader.onload=()=>resolve(reader.result);
reader.onerror=reject;

reader.readAsDataURL(file);

});

}

async function loadConvoys(){

const container=document.getElementById("convoys");

if(!container) return;

const res=await fetch(`${API}/convoys`);
const convoys=await res.json();

container.innerHTML=convoys.length?convoys.map(c=>`

<div class="card">

${c.image?`<img src="${c.image}" style="width:100%;max-height:250px;object-fit:cover;border-radius:10px;margin-bottom:10px;">`:""}

<h3>🚛 ${c.depart} ➜ ${c.arrivee}</h3>

<p>${c.date} | ${c.heure}</p>

<button onclick="voteConvoy(${c.id},'like')">👍</button>
<button onclick="voteConvoy(${c.id},'dislike')">👎</button>

</div>

`).join(""):`Aucun convoi`;

}

async function voteConvoy(convoyId,type){

const userId=getDiscordId();

if(!userId){
alert("Connecte toi à Discord");
return;
}

const r=await fetch(`${API}/vote`,{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({convoyId,userId,type})

});

const data=await r.json();

if(!data.ok) alert("Tu as déjà voté");

loadConvoys();

}

function convoyFormSetup(){

const form=document.getElementById("convoyForm");
if(!form) return;

form.addEventListener("submit",async(e)=>{

e.preventDefault();

const imageFile=document.getElementById("convoyImage").files[0];
const image=await fileToBase64(imageFile);

const body={

entrepriseDepart:document.getElementById("entrepriseDepart").value,
depart:document.getElementById("depart").value,
entrepriseArrivee:document.getElementById("entrepriseArrivee").value,
arrivee:document.getElementById("arrivee").value,
date:document.getElementById("date").value,
heure:document.getElementById("heure").value,
serveur:document.getElementById("serveur").value,
image

};

await fetch(`${API}/convoys`,{

method:"POST",

headers:{
"Content-Type":"application/json",
"userId":getDiscordId()||"946284221150949396"
},

body:JSON.stringify(body)

});

alert("Convoi créé");

form.reset();
loadConvoys();

});

}

(async function init(){

protectStaffPage();
updateMenuVisibility();
renderUserBadge();
setupButtons();
loadConvoys();
convoyFormSetup();

})();
