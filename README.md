# NoBroker Loans Referral - standalone site

Static Vercel site: no Supabase, database or identity verification.

- `/`: VH profile lookup (Shiv configured for 9945048798), UTM link builder, QR and PNG creative with photo/designation.
- `/form/`: compact seven-field referral form.
- `/landing/`: separate campaign introduction.

**Brand:** red #D80000, white, black, restrained pink; premium minimal B2B voice, “Your Partner in Growth.” No new sub-brand identity. Replace `assets/nbl-logo.png` with the actual approved NoBroker Loans logo before launch (not included because source asset wasn't available). The download creative currently uses plain brand-name text instead of a recreated logo: insert the authentic logo into the canvas output before publishing those creatives.

**Profile mapping:** Shiv / 9945048798 is a public-only preset in `config.js`; Asad and Aditya profiles are present but have no mobile number configured. Mobile matching is NOT secure authentication or OTP verification. Do not use it as access control or identity verification.

**Submissions:** No forms are saved here. Configure individual Google Forms URL and field entry IDs in `config.js` and require users to submit there.

Vercel domain assignment and deployment must be performed through Vercel.
