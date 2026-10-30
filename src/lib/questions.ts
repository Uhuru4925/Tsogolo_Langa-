export type { Subject, Difficulty, Question, CognitiveLevel } from "./question-bank";
export {
  questionBank,
  questionById,
  getQuestionsByIds,
  SCIENCE_SUBJECTS,
  HUMANITIES_SUBJECTS,
  cognitiveLevelOf,
  COGNITIVE_LEVEL_LABEL,
} from "./question-bank";
export {
  buildPaper,
  buildPaperForSubjects,
  shuffleOptions,
  paperCognitiveBreakdown,
  TOTAL_QUESTIONS,
  PHASES,
} from "./select-questions";
export {
  STUDENT_SUBJECTS,
  buildSubjectGuidance,
  getStudyGuidance,
  isStudentSubject,
  type StudentSubject,
} from "./student-subjects";

import { questionBank } from "./question-bank";
import type { IconName } from "./icon-names";

/**
 * Backwards-compatible alias. Individual students no longer sit this whole bank —
 * each session receives its own randomly generated subset (see buildPaper).
 */
export const quizQuestions = questionBank;

export interface CareerPath {
  title: string;
  description: string;
  icon: IconName;
  university?: string;
  subjects: string[];
}

export const scienceCareers: CareerPath[] = [
  {
    title: "Computer Science & IT",
    description: "Develop software, manage databases, and drive digital transformation in Malawi.",
    icon: "computer",
    university: "MUST / UNIMA / MZUNI",
    subjects: ["Mathematics", "Computer Studies", "Physics"],
  },
  {
    title: "Computer Engineering",
    description: "Design and build computer hardware, embedded systems, and networks.",
    icon: "computer",
    university: "MUST / MUBAS",
    subjects: ["Physics", "Mathematics", "Computer Studies"],
  },
  {
    title: "Cybersecurity Analyst",
    description: "Protect digital infrastructure, banks, and government systems from cyber threats.",
    icon: "target",
    university: "MUST / MZUNI",
    subjects: ["Mathematics", "Computer Studies", "Additional Mathematics"],
  },
  {
    title: "Medical Doctor",
    description: "Diagnose and treat illnesses. Study at Kamuzu University of Health Sciences (KUHeS).",
    icon: "biology",
    university: "KUHeS (formerly College of Medicine)",
    subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
  },
  {
    title: "Nurse / Clinical Officer",
    description: "Provide essential healthcare services to communities in hospitals across Malawi.",
    icon: "biology",
    university: "KUHeS / MZUNI / Daeyang",
    subjects: ["Biology", "Chemistry", "Mathematics"],
  },
  {
    title: "Agricultural Scientist / Agronomist",
    description: "Improve crop yields, soil health, and food security — vital for Malawi's economy.",
    icon: "chart",
    university: "LUANAR",
    subjects: ["Biology", "Chemistry", "Agriculture", "Mathematics"],
  },
  {
    title: "Civil / Structural Engineer",
    description: "Design roads, bridges, dams, and infrastructure for Malawi's development.",
    icon: "construction",
    university: "MUBAS (formerly The Polytechnic)",
    subjects: ["Physics", "Mathematics", "Additional Mathematics", "Technical Drawing"],
  },
  {
    title: "Electrical / Electronics Engineer",
    description: "Work on power generation (ESCOM, EGENCO), telecommunications, and electronics.",
    icon: "science",
    university: "MUBAS / MUST",
    subjects: ["Physics", "Mathematics", "Additional Mathematics"],
  },
  {
    title: "Mechanical Engineer / Metalworker",
    description: "Design and maintain machinery, engines, and manufacturing systems.",
    icon: "construction",
    university: "MUBAS / MUST",
    subjects: ["Physics", "Mathematics", "Technical Drawing", "Metal Work"],
  },
  {
    title: "Pharmacist",
    description: "Prepare, test, and dispense medicines to improve healthcare in Malawi.",
    icon: "biology",
    university: "KUHeS",
    subjects: ["Chemistry", "Biology", "Mathematics"],
  },
  {
    title: "Biomedical Scientist / Lab Technologist",
    description: "Analyse blood and tissue samples to diagnose diseases like Malaria and HIV.",
    icon: "biology",
    university: "KUHeS / MUST",
    subjects: ["Biology", "Chemistry", "Mathematics"],
  },
  {
    title: "Veterinary Officer",
    description: "Care for animals and support Malawi's livestock farming and dairy sector.",
    icon: "biology",
    university: "LUANAR",
    subjects: ["Biology", "Chemistry", "Agriculture"],
  },
  {
    title: "Environmental Scientist / Ecologist",
    description: "Protect Lake Malawi, forests, and manage waste and natural resources.",
    icon: "chart",
    university: "UNIMA / LUANAR",
    subjects: ["Biology", "Geography", "Chemistry"],
  },
  {
    title: "Geologist / Mining Engineer",
    description: "Explore and extract minerals, working in Malawi's growing mining industry.",
    icon: "science",
    university: "MUST / MUBAS",
    subjects: ["Physics", "Chemistry", "Mathematics", "Geography"],
  },
  {
    title: "Meteorologist / Climate Scientist",
    description: "Predict weather patterns and study climate change impacts in Malawi.",
    icon: "alarm",
    university: "MUST",
    subjects: ["Physics", "Mathematics", "Geography"],
  },
  {
    title: "Food Scientist / Technologist",
    description: "Develop, process, and ensure the safety of food products.",
    icon: "food",
    university: "LUANAR / MUST",
    subjects: ["Chemistry", "Biology", "Mathematics", "Home Economics"],
  },
  {
    title: "Water Resources / Irrigation Engineer",
    description: "Manage water supply, irrigation systems, and sanitation across Malawi.",
    icon: "chart",
    university: "LUANAR / MUBAS",
    subjects: ["Physics", "Mathematics", "Geography"],
  },
  {
    title: "Dentist / Dental Surgeon",
    description: "Diagnose and treat oral health issues.",
    icon: "person",
    university: "KUHeS",
    subjects: ["Biology", "Chemistry", "Physics"],
  },
  {
    title: "Physiotherapist",
    description: "Help patients recover physical movement after injuries or illness.",
    icon: "person",
    university: "KUHeS",
    subjects: ["Biology", "Physics", "Mathematics"],
  },
  {
    title: "Public Health Officer / Epidemiologist",
    description: "Track diseases and implement health programs to protect communities.",
    icon: "biology",
    university: "KUHeS / MZUNI",
    subjects: ["Biology", "Chemistry", "Mathematics"],
  },
  {
    title: "Nutritionist / Dietician",
    description: "Advise on healthy diets to prevent malnutrition and promote public health.",
    icon: "food",
    university: "LUANAR",
    subjects: ["Biology", "Chemistry", "Agriculture", "Home Economics"],
  },
  {
    title: "Forestry / Wildlife Officer",
    description: "Manage Malawi's national parks, wildlife reserves, and forest plantations.",
    icon: "chart",
    university: "LUANAR (Bunda Campus)",
    subjects: ["Biology", "Agriculture", "Geography"],
  },
  {
    title: "Data Scientist / Statistician",
    description: "Analyse complex data to help businesses, banks, and government make decisions.",
    icon: "leaderboard",
    university: "UNIMA / MZUNI",
    subjects: ["Mathematics", "Additional Mathematics", "Computer Studies"],
  },
  {
    title: "Chemist / Industrial Chemist",
    description: "Work in manufacturing, quality control, or research laboratories.",
    icon: "biology",
    university: "UNIMA / MUBAS",
    subjects: ["Chemistry", "Mathematics", "Physics"],
  }
];

