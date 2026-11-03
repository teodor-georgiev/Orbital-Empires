import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { configuredDonationUrl, DONATION_URL } from '../support-config.js';
const read=async path=>readFile(new URL('../'+path, import.meta.url),'utf8');

test('donation link is off unless the project owner configures an approved HTTPS destination',()=>{
 assert.equal(DONATION_URL,'');
 for(const input of ['','javascript:alert(1)','http://ko-fi.com/example','https://evil.example/','https://github.com/example','https://github.com/sponsors/','https://ko-fi.com@evil.example/','https://ko-fi.com:8080/example'])assert.equal(configuredDonationUrl(input),'',input);
 assert.equal(configuredDonationUrl('https://ko-fi.com/example'),'https://ko-fi.com/example');
 assert.equal(configuredDonationUrl('https://github.com/sponsors/example'),'https://github.com/sponsors/example');
});
test('download and donate menu actions exist without payment code',async()=>{
 const [html,app,sprite,styles,sw]=await Promise.all(['index.html','app.js','assets/ui/interface-icons.svg','modules/styles/distribution.css','sw.js'].map(read));
 for(const name of ['download-menu','donate-menu']){assert.ok(html.includes('data-action="'+name+'"'));assert.ok(app.includes("'"+name+"'"));}
 assert.ok(app.includes('exportSave()'));
 assert.ok(app.includes('configuredDonationUrl()'));
 for(const icon of ['download','heart','archive'])assert.ok(sprite.includes('id="'+icon+'"'));
 assert.ok(styles.includes('.distribution-panel'));
 for(const file of ['modules/styles/distribution.css','support-config.js'])assert.ok(sw.includes(file));
 assert.ok(sw.includes("cache:'no-cache'"),'network first keeps online PWA fresh on each reload');
});
test('downloaded standalone source package includes a loopback-only launcher',async()=>{
 const launcher=await read('launch-local.py');
 assert.ok(launcher.includes('127.0.0.1'));
 assert.ok(launcher.includes('SimpleHTTPRequestHandler'));
 assert.ok(!launcher.includes('0.0.0.0'));
 const readme=await read('README.md');
 assert.ok(readme.includes('launch-local.py'));
});
