/* Configure only approved Vertical Heads and their Google Forms.
 * No Supabase, database, cookies, or local storage.
 * Google Form fields must use their real entry IDs (entry.123456789).
 */
window.REFERRAL_CONFIG = {
  siteUrl: 'https://nbloans-refer.vercel.app/',
  heads: {
    // pawan: {
    //   name: 'Pawan',
    //   googleForm: {
    //     url: 'https://docs.google.com/forms/d/e/FORM_ID/viewform',
    //     fields: {
    //       referrerName: 'entry.111', referrerMobile: 'entry.222',
    //       referrerEmail: 'entry.333', referrerCity: 'entry.444',
    //       referredName: 'entry.555', referredMobile: 'entry.666',
    //       referredEmail: 'entry.777'
    //     },
    //     attributionEntry: 'entry.888' // optional hidden tracking question
    //   }
    // }
  }
};