export const humanitiesCareers: CareerPath[] = [
  {
    title: "Lawyer / Legal Officer",
    description: "Uphold justice and the rule of law in Malawi's legal system.",
    icon: "balance",
    university: "UNIMA – Faculty of Law",
    subjects: ["English", "History", "Social Studies"],
  },
  {
    title: "Journalist / Media Presenter",
    description: "Report news and inform communities on TV, radio, and print media.",
    icon: "communication",
    university: "MUBAS / UNIMA",
    subjects: ["English", "Chichewa", "Social Studies"],
  },
  {
    title: "Teacher / Educator",
    description: "Shape the next generation of Malawian learners in schools nationwide.",
    icon: "books",
    university: "Domasi College of Education / UNIMA",
    subjects: ["English", "History", "Geography", "Bible Knowledge"],
  },
  {
    title: "Accountant / Banker",
    description: "Manage finances for businesses, government, and NGOs in Malawi.",
    icon: "leaderboard",
    university: "MUBAS / UNIMA",
    subjects: ["Mathematics", "Commerce", "Economics"],
  },
  {
    title: "Social Worker",
    description: "Support vulnerable communities, orphans, and families across Malawi.",
    icon: "person",
    university: "UNIMA – Social Sciences / Magomero",
    subjects: ["Social Studies", "History", "English"],
  },
  {
    title: "Theologian / Religious Leader",
    description: "Guide congregations, teach morality, and lead community outreach.",
    icon: "books",
    university: "Livingstonia / UNIMA",
    subjects: ["Bible Knowledge", "History", "English"],
  },
  {
    title: "Hospitality / Tourism Manager",
    description: "Manage resorts, hotels, and tourism at Lake Malawi and national parks.",
    icon: "food",
    university: "MZUNI / MUBAS",
    subjects: ["Home Economics", "Geography", "English"],
  },
  {
    title: "Diplomat / Civil Servant",
    description: "Represent Malawi in government ministries and international affairs.",
    icon: "account",
    university: "UNIMA – Political Science",
    subjects: ["History", "English", "Geography"],
  },
  {
    title: "Development Officer / NGO Worker",
    description: "Work with organisations like UNICEF, WHO, and local NGOs to develop Malawi.",
    icon: "link",
    university: "UNIMA / MZUNI",
    subjects: ["Social Studies", "Geography", "English"],
  },
  {
    title: "Businessman / Entrepreneur",
    description: "Start and run a business, contributing to Malawi's economic growth.",
    icon: "leaderboard",
    university: "MUBAS – Business Administration",
    subjects: ["Mathematics", "Commerce", "English"],
  }
];

