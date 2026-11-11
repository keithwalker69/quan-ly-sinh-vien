const { createApp } = require('./app');

const port = process.env.PORT || 3000;
createApp().listen(port, () => console.log(`Quản lý sinh viên chạy tại http://localhost:${port}`));
