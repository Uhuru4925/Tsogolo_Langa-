import type { Question } from "@/lib/question-bank";

export const STUDENT_SUBJECTS = [
  "English",
  "French",
  "Mathematics",
  "Additional Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "Physical Science",
  "Geography",
  "History",
  "Social and Development Studies",
  "Life Skills",
  "Bible Knowledge",
  "Religious and Moral Education",
  "Agriculture",
  "Computer Studies",
  "Home Economics",
  "Business Studies",
] as const;

export type StudentSubject = (typeof STUDENT_SUBJECTS)[number];

export const QUESTION_SUBJECTS_BY_STUDENT_SUBJECT: Record<
  StudentSubject,
  Question["subject"][]
> = {
  English: ["Language"],
  French: ["Language"],
  Mathematics: ["Math"],
  "Additional Mathematics": ["Math"],
  Biology: ["Science"],
  Chemistry: ["Science"],
  Physics: ["Science"],
  "Physical Science": ["Science"],
  Geography: ["Humanities"],
  History: ["Humanities"],
  "Social and Development Studies": ["Humanities"],
  "Life Skills": ["Humanities"],
  "Bible Knowledge": ["Bible Knowledge"],
  "Religious and Moral Education": ["Bible Knowledge", "Humanities"],
  Agriculture: ["Science"],
  "Computer Studies": ["Computer Studies"],
  "Home Economics": ["Home Economics"],
  "Business Studies": ["Humanities"],
};

export function isStudentSubject(value: unknown): value is StudentSubject {
  return typeof value === "string" && STUDENT_SUBJECTS.includes(value as StudentSubject);
}

export function getStudyGuidance(levelOfStudy: string | null, score: number): string[] {
  const guidance: string[] = [];

  if (levelOfStudy === "Form 1" || levelOfStudy === "Form 2") {
    guidance.push(
      "Build strong foundations: review class notes weekly, practise core skills, and ask your teacher to explain topics you find difficult.",
      "Explore several subject and career areas before narrowing your choices. Your current quiz is a starting point, not a fixed career decision.",
    );
  } else if (levelOfStudy === "Form 3") {
    guidance.push(
      "Connect your strongest subjects to possible careers, then check entry requirements with teachers and current university or college prospectuses.",
      "Start a regular revision routine now: rotate subjects, practise structured questions, and keep an error log of topics to revisit.",
    );
  } else if (levelOfStudy === "Form 4") {
    guidance.push(
      "Prioritise timed practice from your syllabus and past papers. Review every mistake and ask a teacher to clarify recurring gaps.",
      "Compare your subject combination and grades with current programme entry requirements; confirm details with a school counsellor or institution.",
    );
  } else {
    guidance.push(
      "Use your subject scores to identify what to practise next, and discuss your interests and possible subject combinations with a teacher or school counsellor.",
      "Explore careers broadly and verify course requirements from current Malawi university or college sources before making decisions.",
    );
  }

  if (score < 40) {
    guidance.push(
      "Choose one or two topics to strengthen first, study in short regular sessions, and ask for help early. This practice score does not define your ability.",
    );
  } else if (score >= 70) {
    guidance.push(
      "Keep challenging yourself with application and analysis questions, while maintaining steady practice in every subject you take.",
    );
  }

  return guidance;
}

export function buildSubjectGuidance(
  levelOfStudy: string | null,
  score: number,
  weakestSubjects: string[],
): string[] {
  const guidance = getStudyGuidance(levelOfStudy, score);
  if (weakestSubjects.length > 0) {
    guidance.unshift(
      `Focus your next revision sessions on ${weakestSubjects.join(" and ")}. Practise a few questions, check the worked explanations, then retry similar problems.`,
    );
  }
  return guidance;
}
