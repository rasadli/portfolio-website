// All site copy lives here. Edit this file, then run `node build.mjs`.
// Dates are "YYYY-MM"; end: null means the role is current.

export const site = {
  url: 'https://rasadli.github.io/portfolio-website/',
  title: 'Rashad Asadli | Software Engineer, .NET Backend Systems',
  description:
    'Rashad Asadli is a Software Engineer at AzInTelecom in Baku, specializing in C#, ASP.NET Core, secure APIs and data-driven backend systems.',
};

export const person = {
  name: 'Rashad Asadli',
  role: 'Software Engineer',
  employer: 'AzInTelecom',
  location: 'Baku, Azerbaijan',
  tagline: 'I build reliable software for real-world problems.',
  summary:
    'Software engineer specializing in .NET backend development, secure APIs and data-driven applications, with a growing focus on distributed systems and scalable architecture.',
  email: 'resadesedli26@gmail.com',
  github: 'https://github.com/rasadli',
  linkedin: 'https://www.linkedin.com/in/rashadasadli/',
  resume: 'downloads/RashadAsadli_CV.pdf',
};

export const about = {
  paragraphs: [
    'I started programming during my foundation year at ADA University, taking a full-stack course at MilliSoft alongside my studies. That led to my first startup: I built the front end of ToorLin Tournaments, a gaming platform, and our team took it through the KOICA, VIVEKA and SABAH.HUB programmes.',
    'From February 2024 I worked full-time at MilliSoft Studio on production .NET systems for accounting, education and e-commerce. The longer I worked on them, the more my attention moved from screens to what sits behind them: APIs, business rules and databases.',
    'In May 2026 I left that job for an internship at AzInTelecom, because I wanted a harder engineering environment more than I wanted to keep my title. About four months later I moved into a full-time role there. I am finishing my BSc at the same time, teaching as a TA, and working on a graduation project in payment settlement.',
  ],
  path: [
    { stage: 'Learning', when: '2022', note: 'Full-stack course at MilliSoft' },
    { stage: 'Building products', when: '2023', note: 'ToorLin, startup programmes' },
    { stage: 'Professional engineering', when: '2024', note: 'MilliSoft Studio, production .NET' },
    { stage: 'Enterprise systems', when: '2026', note: 'AzInTelecom' },
    { stage: 'Architecture and research', when: 'Now', note: 'Graduation project, distributed systems' },
  ],
};

// Waterfall in the hero. kind: work | teach | study. `to` is an anchor on the page.
export const trace = [
  { label: 'ADA University', detail: 'BSc Information Technology', kind: 'study', start: '2022-09', end: '2027-06', expected: true, to: '#record' },
  { label: 'MilliSoft', detail: 'Full-stack course', kind: 'study', start: '2022-10', end: '2023-06', to: '#about' },
  { label: 'ToorLin Tournaments', detail: 'Frontend Developer', kind: 'work', start: '2023-10', end: '2024-07', to: '#exp-toorlin' },
  { label: 'MilliSoft', detail: 'Full-stack mentor', kind: 'teach', start: '2024-01', end: '2024-06', to: '#teaching' },
  { label: 'MilliSoft Studio', detail: 'Software Engineer', kind: 'work', start: '2024-02', end: '2026-05', to: '#exp-millisoft' },
  { label: 'University of Latvia', detail: 'Exchange semester', kind: 'study', start: '2025-02', end: '2025-06', to: '#record' },
  { label: 'Arxitech', detail: 'BIM Automation Intern', kind: 'work', start: '2025-08', end: '2025-09', to: '#exp-arxitech' },
  { label: 'ADA University', detail: 'TA, Web & Mobile I', kind: 'teach', start: '2025-09', end: '2026-01', to: '#teaching' },
  { label: 'ADA University', detail: 'TA, Principles of Programming II', kind: 'teach', start: '2026-02', end: '2026-05', to: '#teaching' },
  { label: 'AzInTelecom', detail: 'Software Engineering Intern', kind: 'work', start: '2026-05', end: '2026-08', to: '#exp-azintelecom' },
  { label: 'AzInTelecom', detail: 'Software Engineer', kind: 'work', start: '2026-09', end: null, to: '#exp-azintelecom' },
  { label: 'ADA University', detail: 'TA, Cyber Security Fundamentals', kind: 'teach', start: '2026-09', end: null, to: '#teaching' },
];

