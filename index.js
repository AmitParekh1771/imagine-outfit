const express = require('express');
const { join } = require('path');

const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));