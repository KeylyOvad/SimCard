const bcrypt = require('bcrypt');

bcrypt.hash('12345', 10).then(hash => {
  console.log(hash);
});