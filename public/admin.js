let data=[], key="", shortsQ=[];
const $=x=>document.getElementById(x);

fetch("/api/questions").then(r=>r.json()).then(d=>shortsQ=d.shorts);

async function load(){
  key=$("key").value.trim();
  if(!key) return alert("Enter admin key");
  $("msg").textContent="Loading...";
  let r=await fetch("/api/admin/candidates?key="+encodeURIComponent(key));
  if(!r.ok){$("msg").textContent="❌ Invalid admin key.";return;}
  data=await r.json();
  $("msg").textContent="✅ Loaded "+data.length+" candidate"+(data.length!==1?"s":"")+" successfully.";
  $("adminMain").style.display="block";
  renderStats();
  renderTable();
}

function renderStats(){
  let total=data.length;
  let shortlisted=data.filter(x=>x.status==="shortlist").length;
  let avgMcq=total?Math.round(data.reduce((n,x)=>n+x.mcq_score,0)/total):0;
  let avgTotal=total?Math.round(data.reduce((n,x)=>n+(x.mcq_score+x.written_score+x.practical_score+x.interview_score),0)/total):0;
  $("stats").innerHTML=`
    <div class="stat-card"><b>${total}</b><span>Total Submissions</span></div>
    <div class="stat-card"><b>${shortlisted}</b><span>Shortlisted</span></div>
    <div class="stat-card"><b>${avgMcq}/30</b><span>Avg MCQ Score</span></div>
    <div class="stat-card"><b>${avgTotal}/100</b><span>Avg Total Score</span></div>
  `;
}

function renderTable(){
  let s=($("search").value||"").toLowerCase();
  let filtered=data.filter(x=>(x.name+" "+x.email+" "+x.mobile).toLowerCase().includes(s));
  $("rows").innerHTML=filtered.map(x=>{
    let total=x.mcq_score+x.written_score+x.practical_score+x.interview_score;
    let statusClass=x.status==="shortlist"?"status-shortlist":x.status==="reject"?"status-reject":"status-hold";
    return `<tr>
      <td><b>${esc(x.name)}</b><br><small style="color:#64748b">${esc(x.email)}</small><br><small style="color:#94a3b8">${esc(x.mobile)}</small></td>
      <td style="font-size:12px;color:#64748b">${new Date(x.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
      <td><b>${x.mcq_score}</b>/30</td>
      <td><input class="score-input" type="number" min="0" max="20" value="${x.written_score}" onchange="update(${x.id},'written_score',this.value)"></td>
      <td><input class="score-input" type="number" min="0" max="30" value="${x.practical_score}" onchange="update(${x.id},'practical_score',this.value)"></td>
      <td><input class="score-input" type="number" min="0" max="20" value="${x.interview_score}" onchange="update(${x.id},'interview_score',this.value)"></td>
      <td><b>${total}</b>/100</td>
      <td><select class="status-select ${statusClass}" onchange="update(${x.id},'status',this.value)">
        <option ${x.status==="shortlist"?"selected":""} value="shortlist">✅ Shortlist</option>
        <option ${x.status==="hold"?"selected":""} value="hold">⏸ Hold</option>
        <option ${x.status==="reject"?"selected":""} value="reject">❌ Reject</option>
      </select></td>
      <td><button class="view-btn" onclick="detail(${x.id})">View →</button></td>
    </tr>`;
  }).join("");
}

async function update(id,field,value){
  let body={};
  body[field]=field==="status"?value:Number(value);
  let r=await fetch("/api/admin/candidates/"+id,{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify(body)});
  if(r.ok){
    let x=await r.json();
    let i=data.findIndex(z=>z.id===id);
    if(i>=0) data[i]=x;
    renderStats();
    renderTable();
  } else alert("Update failed");
}

function detail(id){
  let x=data.find(z=>z.id===id);
  let total=x.mcq_score+x.written_score+x.practical_score+x.interview_score;
  let mcqAnswers=x.mcq_answers||[];
  $("detail").style.display="block";
  $("detail").innerHTML=`
    <div class="detail-card">
      <div class="detail-topbar">
        <div>
          <h2>${esc(x.name)} — Submission #${x.id}</h2>
        </div>
        <button class="close-btn" onclick="$('detail').style.display='none';window.scrollTo(0,0)">✕ Close</button>
      </div>
      <div class="detail-meta">${esc(x.email)} · ${esc(x.mobile)} · Submitted: ${new Date(x.created_at).toLocaleString("en-IN")}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        <div class="stat-card" style="min-width:110px"><b>${x.mcq_score}/30</b><span>MCQ</span></div>
        <div class="stat-card" style="min-width:110px"><b>${x.written_score}/20</b><span>Written</span></div>
        <div class="stat-card" style="min-width:110px"><b>${x.practical_score}/30</b><span>Practical</span></div>
        <div class="stat-card" style="min-width:110px"><b>${x.interview_score}/20</b><span>Interview</span></div>
        <div class="stat-card" style="min-width:110px;background:#f0fdf4;border-color:#bbf7d0"><b>${total}/100</b><span>Total</span></div>
      </div>

      <div class="section-title">Part 1 — MCQ Answers</div>
      <div class="mcq-grid">
        ${mcqAnswers.map((a,i)=>{
          let correct=i<30?[0,1,1,1,1,2,1,1,1,1,0,2,1,2,1,0,0,1,0,1,0,1,1,0,0,0,1,0,0,1][i]:-1;
          let isCorrect=Number(a)===correct;
          return `<div class="mcq-item ${isCorrect?"correct":"wrong"}">
            <div class="mcq-num">Q${i+1}</div>
            <div class="mcq-ans">${String.fromCharCode(65+Number(a))} ${isCorrect?"✓":"✗"}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="section-title">Part 2 — Short Answers</div>
      ${(x.written||[]).map((v,i)=>`
        <div class="q-label">${31+i}. ${esc(shortsQ[i]||"Short question")}</div>
        <div class="answer-box">${esc(v)||"<em style='color:#94a3b8'>No answer</em>"}</div>
      `).join("")}

      <div class="section-title">Part 3 — Practical Task</div>
      <div class="q-label">Task A — Keyword Research (10 marks)</div>
      <div class="answer-box">${esc(x.practical?.a)||"<em style='color:#94a3b8'>No answer</em>"}</div>
      <div class="q-label">Task B — On-Page Optimization (10 marks)</div>
      <div class="answer-box">${esc(x.practical?.b)||"<em style='color:#94a3b8'>No answer</em>"}</div>
      <div class="q-label">Task C — 30-Day SEO Strategy (10 marks)</div>
      <div class="answer-box">${esc(x.practical?.c)||"<em style='color:#94a3b8'>No answer</em>"}</div>
    </div>
  `;
  $("detail").scrollIntoView({behavior:"smooth"});
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
