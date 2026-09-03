export const termsVersion = '1.0';
export const termsEffectiveDate = 'September 3, 2026';
export const termsStorageKey = `deepframe-terms-accepted-${termsVersion}`;

export const prohibitedUses = [
  'Stalk, harass, threaten, intimidate, or abuse another person.',
  'Secretly track, locate, monitor, surveil, or profile someone.',
  'Expose GPS coordinates, identities, addresses, or device details without appropriate consent.',
  'Dox, blackmail, discriminate against, impersonate, endanger, or facilitate harm to anyone.',
];

export const termsSections = [
  {
    title: '1. What DeepFrame does',
    paragraphs: [
      'DeepFrame reads metadata and structural information already contained in an image file and presents available results in a more understandable form. The hosted version is designed to process selected photos locally in the browser.',
      'DeepFrame cannot recover metadata that was removed before the file reached the tool. Results may be incomplete, unsupported, incorrectly encoded, or affected by the browser, image format, device, or software that created the file.',
    ],
  },
  {
    title: '2. Permission to inspect a file',
    paragraphs: [
      'Use DeepFrame only with files you own or are authorized to inspect. You are responsible for respecting privacy, consent, intellectual-property rights, confidentiality duties, platform rules, and applicable law.',
    ],
  },
  {
    title: '3. Prohibited conduct',
    paragraphs: [
      'Do not use DeepFrame or its results to stalk, harass, threaten, dox, blackmail, discriminate, impersonate, secretly track, locate, surveil, profile, or endanger anyone; bypass privacy or access controls; investigate a person without lawful authority; facilitate violence, exploitation, fraud, or unlawful activity; or help another person do any of those things.',
      'If a result could affect another person’s safety or privacy, stop and obtain their informed consent before saving, sharing, publishing, or acting on it.',
    ],
  },
  {
    title: '4. Responsible sharing',
    paragraphs: [
      'Photo metadata can reveal precise locations, dates, device details, names, and workflows. Review every export before sharing it. DeepFrame hides GPS coordinates from its simplified share report by default, but you remain responsible for information you choose to reveal or distribute.',
    ],
  },
  {
    title: '5. Privacy and local processing',
    paragraphs: [
      'The hosted application is designed to analyze selected image bytes in your browser without uploading the original image to a DeepFrame image server. Your browser, device, network, hosting provider, extensions, and third-party links may operate under their own policies.',
    ],
  },
  {
    title: '6. Accuracy and professional reliance',
    paragraphs: [
      'DeepFrame provides informational output, not legal, investigative, forensic, safety, or professional advice. Metadata can be missing, edited, forged, misinterpreted, or inconsistent. Do not treat a result as definitive proof of identity, ownership, location, time, intent, authenticity, or wrongdoing.',
    ],
  },
  {
    title: '7. Ownership and license',
    paragraphs: [
      'DeepFrame, its design, branding, source code, and original materials belong to Asher Menachem unless otherwise stated. Access to the hosted tool does not grant permission to copy or reuse its source code. Source-code use requires prior written permission under the DeepFrame Source-Available License.',
    ],
  },
  {
    title: '8. Availability and changes',
    paragraphs: [
      'DeepFrame may change, suspend, restrict, or discontinue features at any time. These terms may be updated. A material update may require renewed acceptance before the inspection workspace can be used.',
    ],
  },
  {
    title: '9. Disclaimer and limitation',
    paragraphs: [
      'DeepFrame is provided “as is” and “as available,” without warranties of availability, security, accuracy, completeness, fitness for a particular purpose, title, or non-infringement. To the maximum extent permitted by law, Asher Menachem will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of data, privacy, profits, revenue, or goodwill, arising from DeepFrame, its results, or their use.',
    ],
  },
] as const;
