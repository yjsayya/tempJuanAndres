const express = require('express');
const path = require('path');

const app = express();
const PORT = 8700; // 사용할 포트 번호

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
