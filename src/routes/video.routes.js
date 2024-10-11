import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middlewares.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router


// Route: /, Methods: GET = done
// Route: /, Methods: POST  = done 
// Route: /:videoId, Methods: GET = done 
// Route: /:videoId, Methods: DELETE  = done
// Route: /:videoId, Methods: PATCH = done 
// Route: /toggle/publish /: videoId, Methods: PATCH = done


// suggestions for video routes ============================================
// Suggested Additional Routes
// Route: /search, Methods: GET

// Purpose: To allow users to search for videos based on various criteria(like title, description, etc.) without affecting the main video list.
//     Example: GET / search ? query = funny
// Route: /popular, Methods: GET

// Purpose: To fetch a list of popular videos based on views or engagement metrics.
//     Example: GET / popular
// Route: /user/: userId, Methods: GET

// Purpose: To get all videos uploaded by a specific user.
//     Example: GET / user / 12345
// Route: /recent, Methods: GET

// Purpose: To fetch the most recently uploaded videos.
//     Example: GET / recent
// Route: /toggle/favorite /: videoId, Methods: PATCH

// Purpose: To allow users to mark a video as a favorite or remove it from favorites.
//     Example: PATCH / toggle / favorite / 60d5f9c3f1d2f2a01f3e8e1c
// Route: /views/: videoId, Methods: PATCH

// Purpose: To update the view count for a specific video.
//     Example: PATCH / views / 60d5f9c3f1d2f2a01f3e8e1c
// Route: /report/: videoId, Methods: POST

// Purpose: To allow users to report a video for inappropriate content or other issues.
//     Example: POST / report / 60d5f9c3f1d2f2a01f3e8e1c