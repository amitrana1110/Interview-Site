import {spawn} from 'node:child_process';
const args=process.argv.slice(2);const at=args.indexOf('--port');const port=at>=0?args[at+1]:'3000';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','0.0.0.0','--port',port],{stdio:'inherit'});child.on('exit',code=>process.exit(code||0));
