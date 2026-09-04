export const termsVersion = '2.0';
export const privacyVersion = '1.0';
export const termsEffectiveDate = 'September 4, 2026';
export const privacyEffectiveDate = 'September 4, 2026';
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
      'DeepFrame reads metadata and structural information contained in image files, organizes the results, stores account history, and offers privacy tools for supported formats. Results may be incomplete, incorrectly encoded, edited, forged, or affected by the browser, file format, device, or software that created the file.',
    ],
  },
  {
    title: '2. Accounts and eligibility',
    paragraphs: [
      'You may browse public pages without an account, but an account is required to inspect or clean a photo. You must provide accurate account information, protect access to your sign-in method, and be legally permitted to use the service. DeepFrame uses passwordless email links and supported third-party identity providers; DeepFrame does not receive or store your third-party password.',
      'Accounts may be suspended or banned for abuse, security risks, attempts to bypass limits, unlawful activity, or material violations of these terms.',
    ],
  },
  {
    title: '3. Permission to inspect a file',
    paragraphs: [
      'Use DeepFrame only with files you own or are authorized to inspect. You are responsible for privacy, consent, intellectual-property rights, confidentiality duties, platform rules, and applicable law.',
    ],
  },
  {
    title: '4. Prohibited conduct',
    paragraphs: [
      'Do not use DeepFrame or its results to stalk, harass, threaten, dox, blackmail, discriminate, impersonate, secretly track, locate, surveil, profile, or endanger anyone; bypass privacy or access controls; investigate a person without lawful authority; facilitate violence, exploitation, fraud, or unlawful activity; or help another person do any of those things.',
      'If a result could affect another person’s safety or privacy, stop and obtain their informed consent before saving, sharing, publishing, or acting on it.',
    ],
  },
  {
    title: '5. Saved uploads, reports, and activity records',
    paragraphs: [
      'When a signed-in user inspects a file, DeepFrame stores the uploaded original in private storage, the generated report, account usage, and material actions such as inspections, exports, sharing, metadata removal, account changes, and deletion requests. These records support cross-device history, quotas, abuse prevention, and security review. See the Privacy Policy for categories, retention, access, and choices.',
      'DeepFrame does not routinely inspect individual accounts. Authorized administrators may review account records when needed for a reported or detected security, safety, abuse, support, or legal concern. Administrative actions are logged.',
    ],
  },
  {
    title: '6. Plans and usage limits',
    paragraphs: [
      'Free accounts receive one inspection per calendar day, with no rollover. Paid-plan features and limits may be introduced or changed before payment enrollment opens. Until checkout is available, new users remain on Free unless an administrator assigns another plan for testing or support. Attempting to evade quotas or access controls is prohibited.',
    ],
  },
  {
    title: '7. Metadata removal',
    paragraphs: [
      'The privacy cleaner removes supported privacy metadata without intentionally changing encoded image pixels. Format limitations, color profiles, application-specific blocks, or future software changes may affect what can be removed. Always verify the downloaded result before publishing it.',
    ],
  },
  {
    title: '8. Responsible sharing',
    paragraphs: [
      'Photo metadata can reveal precise locations, dates, device details, names, and workflows. Review every export before sharing it. DeepFrame may hide sensitive fields in simplified sharing views, but you remain responsible for information you reveal or distribute.',
    ],
  },
  {
    title: '9. Privacy rights and deletion',
    paragraphs: [
      'Hiding a history item removes it from your normal account view but does not delete the underlying security record. You may separately request permanent account-data deletion. Some narrowly limited records may be retained where reasonably necessary for security, fraud prevention, disputes, or legal obligations, as described in the Privacy Policy. DeepFrame will not describe an archive action as permanent deletion.',
    ],
  },
  {
    title: '10. Ownership and license',
    paragraphs: [
      'DeepFrame, its design, branding, source code, and original materials belong to Asher Menachem unless otherwise stated. Access to the service does not grant permission to copy, modify, redistribute, remove usage controls from, or commercially exploit the source code.',
    ],
  },
  {
    title: '11. Accuracy, availability, and changes',
    paragraphs: [
      'DeepFrame provides informational output, not legal, investigative, forensic, safety, or professional advice. Do not treat a result as definitive proof of identity, ownership, location, time, intent, authenticity, or wrongdoing. Features, limits, plans, and terms may change, and a material update may require renewed acceptance.',
    ],
  },
  {
    title: '12. Disclaimer and limitation',
    paragraphs: [
      'DeepFrame is provided “as is” and “as available,” without warranties of availability, security, accuracy, completeness, fitness for a particular purpose, title, or non-infringement. To the maximum extent permitted by law, Asher Menachem will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of data, privacy, profits, revenue, or goodwill, arising from DeepFrame, its results, or their use.',
    ],
  },
] as const;

