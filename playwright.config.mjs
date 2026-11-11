import { defineConfig } from '@playwright/test';

export default defineConfig({
 testDir:'./tests',
 timeout:150000,
 retries:0,
 workers:1,
 reporter:process.env.CI?'github':'list',
 use:{
  baseURL:'http://127.0.0.1:8765',
  browserName:'chromium',
  channel:'chrome',
  headless:true,
  launchOptions:{
   args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  }
 },
 webServer:{
  command:'python3 -m http.server 8765 --bind 127.0.0.1',
  url:'http://127.0.0.1:8765/',
  reuseExistingServer:!process.env.CI,
  timeout:20000
 }
});
