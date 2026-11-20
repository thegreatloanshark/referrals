import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
test('sign in links to embedded sign-up route',()=>{
  assert.match(read('../public/clerk-login.js'),/signUpUrl:'\/sign-up'/);
  assert.match(read('../public/clerk-login.js'),/mountSignUp\(node/);
  assert.match(read('../public/clerk-login.js'),/signInUrl:'\/vh-only'/);
});
test('sign up page stays in branded site and uses its own page',()=>{
  assert.match(read('../public/sign-up.html'),/id="clerkSignUp"/);
  assert.match(read('../public/sign-up.html'),/\/signup\.js/);
  assert.match(read('../vercel.json'),/"source": "\/sign-up"/);
});
