const { execSync } = require('child_process');
const fs = require('fs');

const slides = [
  'Slide01-Hook',
  'Slide02-Problem',
  'Slide03-Solution',
  'Slide04-WatchParty',
  'Slide05-Sync',
  'Slide06-Features',
  'Slide07-Content',
  'Slide08-CTA',
  // Intro post — Uzbek (Coremed style)
  'Slide09-IntroUz',
  'Slide10-ProblemUz',
  'Slide11-FeaturesUz',
  'Slide12-HowItWorksUz',
  'Slide13-CTAUz',
];

fs.mkdirSync('out', { recursive: true });

for (const id of slides) {
  console.log(`Rendering ${id}...`);
  execSync(
    `npx remotion render src/Root.tsx ${id} out/${id}.mp4 --codec=h264`,
    { stdio: 'inherit' },
  );
}

console.log('\n✅ All slides rendered to out/');
