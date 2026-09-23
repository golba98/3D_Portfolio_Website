import type { Profile } from '../types/content';

export const profile: Profile = {
  name: 'Jordan Vorster',
  legalName: 'Jordan L Vorster',
  role: 'Computer Science student',
  location: 'Eastern Cape, South Africa',
  education: 'BSc Computer Science, University of London',
  email: 'jordanvorster404@gmail.com',
  github: 'https://github.com/golba98',
  githubUsername: 'golba98',
  resumeUrl: '/Resume.pdf',
  headline: ['I build editors, dev tools,', 'and language models.'],
  lede: 'BSc Computer Science student, University of London. Everything below is a repo you can clone and run.',
  cvSummary:
    'I am a Computer Science student with a solid technical background in Python, JavaScript, PHP, and Delphi. Experienced with full-stack concepts, algorithmic thinking, and efficient program design through academic coursework, CS50, and self-driven projects. I am skilled at building practical solutions-from POS systems to 3D games and utility tools. Seeking an internship opportunity to apply technical skills, gain industry experience, and collaborate on impactful software projects.',
  toolkitLede: 'Everything here is in a repo I can point at. I run Fedora.',
};

/** Caption for the map in Contact. The marker is Natural Earth's label point for the province. */
export const place = {
  heading: 'Where I stay',
  caption: 'Eastern Cape, South Africa',
  note: 'Outline from Natural Earth 1:50m, public domain.',
} as const;
