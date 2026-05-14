const bcrypt = require('bcrypt');

const passwordPlano = '12345';
const hashBD = '$2b$10$U.GwhXAMk5ownY194KfivOcXr9IegAJ6FSagO/aM0PmXvppq23jK.';

bcrypt.compare(passwordPlano, hashBD).then(result => {
  console.log('RESULTADO:', result);
});