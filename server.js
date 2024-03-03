const app = require('./app');
const db = require('./db');

const port = process.env.PORT || 5500;

db.connect();

app.listen(port, () => console.log(`listening on port: ${port}`));