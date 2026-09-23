import type { BackgroundEntry, Certification, LeadershipEntry, WorkEntry } from '../types/content';

export const backgroundSection = {
  eyebrow: 'Background',
  heading: 'How I got here',
} as const;

/** The previous site's timeline. */
export const background: readonly BackgroundEntry[] = [
  {
    title: 'BSc Computer Science — University of London',
    detail: 'Full-time. Data structures, algorithms, discrete maths, web development.',
  },
  {
    title: 'CS50x and Coursera coursework',
    detail: 'Finished CS50x, plus Coursera courses in cloud computing, calculus, and algorithms.',
  },
  { title: 'Intern — Pam Golding Properties', detail: 'Listings, photography, and documentation.' },
  {
    title: 'Co-leader — school programming team',
    detail: 'Ran practice sessions and helped the group debug competition problems.',
  },
  {
    title: 'Hospitality and summer crew work',
    detail: "Waiting tables and summer crew. Learned to stay calm when it's busy.",
  },
];

/** From the CV. */
export const education = {
  institution: 'University of London',
  degree: 'Bachelor of Science, Computer Science',
  mode: 'Full-time Distance Learning - Currently Enrolled',
  note: 'Expected to complete degree through the University of London’s global learning program.',
} as const;

/** From the CV's Work Experience section. */
export const workHistory: readonly WorkEntry[] = [
  {
    title: 'Part-time Intern - Pam Golding Properties',
    period: '2024',
    points: [
      'Assisted with photographing homes, preparing listings, and completing documentation for new properties.',
      'Helped with inventory checking, property value estimation, and preparing houses for arrivals.',
      'Worked with agents to troubleshoot issues and streamline day-to-day operations.',
    ],
  },
  {
    title: 'Summer Crew Member',
    period: '2021 & 2023',
    points: [
      'Maintained guest areas during peak holiday periods, including room prep, general cleaning, and pool-side upkeep.',
      'Took initiative by leading a small team, ensuring all guest areas were ready on time and met required standards.',
    ],
  },
  {
    title: 'Part-time Waiter',
    period: '2022',
    points: [
      'Worked in a high-pressure restaurant environment, serving customers, resetting tables, and ensuring excellent guest experiences.',
      'Improved communication skills, teamwork, and emotional resilience while navigating busy rush periods and diverse personalities.',
    ],
  },
];

/** From the CV's Leadership & Involvement section. */
export const leadership: readonly LeadershipEntry[] = [
  {
    title: 'Programming Team Co-Leader',
    detail: 'Mentored peers, coordinated projects, and supported problem-solving in coding challenges.',
  },
  {
    title: 'South African Mathematics Olympiad (SAMO) - Participant (Grade 9–11)',
    detail:
      'Competed annually in one of South Africa’s top mathematics challenges, strengthening analytical thinking, logical reasoning, and problem-solving under pressure.',
  },
  {
    title: 'Debating Society',
    detail: 'Active from Grade 8–12; developed strong public-speaking and argumentation skills.',
  },
  {
    title: 'Chess Team',
    detail: 'Represented school in competitions, enhanced strategic and long-term planning abilities.',
  },
];

/** From the CV's Certifications section. */
export const certifications: readonly Certification[] = [
  {
    title: 'CS50: Introduction to Computer Science',
    issuer: 'Harvard University (edX)',
    note: 'Recognized worldwide as a rigorous foundational programming and problem-solving course covering C, Python, algorithms, data structures, memory, and software engineering principles.',
  },
  { title: 'Introduction to Cloud Computing', issuer: 'Coursera' },
  { title: 'Introduction to Calculus / Calculus Fundamentals', issuer: 'Coursera' },
];

/** From the CV's Skills and Interests section. */
export const interests: readonly string[] = [
  'Mathematics and analytical problem-solving',
  'Programming and software development',
  'Physics and scientific reasoning',
  'Continuous learning and exploring new technologies',
  'PC building and hardware optimization',
  'Local AI/LLM experimentation',
];
