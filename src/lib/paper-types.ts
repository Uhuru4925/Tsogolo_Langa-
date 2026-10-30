import type { PaperType } from "@/lib/select-questions";

export const PAPER_TYPE_OPTIONS: {
  value: PaperType;
  title: string;
  subtitle: string;
  badge: string;
}[] = [
  {
    value: "balanced",
    title: "Balanced aptitude paper",
    subtitle: "Mix of sciences, humanities, languages, computer and practical subjects.",
    badge: "Best if you are still exploring",
  },
  {
    value: "sciences",
    title: "Sciences focus",
    subtitle: "More questions from Science, Mathematics, Computer Studies and Technical Arts.",
    badge: "For medicine, engineering, ICT & agriculture",
  },
  {
    value: "humanities",
    title: "Humanities focus",
    subtitle: "More questions from Humanities, Languages, Home Economics and Bible Knowledge.",
    badge: "For law, teaching, media & social studies",
  },
  {
    value: "math",
    title: "Mathematics focus",
    subtitle: "For students who want to drill numbers, formulas and problem solving.",
    badge: "Great for engineering, business & physical science",
  },
  {
    value: "computer",
    title: "Computer Studies focus",
    subtitle: "Binary, networking, spreadsheets, algorithms, cybersecurity and IT thinking.",
    badge: "For computer science, IT & cybersecurity",
  },
  {
    value: "technical",
    title: "Technical Arts focus",
    subtitle: "Technical drawing, measurements, materials and workshop-style reasoning.",
    badge: "For construction, drawing & technical careers",
  },
  {
    value: "language",
    title: "Language focus",
    subtitle: "English and language reasoning, comprehension, writing and expression.",
    badge: "For law, media, teaching & communication",
  },
  {
    value: "home-economics",
    title: "Home Economics focus",
    subtitle: "Nutrition, budgeting, hygiene, textiles and household management.",
    badge: "For nutrition, hospitality & fashion/textiles",
  },
  {
    value: "bible-knowledge",
    title: "Bible Knowledge focus",
    subtitle: "Scripture, parables, ethics and application of biblical teaching.",
    badge: "For theology, teaching & values education",
  },
];
