
const express=require("express");
const fs=require("fs");
const path=require("path");
const cors=require("cors");
const bodyParser=require("body-parser");

const app=express();
app.use(cors());
app.use(bodyParser.json());

const DATA=path.join(__dirname,"data");
const STAFF_IDS=["1246943697300619405","1246982124419154010","1247188738002386967","946284221150949396"];
function isStaff(id){return STAFF_IDS.includes(String(id));}
function ensureFile(file){const p=path.join(DATA,file); if(!fs.existsSync(p)) fs.writeFileSync(p,"[]","utf8");}
function read(file){ensureFile(file); return JSON.parse(fs.readFileSync(path.join(DATA,file),"utf8"));}
function write(file,data){fs.writeFileSync(path.join(DATA,file),JSON.stringify(data,null,2),"utf8");}

app.get("/",(req,res)=>res.send("FarmOtor V10 backend en ligne"));
app.get("/health",(req,res)=>res.json({status:"ok"}));

app.get("/convoys",(req,res)=>res.json(read("convoys.json")));
app.post("/convoys",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 const convoys=read("convoys.json");
 const convoy={id:Date.now(),entrepriseDepart:req.body.entrepriseDepart||"",depart:req.body.depart||"",entrepriseArrivee:req.body.entrepriseArrivee||"",arrivee:req.body.arrivee||"",date:req.body.date||"",heure:req.body.heure||"",serveur:req.body.serveur||"",likes:0,dislikes:0,createdAt:new Date().toISOString()};
 convoys.push(convoy); write("convoys.json",convoys); res.json({ok:true,convoy});
});
app.delete("/convoys/:id",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 let convoys=read("convoys.json");
 convoys=convoys.filter(c=>String(c.id)!==String(req.params.id));
 write("convoys.json",convoys); res.json({ok:true});
});

app.get("/cargoes",(req,res)=>res.json(read("cargoes.json")));
app.post("/cargoes",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 const cargoes=read("cargoes.json");
 const cargo={id:Date.now(),nom:req.body.nom||"",poids:req.body.poids||"",depart:req.body.depart||"",arrivee:req.body.arrivee||"",createdAt:new Date().toISOString()};
 cargoes.push(cargo); write("cargoes.json",cargoes); res.json({ok:true,cargo});
});
app.delete("/cargoes/:id",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 let cargoes=read("cargoes.json");
 cargoes=cargoes.filter(c=>String(c.id)!==String(req.params.id));
 write("cargoes.json",cargoes); res.json({ok:true});
});

app.post("/vote",(req,res)=>{
 const {convoyId,userId,type}=req.body;
 let votes=read("votes.json");
 const already=votes.find(v=>String(v.convoyId)===String(convoyId)&&String(v.userId)===String(userId));
 if(already) return res.json({ok:false,message:"already voted"});
 votes.push({id:Date.now(),convoyId,userId,type,createdAt:new Date().toISOString()});
 write("votes.json",votes);
 let convoys=read("convoys.json");
 const convoy=convoys.find(c=>String(c.id)===String(convoyId));
 if(!convoy) return res.status(404).json({ok:false});
 if(type==="like") convoy.likes+=1;
 if(type==="dislike") convoy.dislikes+=1;
 write("convoys.json",convoys); res.json({ok:true});
});

app.post("/applications",(req,res)=>{
 const data=read("applications.json");
 data.push({id:Date.now(),discord:req.body.discord||"",age:req.body.age||"",experience:req.body.experience||"",choix:req.body.choix||[],motivation:req.body.motivation||"",status:"pending",createdAt:new Date().toISOString()});
 write("applications.json",data); res.json({ok:true});
});
app.get("/admin/applications",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 res.json(read("applications.json"));
});
app.post("/admin/applications/:id/:action",(req,res)=>{
 const user=req.headers.userid;
 if(!isStaff(user)) return res.status(403).json({error:"not staff"});
 let data=read("applications.json");
 const id=Number(req.params.id); const action=req.params.action; const item=data.find(x=>x.id===id);
 if(action==="delete"){data=data.filter(x=>x.id!==id);}
 else if(item){if(action==="accept") item.status="accepted"; if(action==="reject") item.status="rejected";}
 write("applications.json",data); res.json({ok:true});
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log("Server running on "+PORT));
