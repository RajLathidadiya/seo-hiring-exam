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
["Which tag is most important for the main page title?",["<h6>","<title>","<p>","<strong>"],1],
["What is the ideal purpose of a meta description?",["Direct ranking factor","Improve CTR from search results","Create backlinks","Increase website speed"],1],
["Which tool is primarily used to monitor a website's Google search performance?",["Canva","Google Search Console","Photoshop","Google Slides"],1],
["What does a 301 redirect indicate?",["Temporary redirect","Permanent redirect","Server error","Page not found"],1],
["Which HTTP status code means \"Not Found\"?",["200","301","404","500"],2],
["What is keyword cannibalization?",["Removing keywords","Multiple pages competing for the same/similar search intent","Keyword research","Using keywords in URLs"],1],
["Which is generally a better URL?",["example.com/page?id=12345","example.com/seo-services","example.com/p=abc123","example.com/category/page/xyz/123"],1],
["What is an XML sitemap mainly used for?",["Designing a website","Helping search engines discover URLs","Creating backlinks","Increasing image quality"],1],
["What does robots.txt control?",["Website colors","Crawler access instructions","Website hosting","Page speed"],1],
["What is a canonical tag used for?",["Indicating the preferred version of a URL","Creating a title","Blocking all users","Creating backlinks"],0],
["Which is an example of an off-page SEO activity?",["Internal linking","Meta title optimization","Link building","Image compression"],2],
["What is search intent?",["Website design","The reason behind a user's search query","Domain authority","Website speed"],1],
["Which is a transactional keyword?",["What is SEO?","SEO meaning","Buy SEO software","SEO history"],2],
["What is internal linking?",["Linking to another website","Linking pages within the same website","Buying backlinks","Social media promotion"],1],
["Which factor can directly affect Core Web Vitals?",["Page performance","Logo color","Domain name length","Number of social followers"],0],
["What does CTR mean?",["Click Through Rate","Content Traffic Ranking","Click Traffic Report","Conversion Traffic Ratio"],0],
["What is a backlink?",["Internal page link","Link from another website to your website","Image link","Broken link"],1],
["Which backlink is generally more valuable?",["Relevant and authoritative website link","Random spam website link","Hundreds of unrelated directory links","Hidden links"],0],
["What is duplicate content?",["Two images on a page","Substantially similar/identical content appearing in multiple URLs","Two headings","Multiple keywords"],1],
["Which Google tool can help analyze website traffic and user behavior?",["Google Analytics","Google Docs","Google Maps","Google Keep"],0],
["What is a long-tail keyword?",["Very short keyword","More specific, usually longer search query","Branded logo","Domain name"],1],
["Which is generally considered a black-hat SEO technique?",["Helpful content","Keyword stuffing","Internal linking","Technical optimization"],1],
["What does \"noindex\" generally tell search engines?",["Do not index this page","Delete the website","Speed up the page","Create a backlink"],0],
["What is an anchor text?",["Text users click on in a link","Page title","Image name","Meta description"],0],
["What is a broken link?",["Link pointing to an unavailable/non-working destination","Internal link","Image link","HTTPS link"],0],
["Which protocol is preferred for website security?",["HTTP","HTTPS","FTP","SMTP"],1],
["What is keyword research used for?",["Finding relevant search queries/topics","Designing logos","Creating invoices","Managing employees"],0],
["Which metric can indicate how often a search result was clicked relative to impressions?",["CTR","Bounce rate","DA","CPC"],0],
["What should an SEO Executive do first when organic traffic suddenly drops?",["Immediately buy backlinks","Investigate data, indexing, technical issues, algorithm changes and other causes","Delete all pages","Change the logo"],1]
];

const SHORTS = [
  "Explain On-Page SEO and give 5 examples.",
  "What is the difference between On-Page SEO, Off-Page SEO and Technical SEO?",
  "A page ranks around position 8 but gets very few clicks. What would you check or improve?",
  "What steps would you follow for keyword research for a new website?",
  "Organic traffic dropped 40% in one week. What would you investigate?"
];

// ─── AUTO-SCORING ENGINE ───────────────────────────────────────────────────