export const experience = [
  {
    id: 'azintelecom',
    company: 'AzInTelecom',
    location: 'Baku, Azerbaijan',
    note: 'Backend services for the SİMA İmza digital-signature platform. Promoted from intern to full-time after about four months.',
    roles: [
      {
        title: 'Software Engineer',
        start: '2026-09',
        end: null,
        arrangement: 'Full-time, hybrid',
        points: [
          'Develop backend services for a QR-based document-signing flow, including support for several protocol versions and signature verification for mobile API requests.',
          'Migrated tenant-management and mobile client APIs to a new global .NET 8 platform while keeping released iOS and Android apps working.',
          'Investigate and fix issues in distributed services using logs and Sentry, and work on event-driven and multilingual services.',
        ],
      },
      {
        title: 'Software Engineering Intern',
        start: '2026-05',
        end: '2026-08',
        arrangement: 'On-site',
        points: [
          'Contributed to production backend systems and internal technical solutions.',
          'Supported API development, database operations and backend logic on modern .NET.',
          'Learned how enterprise software is designed, tested and maintained, working alongside experienced engineers.',
        ],
      },
    ],
    stack: ['C#', '.NET 8', 'Kafka', 'MongoDB', 'Redis', 'Sentry'],
  },
  {
    id: 'millisoft',
    company: 'MilliSoft Studio',
    location: 'Baku, Azerbaijan',
    decision:
      'I left this full-time role in May 2026 to compete for an internship at AzInTelecom, choosing a harder engineering environment over seniority.',
    roles: [
      {
        title: 'Software Engineer',
        start: '2024-02',
        end: '2026-05',
        arrangement: 'Full-time, hybrid',
        points: [
          'Developed and maintained production .NET web applications and REST APIs for accounting, education and e-commerce.',
          'Optimized SQL stored procedures and integrated payments, reporting and operational automation.',
          'Moved from broader full-stack work to a backend focus: clean architecture, business logic and database integration.',
        ],
      },
    ],
    stack: ['C#', 'ASP.NET Core', 'Entity Framework', 'SQL Server', 'JavaScript'],
  },
  {
    id: 'arxitech',
    company: 'Arxitech',
    location: 'Remote',
    roles: [
      {
        title: 'BIM Automation Intern',
        start: '2025-08',
        end: '2025-09',
        arrangement: 'Part-time',
        points: [
          'Built Revit plugins in C# to automate modeling and BIM workflows.',
          'Developed tools for data extraction, parameter management and model validation.',
        ],
      },
    ],
    stack: ['C#', '.NET', 'Revit API'],
  },
  {
    id: 'toorlin',
    company: 'ToorLin Tournaments',
    location: 'Remote',
    roles: [
      {
        title: 'Frontend Developer',
        start: '2023-10',
        end: '2024-07',
        arrangement: 'Part-time, startup',
        points: [
          'Built user-facing features for a gaming platform with tournaments, rewards and real-time chat.',
          'Worked on responsive layouts, UI performance and usability.',
        ],
      },
    ],
    stack: ['React', 'JavaScript'],
  },
];

