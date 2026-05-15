const fs = require('fs');
const files = ['Backend/Controllers/AuthController.cs', 'Backend/Controllers/UsersController.cs', 'Backend/Controllers/PostsController.cs'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/BadRequest\("([^"]+)"\)/g, 'BadRequest(new { message = "$1" })');
  content = content.replace(/Unauthorized\("([^"]+)"\)/g, 'Unauthorized(new { message = "$1" })');
  content = content.replace(/NotFound\("([^"]+)"\)/g, 'NotFound(new { message = "$1" })');
  fs.writeFileSync(f, content);
});
console.log("Done!");