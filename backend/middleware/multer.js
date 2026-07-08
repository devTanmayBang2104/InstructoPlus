import multer from "multer";

const storage =multer.diskStorage({
  destination:(req,file,cb)=>{
    // cb(null,"./public")
      cb(null,"/tmp")

  },
  filename:(req,file,cb)=>{
    cb(null,Date.now()+file.originalname)
  }

})

const upload=multer({storage:storage})

export default upload

// import multer from "multer";

// // Use memory storage instead of saving files to ./public
// const storage = multer.memoryStorage();

// // Optional: file filter (to allow only images/docs if you want)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     "image/jpeg",
//     "image/png",
//     "image/jpg",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     "application/vnd.ms-powerpoint",
//     "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//     "text/plain"
//   ];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only images and documents are allowed!"), false);
//   }
// };

// // Multer upload config
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
// });

// export default upload;