export const featuredProjects = [
  {
    name: 'MasterSchool Portal',
    kicker: 'EdTech, production',
    lead: 'One system for running a training centre.',
    problem:
      'A training centre has to track students, groups, contracts, payments, salaries and attendance, then report across all of them.',
    solution:
      'A central portal with a module for each of those areas, study materials, reporting, and dashboards scoped to each role. Built on .NET 8 with Clean Architecture.',
    contribution: 'Contributed to the platform, including invoicing and reporting.',
    stack: ['.NET 8', 'C#', 'Clean Architecture', 'SQL'],
    status: 'Live in production',
    link: { href: 'https://portal.masterschool.az/', label: 'Open portal' },
    image: { src: 'images/work/masterschool.webp', w: 1110, h: 480, alt: 'MasterSchool Portal admin dashboard with its module navigation' },
    size: 'wide',
  },
  {
    name: 'Sensible Accounting Software',
    kicker: 'Fintech, production',
    lead: 'Online bookkeeping for sole proprietors.',
    problem: 'Sole proprietors spend time on manual bookkeeping and need quick access to their financial data.',
    solution: 'An accounting platform that automates bookkeeping workflows, with a C# API behind it for backend operations.',
    contribution: 'Developed backend features, including work on the C# API and SQL stored procedure optimization.',
    stack: ['C#', '.NET Core', 'SQL', 'JavaScript'],
    status: 'Live in production',
    link: { href: 'https://sensible.az/', label: 'Open site' },
    image: { src: 'images/work/sensible.webp', w: 1400, h: 632, alt: 'Sensible accounting dashboard on a test tenant' },
  },
  {
    name: 'Kral Inşaat',
    kicker: 'E-commerce, production',
    lead: 'A construction store and the tools to run it.',
    problem: 'A construction retailer needed online sales, order visibility and day-to-day inventory control.',
    solution: 'An e-commerce site with payment integration, a Telegram bot for order tracking, and an admin panel for inventory.',
    contribution: 'Worked on the site, including payment integration, the Telegram bot and the admin panel.',
    stack: ['.NET', 'C#', 'Telegram Bot API'],
    status: 'Live in production',
    link: { href: 'https://kral-insaat.millisoft.az/', label: 'Open store' },
    image: { src: 'images/work/kral.webp', w: 1400, h: 639, alt: 'Kral Inşaat store catalogue with filters and products' },
  },
];

export const otherProjects = [
  { name: 'BakerFresh', what: 'Bakery management system with ordering, accounts and admin controls.', stack: 'ASP.NET Core', href: 'https://bakeryfresh-j2kx.onrender.com/index.html', linkLabel: 'Demo' },
  { name: 'ToorLin Tournaments', what: 'Gaming platform with tournaments, rewards and real-time chat. Startup work, frontend only.', stack: 'React' },
  { name: 'Recipe Manager', what: 'CRUD application with filtering, pagination and drag-and-drop. ADA University, 2024–25.', stack: 'React', href: 'https://github.com/rasadli/RecipeManagerApp', linkLabel: 'Code' },
  { name: 'AutoFormFiller', what: 'Chrome extension that fills repetitive forms from profile data. ADA University, 2024.', stack: 'JavaScript, Chrome Extension API', href: 'https://github.com/rasadli/AutoFormFiller', linkLabel: 'Code' },
  { name: 'Library Management System', what: 'Desktop app for managing a book collection, with ratings and reviews. ADA University, 2024.', stack: 'Java, Swing', href: 'https://github.com/rasadli/Libary-Managment', linkLabel: 'Code' },
];

// Optional fields `constraints` and `tradeoffs` render automatically when present.
export const caseStudies = [
  {
    title: 'Moving live mobile APIs to a new platform',
    context: 'SİMA İmza, AzInTelecom',
    problem: 'Tenant-management and mobile client APIs had to move to a new global .NET 8 platform.',
    constraints: 'iOS and Android apps already released to users had to keep working.',
    approach: 'Migrated the APIs to the new platform while keeping them compatible with the released apps.',
    outcome: 'The released apps kept working through the migration.',
  },
  {
    title: 'Supporting several protocol versions in a signing flow',
    context: 'SİMA İmza, AzInTelecom',
    problem: 'A QR-based document-signing flow has to serve clients on more than one protocol version.',
    approach: 'Developed backend services that support several protocol versions and verify signatures on mobile API requests.',
  },
  {
    title: 'Reducing query time in an accounting system',
    context: 'Sensible, MilliSoft Studio',
    problem: 'Bookkeeping screens read from financial records constantly, so slow queries are felt on everyday tasks.',
    approach: 'Optimized the SQL stored procedures behind the C# API used for backend operations.',
    outcome: 'Average query time went down on the optimized procedures.',
  },
  {
    title: 'Automating repetitive BIM work inside Revit',
    context: 'Arxitech',
    problem: 'Repetitive modeling tasks and parameter handling were being done by hand inside Revit.',
    approach: 'Wrote custom plugins in C# against the Revit API for data extraction, parameter management and model validation.',
    outcome: 'Delivered working automation tools during a short remote internship.',
  },
];
export const caseStudiesNote = 'My AzInTelecom work is described only at a high level, because the systems belong to my employer.';

