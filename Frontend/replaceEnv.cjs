const fs = require('fs');

const envString = '${import.meta.env.VITE_API_URL || "http://localhost:5290"}';

const fRegister = 'Frontend/src/pages/authorization/Register.jsx';
let contentReg = fs.readFileSync(fRegister, 'utf8');
contentReg = contentReg.replace(/http:\/\/localhost:5290/g, envString);
fs.writeFileSync(fRegister, contentReg);

const fLogin = 'Frontend/src/pages/authorization/Login.jsx';
let contentLog = fs.readFileSync(fLogin, 'utf8');
contentLog = contentLog.replace(/"http:\/\/localhost:5290\/api\/auth\/login"/g, '`' + envString + '/api/auth/login`');
fs.writeFileSync(fLogin, contentLog);

const fAuth = 'Frontend/src/context/AuthContext.jsx';
let contentAuth = fs.readFileSync(fAuth, 'utf8');
contentAuth = contentAuth.replace(/"http:\/\/localhost:5290\/api\/users\/me"/g, '`' + envString + '/api/users/me`');
fs.writeFileSync(fAuth, contentAuth);

console.log('Inline replacements done');
