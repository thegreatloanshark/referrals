import {initializeClerkSignUp} from '/clerk-login.js';
const node=document.getElementById('clerkSignUp');
initializeClerkSignUp(node).catch((e)=>{
  document.getElementById('notice').textContent=e.message||'Unable to load secure sign-up.';
});
