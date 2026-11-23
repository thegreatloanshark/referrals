# V13 homepage one-screen update

- Public homepage (`public/index.html`) and direct landing alias (`public/landing.html`) updated identically.
- Desktop: two columns; left hero and flat ₹5,000 reward, right explanation/eligibility and horizontally aligned Vertical Head CTA and button.
- Header, content, and footer use the viewport height without fixed clipping on normal laptop-sized screens.
- Smaller viewports compact typography/spacing, with necessary overflow retained for accessibility on unusually small devices.
- CSS scoped under `body.referral-home` so /vh-only dashboard, forms, API, and five flyers are unchanged.
- No change to authentication, tracking, payouts, or QR generation.
- Deploy the complete contents of this ZIP to the connected GitHub repo and wait for Vercel production deployment.