export const research = {
  slug: 'micropayment-settlement',
  title: 'AI-Optimized AZN Micropayment Batching and Settlement',
  status: 'Ongoing senior design project, 2026–2027',
  lead: 'When a payment is very small, the cost of settling it alone can matter more than the payment. Batching fixes that and creates a new problem: every payment waits for its batch.',
  summary:
    'My graduation project at ADA University designs an adaptive, machine-learning-based batching system for micropayment settlement in distributed environments, with a focus on payments in Azerbaijani manat (AZN). It evaluates transaction throughput, confirmation latency, settlement overhead and fault tolerance against fixed batching strategies.',
  statusNote: 'The project is in progress. It has no published results or papers yet, so this page describes the question and not an answer.',
  concepts: [
    { term: 'Micropayment processing', text: 'Handling large numbers of very low-value payments, where per-transaction costs weigh heavily on each one.' },
    { term: 'Fixed batching', text: 'Settling on a set schedule or at a set size. It is simple and predictable, but it ignores how traffic actually arrives.' },
    { term: 'Adaptive batching', text: 'Changing when a batch closes in response to current conditions, such as load or how long the oldest payment has waited.' },
    { term: 'Settlement overhead', text: 'The cost of finalizing payments. Grouping them spreads that cost across more payments.' },
    { term: 'Confirmation latency', text: 'How long a payer or merchant waits for a payment to be confirmed. Bigger batches tend to increase it.' },
    { term: 'Throughput', text: 'How many payments the system can process in a given time, which sets the upper limit on useful batching.' },
    { term: 'Fault tolerance', text: 'A batch must not lose or duplicate payments if something fails partway through settlement.' },
    { term: 'Simulation and evaluation', text: 'Testing strategies against the same simulated workloads, so that differences can be attributed to the strategy.' },
    { term: 'Machine-learning-based batching', text: 'Using a learned model to make batching decisions, then testing it against fixed strategies.' },
  ],
  diagramCaption: 'Concept illustration of one made-up payment stream. It is not data or a result from the project.',
};

// tier: 'prod' = used in professional work; 'other' = projects, coursework or working knowledge.
export const skills = [
  {
    group: 'Backend engineering',
    prod: ['C#', '.NET 8', 'ASP.NET Core Web API', 'ASP.NET MVC', 'REST APIs', 'Signature verification', 'Event-driven services', 'Revit API'],
    other: ['Authentication and authorization (JWT)', 'Hangfire', 'SignalR', 'Telegram Bot API', 'Java'],
  },
  {
    group: 'Databases and storage',
    prod: ['SQL Server', 'Stored procedures', 'Query optimization', 'Entity Framework Core', 'MongoDB', 'Redis'],
    other: ['PostgreSQL', 'Dapper', 'S3-compatible storage'],
  },
  {
    group: 'Frontend',
    prod: ['JavaScript', 'React', 'HTML', 'CSS'],
    other: ['jQuery', 'Ajax', 'Axios', 'Bootstrap', 'Chrome Extension API'],
  },
  {
    group: 'Engineering concepts',
    prod: ['API design', 'API migration and compatibility', 'Database design', 'Debugging distributed services'],
    other: ['Clean Architecture', 'Object-oriented programming', 'Data structures and algorithms', 'Operating systems', 'Security fundamentals', 'Distributed systems'],
  },
  {
    group: 'Developer tools',
    prod: ['Git', 'GitHub', 'GitLab', 'Postman', 'Swagger', 'Sentry', 'Kafka (basic)'],
    other: ['Docker', 'Kubernetes (basic)', 'GitHub Actions', 'GitLab CI', 'RabbitMQ (basic)', 'Elasticsearch and Kibana (basic)'],
  },
];

