const multer = require('multer');
var upload_images = (path) => {
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, path)
        },
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      })
      var upload = multer({ storage: storage })
      return upload;
}
module.exports = {upload_images};