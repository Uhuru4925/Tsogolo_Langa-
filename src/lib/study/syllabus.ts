import type { Subject } from "@/lib/question-bank";
import type { IconName } from "@/lib/icon-names";

export interface SyllabusTopic {
  name: string;
  /** How heavily this topic tends to appear in MSCE papers. */
  weight: "core" | "high" | "medium";
  hint: string;
}

export interface SubjectSyllabus {
  subject: string;
  icon: IconName;
  stream: "Sciences" | "Humanities" | "Both";
  /** Which quiz category this MSCE subject is judged by. */
  quizSubject: Subject;
  papers: string;
  why: string;
  topics: SyllabusTopic[];
  examTips: string[];
}

export const SYLLABUS: SubjectSyllabus[] = [
  {
    subject: "Mathematics",
    icon: "study",
    stream: "Both",
    quizSubject: "Math",
    papers: "Paper 1 (short answers) + Paper 2 (structured)",
    why: "Required for engineering, medicine, ICT, business and most university programmes.",
    topics: [
      { name: "Numbers, fractions and percentages", weight: "core", hint: "Practise without a calculator - Paper 1 rewards speed." },
      { name: "Algebra: expressions and equations", weight: "core", hint: "Master changing the subject of a formula." },
      { name: "Quadratic equations and graphs", weight: "core", hint: "Learn factorisation, completing the square and the formula." },
      { name: "Geometry: angles, triangles, circles", weight: "high", hint: "Memorise circle theorems and angle properties." },
      { name: "Trigonometry (sine, cosine, tangent)", weight: "high", hint: "Know the special angles 30, 45 and 60 degrees by heart." },
      { name: "Mensuration: area, volume, surface area", weight: "high", hint: "Write the formula first, then substitute." },
      { name: "Statistics: mean, median, mode, graphs", weight: "high", hint: "Practise drawing and reading histograms and pie charts." },
      { name: "Probability", weight: "medium", hint: "Use tree diagrams for two-stage events." },
      { name: "Matrices and transformations", weight: "medium", hint: "Practise translation, reflection, rotation and enlargement." },
      { name: "Financial mathematics (interest, profit, loss)", weight: "high", hint: "Use Malawi Kwacha examples so the numbers feel real." },
      { name: "Sets and Venn diagrams", weight: "medium", hint: "Always draw the diagram before answering." },
      { name: "Variation and ratio", weight: "medium", hint: "Identify direct, inverse and joint variation quickly." }
    ],
    examTips: [
      "Show every working step - method marks are awarded even when the final answer is wrong.",
      "Attempt all questions; never leave a blank space.",
      "Check units and round only at the final step."
    ]
  },
  {
    subject: "Biology",
    icon: "biology",
    stream: "Sciences",
    quizSubject: "Science",
    papers: "Paper 1 (objective) + Paper 2 (structured & essay)",
    why: "Compulsory for medicine, nursing, pharmacy, agriculture and laboratory sciences.",
    topics: [
      { name: "Cell structure and function", weight: "core", hint: "Draw and label plant and animal cells from memory." },
      { name: "Classification of living organisms", weight: "medium", hint: "Learn the five kingdoms and their characteristics." },
      { name: "Nutrition in plants (photosynthesis)", weight: "core", hint: "Know the word and balanced chemical equations." },
      { name: "Nutrition in animals and digestion", weight: "core", hint: "Learn enzymes, their substrates and products." },
      { name: "Transport systems (blood, xylem, phloem)", weight: "core", hint: "Draw the heart and label all four chambers." },
      { name: "Respiration and gaseous exchange", weight: "high", hint: "Compare aerobic and anaerobic respiration in a table." },
      { name: "Excretion and homeostasis", weight: "high", hint: "Understand how the kidney and skin regulate the body." },
      { name: "Coordination: nervous and endocrine systems", weight: "high", hint: "Learn the reflex arc pathway in order." },
      { name: "Reproduction and growth", weight: "core", hint: "Human reproduction essays appear very often." },
      { name: "Genetics and variation", weight: "high", hint: "Practise Punnett squares and monohybrid crosses." },
      { name: "Ecology and ecosystems", weight: "high", hint: "Use Lake Malawi and local examples in essays." },
      { name: "Health, disease and first aid", weight: "core", hint: "Malaria, HIV/AIDS, cholera and TB are common questions." }
    ],
    examTips: [
      "Biology essays reward listing five clear points with a short explanation each.",
      "Use large, clean pencil diagrams with straight label lines.",
      "Learn definitions word-perfect; examiners mark key terms."
    ]
  },
  {
    subject: "Chemistry",
    icon: "biology",
    stream: "Sciences",
    quizSubject: "Science",
    papers: "Paper 1 (objective) + Paper 2 (structured)",
    why: "Needed for medicine, pharmacy, engineering, agriculture and industrial chemistry.",
    topics: [
      { name: "Matter, states and separation techniques", weight: "core", hint: "Know filtration, distillation and chromatography." },
      { name: "Atomic structure and the periodic table", weight: "core", hint: "Learn electron arrangement for the first 20 elements." },
      { name: "Chemical bonding", weight: "core", hint: "Compare ionic, covalent and metallic bonding." },
      { name: "Chemical equations and stoichiometry", weight: "core", hint: "Balance equations daily - it is a guaranteed mark." },
      { name: "Acids, bases and salts", weight: "core", hint: "Memorise the pH scale and neutralisation reactions." },
      { name: "Rates of reaction", weight: "high", hint: "Know the four factors and explain each with particle theory." },
      { name: "Oxidation and reduction (redox)", weight: "high", hint: "Use OIL RIG to remember loss and gain of electrons." },
      { name: "Electrolysis", weight: "high", hint: "Learn what happens at the anode and cathode." },
      { name: "Metals, extraction and corrosion", weight: "medium", hint: "The reactivity series must be memorised in order." },
      { name: "Organic chemistry: hydrocarbons", weight: "high", hint: "Learn alkanes, alkenes and their general formulae." },
      { name: "Water, air and environmental chemistry", weight: "medium", hint: "Link to pollution issues in Malawi." },
      { name: "Practical chemistry and qualitative analysis", weight: "high", hint: "Learn the colour of common precipitates." }
    ],
    examTips: [
      "Always balance equations and include state symbols.",
      "Give observations, not conclusions, when a question says 'state what you see'.",
      "Learn the standard test for each gas and ion."
    ]
  },
  {
    subject: "Physics",
    icon: "science",
    stream: "Sciences",
    quizSubject: "Science",
    papers: "Paper 1 (objective) + Paper 2 (structured)",
    why: "Essential for all engineering fields, ICT, architecture and physical sciences.",
    topics: [
      { name: "Measurement and SI units", weight: "core", hint: "Know prefixes and how to read a vernier calliper." },
      { name: "Motion, speed, velocity and acceleration", weight: "core", hint: "Master the equations of motion and graph interpretation." },
      { name: "Forces, Newton's laws and momentum", weight: "core", hint: "Draw free-body diagrams before calculating." },
      { name: "Work, energy and power", weight: "core", hint: "Remember energy is always conserved." },
      { name: "Pressure in solids, liquids and gases", weight: "high", hint: "Practise P = F/A and hydraulic press questions." },
      { name: "Heat, temperature and thermal expansion", weight: "high", hint: "Distinguish heat capacity from latent heat." },
      { name: "Waves, sound and light", weight: "core", hint: "Draw accurate ray diagrams with arrows." },
      { name: "Reflection, refraction and lenses", weight: "high", hint: "Learn the lens formula and ray construction rules." },
      { name: "Electricity: current, voltage, resistance", weight: "core", hint: "Ohm's law and series/parallel circuits are guaranteed." },
      { name: "Magnetism and electromagnetism", weight: "high", hint: "Use the right-hand grip and Fleming's rules." },
      { name: "Electronics basics", weight: "medium", hint: "Know diodes, transistors and logic gates." },
      { name: "Radioactivity and atomic physics", weight: "medium", hint: "Learn alpha, beta and gamma properties in a table." }
    ],
    examTips: [
      "Write the formula, substitute, then calculate - three separate marks.",
      "Always include the correct SI unit in your final answer.",
      "Use a sharp pencil and ruler for every graph and ray diagram."
    ]
  },
  {
    subject: "English",
    icon: "communication",
    stream: "Both",
    quizSubject: "Language",
    papers: "Paper 1 (composition) + Paper 2 (comprehension) + Paper 3 (literature)",
    why: "Compulsory. You cannot be awarded an MSCE certificate without passing English.",
    topics: [
      { name: "Composition and essay writing", weight: "core", hint: "Plan for 5 minutes: introduction, three body points, conclusion." },
      { name: "Letter and report writing", weight: "core", hint: "Learn formal and informal letter layouts exactly." },
      { name: "Comprehension and summary", weight: "core", hint: "Answer in your own words and respect the word limit." },
      { name: "Grammar: tenses and concord", weight: "core", hint: "Subject-verb agreement is the most common error." },
      { name: "Direct and indirect speech", weight: "high", hint: "Practise changing tense, pronouns and time words." },
      { name: "Active and passive voice", weight: "high", hint: "Identify the object first, then move it to the front." },
      { name: "Vocabulary, synonyms and antonyms", weight: "high", hint: "Keep a notebook of ten new words each week." },
      { name: "Idioms and figures of speech", weight: "high", hint: "Learn simile, metaphor, personification and irony." },
      { name: "Punctuation and spelling", weight: "medium", hint: "Careless punctuation loses easy marks." },
      { name: "Literature: set books and poetry", weight: "core", hint: "Know plot, characters, themes and at least three quotations." },
      { name: "Oral and listening skills", weight: "medium", hint: "Read aloud daily to build fluency and confidence." }
    ],
    examTips: [
      "Write legibly - an examiner who cannot read your work cannot award marks.",
      "In literature, always support your point with evidence from the text.",
      "Leave five minutes to proofread for tense and spelling slips."
    ]
  },
  {
    subject: "Chichewa",
    icon: "communication",
    stream: "Humanities",
    quizSubject: "Language",
    papers: "Pepala 1, 2 ndi 3",
    why: "A reliable credit for most students and valued in teaching, media and public service.",
    topics: [
      { name: "Kalembedwe ka nkhani (composition)", weight: "core", hint: "Konzani mfundo zitatu zazikulu musanayambe kulemba." },
      { name: "Kumvetsetsa nkhani (comprehension)", weight: "core", hint: "Werengani funso kawiri musanayankhe." },
      { name: "Galamala (grammar)", weight: "core", hint: "Phunzirani magulu a mawu ndi kagwiritsidwe kake." },
      { name: "Miyambi ndi mwambi", weight: "high", hint: "Loweza miyambi 30 ndi matanthauzo ake." },
      { name: "Zofanizira ndi zophiphiritsa", weight: "high", hint: "Zimapezeka kwambiri pa mayeso a ndakatulo." },
      { name: "Ndakatulo (poetry)", weight: "high", hint: "Fotokozani mutu, maganizo ndi kalembedwe." },
      { name: "Nthano ndi nkhani zazifupi", weight: "medium", hint: "Dziwani anthu, malo ndi phunziro la nkhani." },
      { name: "Kulemba makalata", weight: "high", hint: "Dziwani kalata yaulemu ndi ya pachibale." },
      { name: "Chikhalidwe cha Amalawi", weight: "medium", hint: "Gwiritsani zitsanzo za m'dziko lathu." }
    ],
    examTips: [
      "Lembani mwaukhondo ndi zilembo zomveka.",
      "Gwiritsani ntchito miyambi kuti mupeze mfundo zowonjezera.",
      "Yankhani mafunso onse - musasiye malo opanda kanthu."
    ]
  },
  {
    subject: "Geography",
    icon: "chart",
    stream: "Humanities",
    quizSubject: "Humanities",
    papers: "Paper 1 (physical) + Paper 2 (human & practical)",
    why: "Opens land surveying, planning, environmental science, tourism and teaching.",
    topics: [
      { name: "Map reading and interpretation", weight: "core", hint: "Practise grid references, scale and bearings weekly." },
      { name: "The earth, rocks and landforms", weight: "core", hint: "Know the three rock types with Malawian examples." },
      { name: "Weather, climate and climate change", weight: "core", hint: "Learn to read and draw climate graphs." },
      { name: "Rivers, lakes and drainage", weight: "high", hint: "The Shire River system is a favourite exam topic." },
      { name: "The Rift Valley and plate tectonics", weight: "high", hint: "Malawi sits in the East African Rift - use local detail." },
      { name: "Soils, vegetation and conservation", weight: "high", hint: "Link soil erosion to farming practice in Malawi." },
      { name: "Population and settlement", weight: "core", hint: "Learn push and pull factors for migration." },
      { name: "Agriculture and land use", weight: "high", hint: "Compare subsistence and estate farming." },
      { name: "Industry, mining and energy", weight: "medium", hint: "Know Malawi's main minerals and power sources." },
      { name: "Transport, trade and tourism", weight: "medium", hint: "Use Lake Malawi tourism as a case study." }
    ],
    examTips: [
      "Always name a real place as your example - generic answers score less.",
      "Draw sketch maps with a frame, title, key and north arrow.",
      "Take a ruler and protractor into the practical paper."
    ]
  },
  {
    subject: "History",
    icon: "books",
    stream: "Humanities",
    quizSubject: "Humanities",
    papers: "Paper 1 + Paper 2 (essay based)",
    why: "Strong foundation for law, journalism, politics, teaching and heritage work.",
    topics: [
      { name: "Early societies and migrations in Malawi", weight: "high", hint: "Know the Maravi, Ngoni and Yao movements." },
      { name: "The slave trade in Central Africa", weight: "core", hint: "Learn causes, routes, effects and abolition." },
      { name: "Missionaries and David Livingstone", weight: "core", hint: "Link mission stations to later education growth." },
      { name: "Colonial rule and the Nyasaland Protectorate", weight: "core", hint: "Understand thangata and its resentment." },
      { name: "The Chilembwe uprising of 1915", weight: "core", hint: "Causes, events and significance - a frequent essay." },
      { name: "The Central African Federation", weight: "high", hint: "Know why Malawians opposed it so strongly." },
      { name: "The struggle for independence", weight: "core", hint: "Nyasaland African Congress, 1959 emergency, 1964." },
      { name: "Malawi after independence", weight: "high", hint: "One-party rule through to the 1993 referendum." },
      { name: "Multiparty democracy and governance", weight: "high", hint: "Understand the 1994 elections and the Constitution." },
      { name: "African nationalism across the continent", weight: "medium", hint: "Compare Ghana, Kenya and South Africa." }
    ],
    examTips: [
      "Every essay needs an introduction, dated evidence and a conclusion.",
      "Learn key dates - they turn a vague answer into a strong one.",
      "Answer the exact command word: describe, explain, or assess."
    ]
  },
  {
    subject: "Bible Knowledge",
    icon: "library",
    stream: "Humanities",
    quizSubject: "Bible Knowledge",
    papers: "Paper 1",
    why: "A dependable credit and useful for theology, teaching and social work.",
    topics: [
      { name: "Creation and the patriarchs", weight: "high", hint: "Abraham, Isaac, Jacob and Joseph in order." },
      { name: "Moses and the Exodus", weight: "core", hint: "Plagues, Passover, Red Sea and the Ten Commandments." },
      { name: "The judges and the kings", weight: "high", hint: "Saul, David and Solomon - strengths and failures." },
      { name: "The prophets", weight: "core", hint: "Elijah, Amos and Isaiah - message and context." },
      { name: "Birth and early ministry of Jesus", weight: "core", hint: "Know both nativity accounts and the baptism." },
      { name: "The parables of Jesus", weight: "core", hint: "Sower, Good Samaritan, Prodigal Son and their meanings." },
      { name: "Miracles of Jesus", weight: "high", hint: "Group them: healing, nature, feeding, raising the dead." },
      { name: "The Sermon on the Mount", weight: "core", hint: "Memorise the Beatitudes." },
      { name: "Death and resurrection of Jesus", weight: "core", hint: "Follow the events of Holy Week in order." },
      { name: "The early church and Paul", weight: "high", hint: "Pentecost, conversion of Saul, missionary journeys." }
    ],
    examTips: [
      "Quote or reference the passage - specific references earn marks.",
      "Give the teaching AND its application to life today.",
      "Learn the order of events so narrative questions flow."
    ]
  },
  {
    subject: "Computer Studies",
    icon: "computer",
    stream: "Sciences",
    quizSubject: "Computer Studies",
    papers: "Paper 1 (theory) + Paper 2 (practical)",
    why: "Direct route into computer science, IT, networking and cybersecurity.",
    topics: [
      { name: "Computer hardware and components", weight: "core", hint: "Know input, output, storage and processing devices." },
      { name: "Software: system and application", weight: "core", hint: "Distinguish operating systems from applications." },
      { name: "Number systems: binary, decimal, hex", weight: "high", hint: "Practise conversions until they are automatic." },
      { name: "Word processing and spreadsheets", weight: "core", hint: "Practise formulae, charts and formatting hands-on." },
      { name: "Databases", weight: "high", hint: "Understand tables, fields, records and queries." },
      { name: "Networks and the internet", weight: "core", hint: "LAN, WAN, routers, IP addresses and topologies." },
      { name: "Cybersecurity and data protection", weight: "high", hint: "Viruses, phishing, firewalls and strong passwords." },
      { name: "Programming and algorithms", weight: "high", hint: "Practise flowcharts and simple pseudocode." },
      { name: "Web design basics (HTML)", weight: "medium", hint: "Learn the core tags and page structure." },
      { name: "ICT in society and ethics", weight: "medium", hint: "Discuss ICT's impact on Malawi's economy." }
    ],
    examTips: [
      "Get real keyboard time - the practical paper rewards fluency.",
      "Define technical terms precisely; vague wording loses marks.",
      "Draw flowcharts with the correct standard symbols."
    ]
  },
  {
    subject: "Agriculture",
    icon: "chart",
    stream: "Sciences",
    quizSubject: "Science",
    papers: "Paper 1 + Paper 2",
    why: "Malawi's economy is agricultural - opens LUANAR and extension careers.",
    topics: [
      { name: "Soil formation, types and fertility", weight: "core", hint: "Know how to test and improve soil pH." },
      { name: "Soil erosion and conservation", weight: "core", hint: "Contour ridging and agroforestry are key answers." },
      { name: "Crop production and husbandry", weight: "core", hint: "Maize, tobacco, groundnuts and their requirements." },
      { name: "Pests, diseases and weed control", weight: "high", hint: "Learn integrated pest management." },
      { name: "Livestock production", weight: "high", hint: "Cattle, goats and poultry - housing, feeding, disease." },
      { name: "Farm structures and tools", weight: "medium", hint: "Know correct use and maintenance." },
      { name: "Irrigation and water management", weight: "high", hint: "Compare irrigation methods and their costs." },
      { name: "Agricultural economics and marketing", weight: "high", hint: "Understand ADMARC and farmer cooperatives." },
      { name: "Agroforestry and the environment", weight: "medium", hint: "Link tree planting to soil and climate benefits." }
    ],
    examTips: [
      "Use Malawian crops and real farming practice in every example.",
      "Draw clear labelled diagrams of tools and structures.",
      "Give practical, costed solutions - examiners like realism."
    ]
  },
  {
    subject: "Home Economics",
    icon: "food",
    stream: "Humanities",
    quizSubject: "Home Economics",
    papers: "Paper 1 (theory) + Paper 2 (practical)",
    why: "Leads to nutrition, catering, hospitality, textiles and teaching.",
    topics: [
      { name: "Nutrients and a balanced diet", weight: "core", hint: "Know each nutrient, its sources and its function." },
      { name: "Deficiency diseases", weight: "core", hint: "Kwashiorkor, marasmus, anaemia, rickets and goitre." },
      { name: "Food preparation and cooking methods", weight: "core", hint: "Compare boiling, steaming, frying and roasting." },
      { name: "Food preservation and storage", weight: "high", hint: "Drying, salting, smoking and refrigeration." },
      { name: "Kitchen hygiene and food safety", weight: "core", hint: "Learn the temperature danger zone." },
      { name: "Meal planning and budgeting", weight: "high", hint: "Plan a balanced family meal on a small budget." },
      { name: "Textiles and fibres", weight: "high", hint: "Distinguish natural from synthetic fibres." },
      { name: "Sewing stitches and garment construction", weight: "high", hint: "Practise seams, hems and overcasting by hand." },
      { name: "Laundry and fabric care", weight: "medium", hint: "Learn care symbols and stain removal." },
      { name: "Home management and child care", weight: "medium", hint: "Cover budgeting, housing and infant nutrition." }
    ],
    examTips: [
      "In the practical, plan your time and work hygienically from the start.",
      "Give reasons, not just steps - 'why' carries the marks.",
      "Draw neat labelled diagrams of stitches and equipment."
    ]
  },
  {
    subject: "Technical Drawing",
    icon: "construction",
    stream: "Sciences",
    quizSubject: "Technical Arts",
    papers: "Paper 1 (plane geometry) + Paper 2 (solid geometry)",
    why: "Foundation for architecture, civil engineering, surveying and design.",
    topics: [
      { name: "Drawing instruments and line types", weight: "core", hint: "Learn each line type and where it is used." },
      { name: "Geometric constructions", weight: "core", hint: "Bisect lines and angles accurately with compasses." },
      { name: "Scales and dimensioning", weight: "core", hint: "Follow the standard dimensioning conventions." },
      { name: "Orthographic projection (first & third angle)", weight: "core", hint: "Know the symbol and layout for each." },
      { name: "Isometric and oblique drawing", weight: "core", hint: "Isometric axes sit at 30 degrees." },
      { name: "Sectional views", weight: "high", hint: "Hatch cut surfaces at 45 degrees." },
      { name: "Development of surfaces", weight: "high", hint: "Practise cylinders, cones and prisms." },
      { name: "Loci and cams", weight: "medium", hint: "Plot points carefully and join with a smooth curve." },
      { name: "Interpenetration of solids", weight: "medium", hint: "Work methodically point by point." }
    ],
    examTips: [
      "Accuracy is everything - keep pencils sharp and draw lightly first.",
      "Never rub out construction lines; examiners award marks for them.",
      "Bring a full set of instruments and check your scale twice."
    ]
  },
  {
    subject: "Business Studies",
    icon: "leaderboard",
    stream: "Humanities",
    quizSubject: "Humanities",
    papers: "Paper 1 + Paper 2",
    why: "Route into accounting, banking, management and entrepreneurship.",
    topics: [
      { name: "Business organisations and ownership", weight: "core", hint: "Sole trader, partnership, company - pros and cons." },
      { name: "Book-keeping and double entry", weight: "core", hint: "Practise ledgers and the trial balance daily." },
      { name: "Final accounts", weight: "core", hint: "Trading, profit and loss account, balance sheet." },
      { name: "Trade documents", weight: "high", hint: "Invoice, receipt, credit note and their purposes." },
      { name: "Marketing and the marketing mix", weight: "high", hint: "Product, price, place and promotion." },
      { name: "Banking and finance", weight: "high", hint: "Know Malawian bank services and sources of capital." },
      { name: "Communication in business", weight: "medium", hint: "Formal business letters and memos." },
      { name: "Entrepreneurship and business plans", weight: "high", hint: "Write a simple plan for a local business idea." },
      { name: "Consumer protection and ethics", weight: "medium", hint: "Know consumer rights in Malawi." }
    ],
    examTips: [
      "Rule your accounts neatly - presentation carries marks.",
      "Always balance your accounts and show the totals.",
      "Use Malawian business examples to make answers concrete."
    ]
  }
];

export const SYLLABUS_BY_SUBJECT = new Map(SYLLABUS.map((item) => [item.subject, item]));

export function syllabusForQuizSubject(quizSubject: Subject): SubjectSyllabus[] {
  return SYLLABUS.filter((item) => item.quizSubject === quizSubject);
}
