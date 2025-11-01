(async()=>{
  const r=await fetch('http://127.0.0.1:3002/api/auth/sign-in/social',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({provider:'google',callbackURL:'/dashboard'})
  });
  console.log('status',r.status);
  const t=await r.text();
  console.log(t);
})();
