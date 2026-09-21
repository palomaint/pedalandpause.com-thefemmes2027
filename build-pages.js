const fs = require('node:fs');
const {build} = require('esbuild');
async function main() {
  fs.rmSync('dist-pages', {recursive:true, force:true});
  fs.cpSync('public', 'dist-pages', {recursive:true});
  await build({entryPoints:['worker.mjs'], outfile:'dist-pages/_worker.js', bundle:true, format:'esm', platform:'browser', target:'es2022'});
  fs.writeFileSync('dist-pages/_routes.json', JSON.stringify({version:1, include:['/api/*'], exclude:[]}));
  console.log('Pages site and booking function built. Credentials are supplied only at runtime.');
}
main().catch(error => {console.error(error);process.exit(1);});
