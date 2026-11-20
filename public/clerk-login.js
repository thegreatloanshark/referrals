// ClerkJS browser SDK and the Clerk-hosted sign-in UI are loaded on demand.
// Publishable key is public; secret key and the private VH roster stay server-side.
function addScript(src, attrs={}) {
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.defer=true;script.crossOrigin='anonymous';
    for(const [k,v] of Object.entries(attrs))script.setAttribute(k,v);
    script.onload=resolve;script.onerror=()=>reject(Error('Unable to load secure sign-in.'));
    document.head.append(script);
  });
}
export async function initializeClerk(node, onSession){
  const response=await fetch('/api/clerk-config',{cache:'no-store'});
  const config=await response.json();if(!response.ok)throw Error(config.error||'Clerk is not configured.');
  const key=config.publishableKey;
  const domain=atob(key.replace(/^pk_(test|live)_/,'' )).replace(/\$$/,'');
  if(!/^[a-z0-9.-]+$/i.test(domain)||!domain.includes('.'))throw Error('Invalid Clerk frontend domain.');
  await addScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
  await addScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,{'data-clerk-publishable-key':key});
  await window.Clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    appearance: {
      variables: {
        colorPrimary: '#D80000',
        colorForeground: '#191919',
        colorBackground: '#FFFFFF',
        colorInputBackground: '#FFFFFF',
        colorInputForeground: '#191919',
        colorPrimaryForeground: '#FFFFFF',
        borderRadius: '10px',
        fontFamily: 'Arimo, Arial, sans-serif'
      },
      options: {
        logoImageUrl: `${location.origin}/assets/nbl-logo.png`,
        logoLinkUrl: `${location.origin}/`
      }
    }
  });
  const clerk=window.Clerk;
  let lastSessionId=null;let signInMounted=false;
  const refresh=async()=>{
    const sessionId=clerk.session?.id || null;
    if(clerk.user&&sessionId){
      node.hidden=true;document.getElementById('authPanel').hidden=true;
      if(sessionId!==lastSessionId){lastSessionId=sessionId;await onSession();}
    }else{
      lastSessionId=null;node.hidden=false;document.getElementById('authPanel').hidden=false;
      if(!signInMounted){clerk.mountSignIn(node,{routing:'hash',signUpUrl:'/sign-up',signUpFallbackRedirectUrl:'/vh-only',appearance:{variables:{colorPrimary:'#D80000',borderRadius:'10px'},options:{logoImageUrl:`${location.origin}/assets/nbl-logo.png`,logoLinkUrl:`${location.origin}/`}}});signInMounted=true;}
    }
  };
  clerk.addListener(({user,session})=>{void refresh().catch(e=>console.error(e));});
  await refresh();return clerk;
}
// A standalone sign-up component on this site's own /sign-up route.
export async function initializeClerkSignUp(node){
  const response=await fetch('/api/clerk-config',{cache:'no-store'});
  const config=await response.json();
  if(!response.ok)throw Error(config.error||'Clerk is not configured.');
  const key=config.publishableKey;
  const domain=atob(key.replace(/^pk_(test|live)_/,'' )).replace(/\$$/,'');
  if(!/^[a-z0-9.-]+$/i.test(domain)||!domain.includes('.'))throw Error('Invalid Clerk frontend domain.');
  await addScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
  await addScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,{'data-clerk-publishable-key':key});
  await window.Clerk.load({
    ui:{ClerkUI:window.__internal_ClerkUICtor},
    appearance:{
      variables:{colorPrimary:'#D80000',colorForeground:'#191919',colorBackground:'#FFFFFF',colorInputBackground:'#FFFFFF',colorInputForeground:'#191919',colorPrimaryForeground:'#FFFFFF',borderRadius:'10px',fontFamily:'Arimo, Arial, sans-serif'},
      options:{logoImageUrl:`${location.origin}/assets/nbl-logo.png`,logoLinkUrl:`${location.origin}/`}
    }
  });
  if(window.Clerk.user){location.replace('/vh-only');return;}
  window.Clerk.mountSignUp(node,{
    routing:'hash',
    signInUrl:'/vh-only',
    signInFallbackRedirectUrl:'/vh-only',
    signUpFallbackRedirectUrl:'/vh-only',
    appearance:{variables:{colorPrimary:'#D80000',borderRadius:'10px'},options:{logoImageUrl:`${location.origin}/assets/nbl-logo.png`,logoLinkUrl:`${location.origin}/`}}
  });
}
export async function clerkFetch(url,options={}){
  const clerk=window.Clerk;
  if(!clerk?.session)throw Error('Please sign in to continue.');
  const jwt=await clerk.session.getToken();
  if(!jwt)throw Error('Your session has expired. Sign in again.');
  const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${jwt}`);
  return fetch(url,{...options,headers,cache:'no-store'});
}