export const mixedCareers: CareerPath[] = [
  {
    title: "Public Health Officer",
    description: "Combine science and social knowledge to improve community health in Malawi.",
    icon: "biology",
    university: "UNIMA / KUHeS",
    subjects: ["Biology", "Social Studies", "Mathematics"],
  },
  {
    title: "Economist",
    description: "Analyse Malawi's economy and advise on financial and development policies.",
    icon: "chart",
    university: "UNIMA – Economics",
    subjects: ["Mathematics", "Geography", "Social Studies"],
  },
  {
    title: "Architect",
    description: "Design buildings and spaces that reflect Malawian culture and modern needs.",
    icon: "construction",
    university: "MUBAS – Architecture",
    subjects: ["Mathematics", "Technical Drawing", "Physics", "Art"],
  },
  {
    title: "Psychologist / Counsellor",
    description: "Support mental health and wellbeing in schools, hospitals, and communities.",
    icon: "personEdit",
    university: "UNIMA",
    subjects: ["Biology", "Social Studies", "English"],
  },
  {
    title: "Fashion & Textile Designer",
    description: "Design clothing and textiles, merging creativity with technical skills.",
    icon: "personEdit",
    university: "MZUNI / Technical Colleges",
    subjects: ["Home Economics", "Art", "Mathematics"],
  }
];

export function getGrade(percentage: number): { grade: string; label: string; color: string } {
  if (percentage >= 85) return { grade: "A", label: "Distinction", color: "text-emerald-600" };
  if (percentage >= 70) return { grade: "B", label: "Merit", color: "text-blue-600" };
  if (percentage >= 55) return { grade: "C", label: "Credit", color: "text-indigo-600" };
  if (percentage >= 40) return { grade: "D", label: "Pass", color: "text-amber-600" };
  return { grade: "F", label: "Needs Improvement", color: "text-red-600" };
}

export function getCategory(scienceScore: number, humanitiesScore: number): string {
  const sciPct = scienceScore;
  const humPct = humanitiesScore;
  const diff = Math.abs(sciPct - humPct);
  if (diff < 15) return "Mixed";
  return sciPct > humPct ? "Sciences" : "Humanities";
}
