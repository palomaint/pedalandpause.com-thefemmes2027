const fs=require('node:fs');
fs.rmSync('dist',{recursive:true,force:true});fs.cpSync('public','dist',{recursive:true});
console.log('Public site built. Server code and secrets are excluded.');
