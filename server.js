const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const QUESTIONS = [
["SEO stands for:",["Search Engine Optimization","Search Engine Operation","Search Experience Optimization","Search Engine Output"],0],
["Which tag defines the page title?",["<h6>","<title>","<p>","<strong>"],1],
["Main SEO purpose of a meta description?",["Direct ranking factor","Improve CTR from search results","Create backlinks","Increase website speed"],1],
["Which tool monitors Google search performance?",["Canva","Google Search Console","Photoshop","Google Slides"],1],
["What does a 301 redirect indicate?",["Temporary redirect","Permanent redirect","Server error","Page not found"],1],
["Which HTTP status code means Not Found?",["200","301","404","500"],2],
["What is keyword cannibalization?",["Removing keywords","Multiple pages competing for same/similar intent","Keyword research","Using keywords in URLs"],1],
["Which is a cleaner SEO URL?",["example.com/page?id=12345","example.com/seo-services","example.com/p=abc123","example.com/category/page/xyz/123"],1],
["What is an XML sitemap mainly used for?",["Designing a website","Helping search engines discover URLs","Creating backlinks","Increasing image quality"],1],
["What does robots.txt control?",["Website colors","Crawler access instructions","Website hosting","Page speed"],1],
["What is a canonical tag used for?",["Indicating the preferred version of a URL","Creating a title","Blocking all users","Creating backlinks"],0],
["Which is an off-page SEO activity?",["Internal linking","Meta title optimization","Link building","Image compression"],2],
["What is search intent?",["Website design","The reason behind a user's search query","Domain authority","Website speed"],1],
["Which is a transactional keyword?",["What is SEO?","SEO meaning","Buy SEO software","SEO history"],2],
["What is internal linking?",["Linking to another website","Linking pages within the same website","Buying backlinks","Social media promotion"],1],
["Which can affect Core Web Vitals?",["Page performance","Logo color","Domain name length","Number of social followers"],0],
["What does CTR mean?",["Click Through Rate","Content Traffic Ranking","Click Traffic Report","Conversion Traffic Ratio"],0],
["What is a backlink?",["Internal page link","Link from another website to your website","Image link","Broken link"],1],
["Which backlink is generally more valuable?",["Relevant and authoritative website link","Random spam website link","Hundreds of unrelated directory links","Hidden links"],0],
["What is duplicate content?",["Two images on a page","Substantially similar/identical content on multiple URLs","Two headings","Multiple keywords"],1],
["Which Google tool analyzes traffic and user behavior?",["Google Analytics","Google Docs","Google Maps","Google Keep"],0],
["What is a long-tail keyword?",["Very short keyword","More specific, usually longer search query","Branded logo","Domain name"],1],
["Which is generally black-hat SEO?",["Helpful content","Keyword stuffing","Internal linking","Technical optimization"],1],
["What does noindex generally tell search engines?",["Do not index this page","Delete the website","Speed up the page","Create a backlink"],0],
["What is anchor text?",["Text users click on in a link","Page title","Image name","Meta description"],0],
["What is a broken link?",["Link pointing to an unavailable/non-working destination","Internal link","Image link","HTTPS link"],0],
["Which protocol is preferred for website security?",["HTTP","HTTPS","FTP","SMTP"],1],
["What is keyword research used for?",["Finding relevant search queries/topics","Designing logos","Creating invoices","Managing employees"],0],
["Which metric shows clicks relative to impressions?",["CTR","Bounce rate","DA","CPC"],0],
["Organic traffic drops sharply. What should you do first?",["Immediately buy backlinks","Investigate data, indexing, technical issues, algorithm changes and other causes","Delete all pages","Change the logo"],1]
];
const SHORTS=[
"Explain On-Page SEO and give 5 examples.",
"What is the difference between On-Page SEO, Off-Page SEO and Technical SEO?",
"A page ranks around position 8 but gets very few clicks. What would you check or improve?",
"What steps would you follow for keyword research for a new website?",
"Organic traffic dropped 40% in one week. What would you investigate?"
];

async function init(){
 await pool.query(`CREATE TABLE IF NOT EXISTS candidates(
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, mobile TEXT NOT NULL, email TEXT NOT NULL,
  mcq_score INT NOT NULL, mcq_answers JSONB, written JSONB, practical JSONB,
  interview_score INT DEFAULT 0, written_score INT DEFAULT 0, practical_score INT DEFAULT 0,
  status TEXT DEFAULT 'hold', created_at TIMESTAMPTZ DEFAULT NOW()
 )`);
}
app.get("/api/questions",(req,res)=>res.json({questions:QUESTIONS.map(q=>({q:q[0],options:q[1]})),shorts:SHORTS}));

app.post("/api/submissions",async(req,res)=>{
 try{
  const {name,mobile,email,answers,written,practical}=req.body;
  if(!name||!mobile||!email||!Array.isArray(answers)) return res.status(400).json({error:"Missing candidate data"});
  let score=0;
  answers.forEach((a,i)=>{if(Number(a)===QUESTIONS[i][2]) score++});
  const r=await pool.query(`INSERT INTO candidates(name,mobile,email,mcq_score,mcq_answers,written,practical)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,mcq_score`,[name,mobile,email,score,JSON.stringify(answers),JSON.stringify(written||[]),JSON.stringify(practical||{})]);
  res.json({ok:true,id:r.rows[0].id,mcqScore:score});
 }catch(e){console.error(e);res.status(500).json({error:"Submission failed"})}
});

function admin(req,res,next){
 const key=req.headers["x-admin-key"]||req.query.key;
 if(!process.env.ADMIN_KEY || key!==process.env.ADMIN_KEY) return res.status(401).json({error:"Unauthorized"});
 next();
}
app.get("/api/admin/candidates",admin,async(req,res)=>{
 const r=await pool.query("SELECT * FROM candidates ORDER BY created_at DESC");
 res.json(r.rows);
});
app.patch("/api/admin/candidates/:id",admin,async(req,res)=>{
 const {status,interview_score,written_score,practical_score}=req.body;
 const r=await pool.query(`UPDATE candidates SET status=COALESCE($1,status), interview_score=COALESCE($2,interview_score),
 written_score=COALESCE($3,written_score), practical_score=COALESCE($4,practical_score) WHERE id=$5 RETURNING *`,
 [status,interview_score,written_score,practical_score,req.params.id]);
 res.json(r.rows[0]);
});
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||10000;
init().then(()=>app.listen(PORT,()=>console.log(`SEO Hire running on ${PORT}`))).catch(e=>{console.error(e);process.exit(1)});