export const education = [
  {
    school: 'ADA University',
    degree: 'BSc Information Technology',
    when: 'Sep 2022 – Jun 2027 (expected)',
    place: 'Baku, Azerbaijan',
    detail: 'GPA 3.89 / 4.00',
  },
  {
    school: 'University of Latvia',
    degree: 'Undergraduate exchange semester, Faculty of Science and Technology',
    when: 'Feb – Jun 2025',
    place: 'Riga, Latvia',
    detail: 'Data structures and algorithms, database systems, operating systems, IT project management',
  },
];

export const teaching = {
  intro: 'Teaching has run alongside my engineering work since 2024, first as a mentor and then across three university courses.',
  roles: [
    { title: 'Teaching Assistant, Cyber Security Fundamentals', org: 'ADA University', when: 'Sep 2026 – Present', text: 'Support students with technical questions, assignments and hands-on activities.' },
    { title: 'Teaching Assistant, Principles of Programming II', org: 'ADA University', when: 'Feb – May 2026', text: 'Supported labs and assignments in Java and object-oriented programming.' },
    { title: 'Teaching Assistant, Web & Mobile I', org: 'ADA University', when: 'Sep 2025 – Jan 2026', text: 'Supported coding, projects and debugging across frontend and backend basics.' },
    { title: 'Full-stack Development Mentor', org: 'MilliSoft', when: 'Jan – Jun 2024', text: 'Mentored students in C#, JavaScript, ASP.NET and databases through live coding and project work.' },
  ],
};

export const recognition = [
  { title: 'Lotfi A. Zadeh List of Honor, 100% tuition scholarship', org: 'ADA University, for outstanding academic performance', when: 'Fall 2025, Spring 2026' },
  { title: 'Dean’s List of Distinction, 50% tuition scholarship', org: 'ADA University, for high academic performance', when: 'Spring 2024, Fall 2024' },
  { title: 'Rector’s List of Honor, 100% first-year tuition scholarship', org: 'ADA University, for an entrance exam score of 663.2 / 700', when: '2022' },
  { title: 'Top 10 participants, KOICA Startup Acceleration Program', org: 'KOICA', when: 'Feb 2024' },
  { title: 'IELTS Academic 7.5 overall (CEFR C1)', org: 'English proficiency', when: '2026' },
];

export const community = [
  { title: 'Event Manager, ADA ACM Student Chapter', when: 'Jan 2026 – Present', text: 'Organize technical and student-focused events at ADA University.' },
  { title: 'Organizing team, DevFest Baku 2026', when: 'Oct 2026', text: 'Annual GDG Baku developer conference, held at ADA University, with the ADA ACM Student Chapter.' },
  { title: 'Organizing team, TechFront Summit 2026', when: 'May 2026', text: 'Student technology summit at ADA University, with the ADA ACM Student Chapter.' },
  { title: '“Hand in Hand for Children”', when: 'Dec 2025', text: 'Initiated a team project promoting digital literacy and online safety among children in an orphanage.' },
  { title: 'Startup programmes', when: '2024', text: 'Took ToorLin Tournaments through the VIVEKA Company Creation Program and SABAH.HUB incubation, after the KOICA accelerator.' },
  { title: 'Hackathons', when: 'University years', text: 'Took part in several with university friends.' },
  { title: 'Volunteering', when: 'Various', text: 'COP29, Formula 1, ICPC and the English Olympiad at ADA, plus social work and exam proctoring at the university.' },
];

export const beyond = [
  { title: 'Kyokushin Karate', text: 'Six to seven years of training through school, winning titles at city and national level and joining Azerbaijan’s under-18 national team.' },
  { title: 'International study', text: 'An exchange semester at the University of Latvia in Riga added computer science coursework in a different academic system.' },
];

export const contact = {
  heading: 'Have a backend problem, a role or a research idea to discuss?',
  body: 'Email is the best way to reach me.',
};
