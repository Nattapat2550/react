const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // In prod, use cloud (e.g., AWS S3)

module.exports = upload.single('profilePic');