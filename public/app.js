let questions=[], shorts=[], time=3600, tm;
const $=x=>document.getElementById(x);

fetch("/api/questions").then(r=>r.json()).then(d=>{
  questions=d.questions;
  shorts=d.shorts;
});

$("candidate").onsubmit=e=>{
  e.preventDefault();
  $("intro").hidden=true;
  $("exam").hidden=false;
  $("hello").textContent="Welcome, "+$("name").value+"!";
  render();
  startTimer();
};

function startTimer(){
  tm=setInterval(()=>{
    time--;
    let m=Math.floor(time/60), s=time%60;
    $("timer").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
    if(time<=300) $("timer").classList.add("urgent");
    if(time<=0){clearInterval(tm);submit();}
  },1000);
}

function render(){
  // MCQs
  $("mcqs").innerHTML=questions.map((x,i)=>`
    <div class="q">
      <div class="q-text"><span class="q-num">${i+1}.</span> ${esc(x.q)}</div>
      <div class="opts">
        ${x.options.map((o,j)=>`
          <label class="opt">
            <input type="radio" name="q${i}" value="${j}" required>
            <span class="opt-letter">${String.fromCharCode(65+j)}.</span>
            ${esc(o)}
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");

  // Short answers
  $("shorts").innerHTML=shorts.map((q,i)=>`
    <div class="short-q">
      <div class="short-q-text"><span class="q-num">${31+i}.</span> ${esc(q)}</div>
      <div class="short-marks">4 Marks</div>
      <textarea name="s${i}" placeholder="Write your answer here..." required></textarea>
    </div>
  `).join("");
}

$("paper").onsubmit=e=>{
  e.preventDefault();
  // Check all 30 MCQs are answered
  let unanswered=[];
  questions.forEach((_,i)=>{
    if(!document.querySelector(`input[name="q${i}"]:checked`)) unanswered.push(i+1);
  });
  if(unanswered.length>0){
    let msg=`Please answer all MCQ questions before submitting.\nUnanswered: Q${unanswered.slice(0,5).join(', Q')}${unanswered.length>5?' ...and '+(unanswered.length-5)+' more':''}`;
    alert(msg);
    let el=document.querySelector(`input[name="q${unanswered[0]-1}"]`);
    if(el) el.closest('.q').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  submit();
};

async function submit(){
  const btn=$("submitBtn");
  if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  let f=new FormData($("paper"));
  let answers=questions.map((_,i)=>Number(f.get("q"+i)));
  let written=shorts.map((_,i)=>f.get("s"+i));
  let practical={a:f.get("a"),b:f.get("b"),c:f.get("c")};
  let body={name:$("name").value,mobile:$("mobile").value,email:$("email").value,answers,written,practical};
  try{
    let r=await fetch("/api/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    let d=await r.json();
    if(!r.ok){if(btn){btn.disabled=false;btn.textContent="Submit Assessment →";}return alert(d.error||"Submission failed");}
    clearInterval(tm);
    $("exam").hidden=true;
    $("done").hidden=false;
    $("doneText").textContent="Your submission ID is #"+d.id+". Our team will review your answers and contact you with the results shortly.";
    window.scrollTo(0,0);
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent="Submit Assessment →";}
    alert("Network error. Please try again.");
  }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