// Keywords for each short answer question
const SHORT_KEYWORDS = [
  // Q31: On-Page SEO + 5 examples
  ["on-page","meta title","title tag","meta description","h1","h2","heading","url","slug","alt text","alt tag","image alt","internal link","content","keyword","page speed","canonical","schema","breadcrumb","word count"],
  // Q32: On-Page vs Off-Page vs Technical
  ["on-page","off-page","technical","backlink","link building","guest post","meta","content","crawl","sitemap","robots.txt","site speed","core web vitals","social signal","domain authority","structured data","https","mobile"],
  // Q33: Position 8 low CTR
  ["ctr","click through","meta description","title","rich snippet","schema","structured data","search console","impression","serp","power word","number","emotion","rewrite","optimize","compelling","question","bracket"],
  // Q34: Keyword research steps
  ["competitor","search volume","keyword difficulty","intent","long-tail","short-tail","ahrefs","semrush","keyword planner","ubersuggest","topic","cluster","seed keyword","niche","gap","content gap","filter","priority"],
  // Q35: Traffic dropped 40%
  ["algorithm","core update","penalty","manual action","technical","crawl","deindex","search console","analytics","backlink","competitor","content","seasonal","301","redirect","canonical","coverage","spam","hreflang"]
];

function scoreShortAnswers(written) {
  return (written || []).map((ans, i) => {
    const text = (ans || "").toLowerCase().trim();
    if (text.length < 20) return 0;
    const kws = SHORT_KEYWORDS[i] || [];
    const found = kws.filter(k => text.includes(k)).length;
    const ratio = found / kws.length;
    // Scale to 4 marks
    if (ratio >= 0.40) return 4;
    if (ratio >= 0.25) return 3;
    if (ratio >= 0.12) return 2;
    if (found >= 1 || text.length >= 80) return 1;
    return 0;
  });
}

function scorePractical(p) {
  const details = {};

  // Task A — Keyword research (10 marks)
  const aText = (p && p.a ? p.a : "").toLowerCase();
  {
    const domainKws = ["villa","resort","udaipur","booking","luxury","rajasthan","honeymoon","couple","family","weekend","getaway","cheap","best","near","heritage","hotel","stay","romantic","tour","package"];
    const intentKws = ["informational","transactional","commercial","navigational"];
    const priorityKws = ["high","medium","low"];
    const domainFound = domainKws.filter(k => aText.includes(k)).length;
    const intentFound = intentKws.filter(k => aText.includes(k)).length;
    const priorityFound = priorityKws.filter(k => aText.includes(k)).length;
    let score = 0;
    // Domain keywords presence (up to 5 marks)
    if (domainFound >= 10) score += 5;
    else if (domainFound >= 7) score += 4;
    else if (domainFound >= 4) score += 3;
    else if (domainFound >= 2) score += 2;
    else if (domainFound >= 1) score += 1;
    // Intent coverage (up to 3 marks)
    score += Math.min(3, intentFound);
    // Priority levels (up to 2 marks)
    if (priorityFound >= 3) score += 2;
    else if (priorityFound >= 1) score += 1;
    details.a = Math.min(10, score);
  }

  // Task B — On-page optimization (10 marks)
  const bText = (p && p.b ? p.b : "").toLowerCase();
  {
    let score = 0;
    const hasTitle = /seo title|title:/i.test(p && p.b ? p.b : "");
    const hasMeta = /meta description|description:/i.test(p && p.b ? p.b : "");
    const hasH1 = /h1\s*:|h1\s*-/i.test(p && p.b ? p.b : "") || bText.includes("h1");
    const h2count = (bText.match(/h2/g) || []).length;
    const relevantKws = ["villa","resort","udaipur","luxury","book","rajasthan","couple","family"].filter(k => bText.includes(k)).length;
    if (hasTitle) score += 3;      // SEO title present
    if (hasMeta) score += 3;       // Meta description present
    if (hasH1) score += 2;         // H1 present
    if (h2count >= 3) score += 2;  // 3 H2s present
    else if (h2count >= 1) score += 1;
    // Bonus for relevant keywords in the content
    if (relevantKws >= 3 && score < 10) score = Math.min(10, score + 1);
    details.b = Math.min(10, score);
  }

  // Task C — 30-day SEO strategy (10 marks)
  const cText = (p && p.c ? p.c : "").toLowerCase();
  {
    const topics = [
      "technical","sitemap","robots","crawl","speed","core web",
      "keyword","research","volume","intent",
      "content","blog","article","page",
      "on-page","title","meta","heading",
      "internal link","link structure",
      "local seo","google business","gmb","local",
      "backlink","link building","guest post","outreach",
      "tracking","reporting","analytics","search console","kpi"
    ];
    const found = topics.filter(k => cText.includes(k)).length;
    const hasWeeks = /week\s*[1-4]|day\s*[1-9]/i.test(p && p.c ? p.c : "");
    let score = 0;
    if (found >= 14) score = 10;
    else if (found >= 11) score = 8;
    else if (found >= 8) score = 6;
    else if (found >= 5) score = 5;
    else if (found >= 3) score = 3;
    else if (found >= 1) score = 2;
    else if (cText.length > 100) score = 1;
    if (hasWeeks && score < 10) score = Math.min(10, score + 1); // Bonus for structured weekly plan
    details.c = Math.min(10, score);
  }

  details.total = details.a + details.b + details.c;
  return details;
}

