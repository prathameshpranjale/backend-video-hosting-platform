import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
        // call back 
        // we are not handling error 
        // file storing we are using public temp
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname)
        // documentation read for this 
        // file.original name should be changed as it can have error when 2 same name person enter
    }
})

export const upload = multer({
    storage,
})