import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load = p => readFileSync(new URL(p, import.meta.url), 'utf8');
test('Clerk is explicitly configured to return to the VH page after sign in', () => {
 const auth = load('../public/clerk-login.js');
 assert.match(auth, /signInUrl:\s*'\/vh-only'/);
 assert.match(auth, /signInForceRedirectUrl:\s*'\/vh-only'/);
 assert.match(auth, /clerk\.mountSignIn\(node,\{[^\n]+forceRedirectUrl:'\/vh-only'/);
});
test('registration returns to VH workspace', () => {
 const auth = load('../public/clerk-login.js');
 assert.match(auth, /signUpForceRedirectUrl:\s*'\/vh-only'/);
 assert.match(auth, /window\.Clerk\.mountSignUp\(node,\{[^]*?forceRedirectUrl:'\/vh-only'/);
});
test('direct VH route is rewritten rather than redirected to home', () => {
 const config = JSON.parse(load('../vercel.json'));
 assert.deepEqual(config.rewrites.find(x => x.source === '/vh-only'), {source:'/vh-only',destination:'/vh-only.html'});
 assert.ok(!config.redirects.some(x => x.source === '/vh-only'));
});