// ─── DATABASE INIT ─────────────────────────────────────────────────────────

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS candidates(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    mcq_score INT NOT NULL,
    mcq_answers JSONB,
    written JSONB,
    practical JSONB,
    written_breakdown JSONB,
    practical_breakdown JSONB,
    interview_score INT DEFAULT 0,
    written_score INT DEFAULT 0,
    practical_score INT DEFAULT 0,
    status TEXT DEFAULT 'hold',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  // Add columns if upgrading from old schema
  await pool.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS written_breakdown JSONB`).catch(()=>{});
  await pool.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS practical_breakdown JSONB`).catch(()=>{});
}

// ─── ROUTES ────────────────────────────────────────────────────────────────

app.get("/api/questions", (req, res) =>
  res.json({ questions: QUESTIONS.map(q => ({ q: q[0], options: q[1] })), shorts: SHORTS })
);

app.post("/api/submissions", async (req, res) => {
  try {
    const { name, mobile, email, answers, written, practical } = req.body;
    if (!name || !mobile || !email || !Array.isArray(answers))
      return res.status(400).json({ error: "Missing candidate data" });

    // MCQ auto-score
    let mcqScore = 0;
    answers.forEach((a, i) => { if (Number(a) === QUESTIONS[i][2]) mcqScore++; });

    // Short answer auto-score
    const shortScores = scoreShortAnswers(written);
    const writtenScore = shortScores.reduce((a, b) => a + b, 0);

    // Practical auto-score
    const practicalBreakdown = scorePractical(practical);
    const practicalScore = practicalBreakdown.total;

    const r = await pool.query(
      `INSERT INTO candidates
        (name,mobile,email,mcq_score,mcq_answers,written,practical,written_breakdown,practical_breakdown,written_score,practical_score)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id,mcq_score`,
      [
        name, mobile, email,
        mcqScore,
        JSON.stringify(answers),
        JSON.stringify(written || []),
        JSON.stringify(practical || {}),
        JSON.stringify(shortScores),
        JSON.stringify(practicalBreakdown),
        writtenScore,
        practicalScore
      ]
    );
    res.json({ ok: true, id: r.rows[0].id, mcqScore });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Submission failed" });
  }
});

function admin(req, res, next) {
  const key = req.headers["x-admin-key"] || req.query.key;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/admin/candidates", admin, async (req, res) => {
  const r = await pool.query("SELECT * FROM candidates ORDER BY created_at DESC");
  res.json(r.rows);
});

app.patch("/api/admin/candidates/:id", admin, async (req, res) => {
  const { status, interview_score, written_score, practical_score } = req.body;
  const r = await pool.query(
    `UPDATE candidates
     SET status=COALESCE($1,status),
         interview_score=COALESCE($2,interview_score),
         written_score=COALESCE($3,written_score),
         practical_score=COALESCE($4,practical_score)
     WHERE id=$5 RETURNING *`,
    [status, interview_score, written_score, practical_score, req.params.id]
  );
  res.json(r.rows[0]);
});

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/{*splat}", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 10000;
init()
  .then(() => app.listen(PORT, () => console.log(`OpalStays Technical Round running on ${PORT}`)))
  .catch(e => { console.error(e); process.exit(1); });