export const privacySections = [
  {
    title: '1. The short version',
    paragraphs: [
      'DeepFrame requires an account to use photo tools. We store account details, uploaded originals, generated reports, plan usage, and material product and security actions so history works across devices and the service can enforce limits and respond to abuse. We do not sell personal information, collect payment-card numbers, or receive passwords from Google, GitHub, or your email provider.',
    ],
  },
  {
    title: '2. Information we collect',
    paragraphs: [
      'Account data includes your user ID, username, email address, sign-in provider, plan, account status, legal-consent records, creation time, and recent account activity.',
      'Photo data includes the original file you choose to upload, its file name and technical properties, the metadata and structural report DeepFrame produces, cryptographic fingerprints, cleaned-output records, and timestamps.',
      'Activity and security data includes material actions such as signing in or out, starting and completing an inspection, viewing, exporting or sharing a report, opening an upgrade screen, removing metadata, hiding history, and requesting deletion. We do not record every mouse movement, keystroke, or unrelated click.',
    ],
  },
  {
    title: '3. Why we use it',
    paragraphs: [
      'We use this information to provide saved cross-device history, enforce daily limits, operate account and privacy features, diagnose failures, prevent abuse, investigate security or safety concerns, respond to support requests, and comply with applicable obligations.',
    ],
  },
  {
    title: '4. Storage and retention',
    paragraphs: [
      'Account history, uploaded originals, cleaned copies, and generated reports are stored in Supabase infrastructure while your account remains active so your history works across devices. Material product and security events are automatically removed after 180 days unless a longer period is reasonably required for an active security incident, dispute, fraud investigation, or legal obligation. You can request permanent account-data deletion from your profile.',
      'Storage periods are maximum operational targets, not a promise that every backup copy disappears instantly. Backups and provider systems may take additional time to cycle out deleted data.',
    ],
  },
  {
    title: '5. Who can access information',
    paragraphs: [
      'Users can access only their own account records. Other users cannot search for or view your profile or history. Authorized DeepFrame administrators can access account records only through restricted administrative controls. Individual records are not routinely reviewed and may be examined when there is a security, safety, abuse, support, or legal reason. Administrative changes are logged.',
      'Supabase and Vercel process information as infrastructure providers. Third-party sign-in providers process login information under their own policies. DeepFrame does not sell personal information or use photo contents for advertising.',
    ],
  },
  {
    title: '6. Your controls and privacy requests',
    paragraphs: [
      'You can review account history, change your username, hide individual history items, and submit an account-deletion request from your profile. Hiding is an archive action, not permanent deletion. The profile explains this before you confirm.',
      'A permanent-deletion request covers account data and stored photo history, subject to limited exceptions for security, fraud prevention, disputes, and legal obligations. You can submit a request from your profile. If you cannot access your account, contact the project owner through the official DeepFrame GitHub profile or creator channels.',
    ],
  },
  {
    title: '7. Security',
    paragraphs: [
      'DeepFrame uses passwordless or provider-managed authentication, private storage, row-level database access rules, server-controlled quotas, role-based administration, and audit logs. No online system can guarantee absolute security. Report suspected problems through the security contact listed by DeepFrame.',
    ],
  },
  {
    title: '8. Children and sensitive use',
    paragraphs: [
      'DeepFrame is not directed to children under 13. Do not upload another person’s photo or sensitive location information without authority and appropriate consent. If you believe a child’s or another person’s information was uploaded improperly, contact DeepFrame to request review.',
    ],
  },
  {
    title: '9. Changes and contact',
    paragraphs: [
      'We may update this policy when the service changes. Material changes may require renewed acceptance. Submit privacy requests from your profile or, if you cannot sign in, through the official DeepFrame GitHub profile or creator channels. This policy is a product disclosure and should be reviewed by qualified counsel before commercial launch.',
    ],
  },
] as const;
