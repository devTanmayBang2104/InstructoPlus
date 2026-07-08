import Course from "../model/course.Model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import Lecture from "../model/lecture.Model.js";
import User from "../model/user.Model.js";
import { getYoutubeVideoId, getYoutubePlaylistId, fetchYoutubeVideoDetails, fetchYoutubePlaylistDetails } from '../utils/youtubeApi.js';

export const createCourse = async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required",
      });
    }
    const course = await Course.create({
      title,
      creator: req.userId,
      category,
      isPublished: true, // Set isPublished to true by default
    });
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while creating course",
      error,
    });
  }
};

export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate("creator", "name photoUrl description email")
      .populate("lectures")
      .populate("reviews");
    if (!courses) {
      return res.status(400).json({
        success: false,
        message: "Courses not found",
      });
    }
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    // console.error("Error while getting published courses:", error); // Log the error
    return res.status(500).json({
      success: false,
      message: "error while getting published courses",
      error,
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.userId;
    const courses = await Course.find({ creator: userId })
      .populate("creator", "name photoUrl")
      .populate("lectures")
      .populate("reviews")
    if (!courses) {
      return res.status(400).json({
        success: false,
        message: "Courses not found",
      });
    }
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while getting creator courses",
      error,
    });
  }
};

export const getCreator = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while fetching creator",
      error,
    });
  }
}

export const getCoursesByCreatorId = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const courses = await Course.find({ creator: creatorId, isPublished: true })
      .populate("creator", "name photoUrl")
      .populate("lectures").populate("reviews");
    if (!courses) {
      return res.status(404).json({
        success: false,
        message: "Courses not found for this creator",
      });
    }
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while fetching creator's courses",
      error,
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      subTitle,
      category,
      description,
      level,
      isPublished,
      price,
    } = req.body;
    let thumbnail = null;
    if (req.file) {
      const uploadedThumbnail = await uploadOnCloudinary(req.file.path);
      if (uploadedThumbnail && uploadedThumbnail.url) {
        thumbnail = uploadedThumbnail.url;
      }
    }
    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }
    const updateData = {
      title,
      subTitle,
      category,
      description,
      level,
      isPublished,
      price,
      thumbnail,
    };
    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });
    return res.status(200).json({
      success: true,
      course,
      message: "Course edited successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while editing course",
      error,
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while getting course by id",
      error,
    });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    let course = await Course.findById(courseId); // Changed const to let
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }
    course = await Course.findByIdAndDelete(courseId);
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while deleting course",
      error,
    });
  }
};


// for lecture

export const createLectue = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lectureTitle, description, videoUrl, isPreviewFree } = req.body;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Lecture title and course ID are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    let newLectures = [];

    // Handle YouTube video/playlist
    if (videoUrl) {
      const youtubeVideoId = getYoutubeVideoId(videoUrl);
      const youtubePlaylistId = getYoutubePlaylistId(videoUrl);

      if (youtubeVideoId) {
        const videoDetails = await fetchYoutubeVideoDetails(youtubeVideoId);
        if (videoDetails) {
          const lecture = await Lecture.create({
            lectureTitle: lectureTitle || videoDetails.title,
            description: description || videoDetails.description,
            videoUrl: `https://www.youtube.com/embed/${youtubeVideoId}`,
            duration: videoDetails.duration,
            isYoutubeVideo: true,
            youtubeVideoId: youtubeVideoId,
            isPreviewFree: isPreviewFree || false,
            courseId,
          });
          newLectures.push(lecture);
        } else {
          return res.status(400).json({
            success: false,
            message: "Could not fetch YouTube video details",
          });
        }
      } else if (youtubePlaylistId) {
        const playlistDetails = await fetchYoutubePlaylistDetails(youtubePlaylistId);
        if (playlistDetails && playlistDetails.videos.length > 0) {
          for (const video of playlistDetails.videos) {
            const lecture = await Lecture.create({
              lectureTitle: video.title,
              description: video.description,
              videoUrl: `https://www.youtube.com/embed/${video.youtubeVideoId}`,
              duration: video.duration,
              isYoutubeVideo: true,
              youtubeVideoId: video.youtubeVideoId,
              youtubePlaylistId: youtubePlaylistId,
              isPreviewFree: isPreviewFree || false,
              courseId,
            });
            newLectures.push(lecture);
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Could not fetch YouTube playlist details or playlist is empty",
          });
        }
      }
    }

    // Handle Cloudinary upload if no YouTube link was provided or processed
    if (newLectures.length === 0 && req.file) {
      const videoResult = await uploadOnCloudinary(req.file.path);
      if (videoResult && videoResult.url) {
        const lecture = await Lecture.create({
          lectureTitle,
          description,
          videoUrl: videoResult.url,
          duration: videoResult.duration,
          isPreviewFree: isPreviewFree || false,
          courseId,
        });
        newLectures.push(lecture);
      } else {
        return res.status(500).json({
          success: false,
          message: "Error uploading video to Cloudinary",
        });
      }
    } else if (newLectures.length === 0 && !videoUrl && !req.file) {
      // Create a lecture without video if neither YouTube link nor file upload is provided
      const lecture = await Lecture.create({
        lectureTitle,
        description,
        isPreviewFree: isPreviewFree || false,
        courseId,
      });
      newLectures.push(lecture);
    }

    if (newLectures.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to create any lectures",
      });
    }

    // Add new lectures to the course
    course.lectures.push(...newLectures.map(lec => lec._id));
    await course.save();
    await course.populate("lectures"); // Populate to return updated course with lectures

    return res.status(200).json({
      success: true,
      message: "Lectures created successfully",
      lectures: newLectures,
      course,
    });
  } catch (error) {
    // console.error("Error while creating lecture:", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating lecture",
      error: error.message,
    });
  }
};

export const getCourseLectures=async(req,res)=>{
  try {
    const {courseId}=req.params
    const course=await Course.findById(courseId).populate("lectures");
    if(!course){
      return res.status(400).json({
        success:false,
        message:"Course not found"
      })
    }
    await course.save();
    return res.status(200).json({
      success:true,
      course
    })

  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while getting course lectures",
      error
    })
  }
}

export const editLecuture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { lectureTitle, description, isPreviewFree, removeVideo, videoUrl } = req.body; // Added videoUrl
    let { documentInfos, removeDocuments } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    // Reset video fields if removeVideo is true
    if (removeVideo === 'true') {
      lecture.videoUrl = null;
      lecture.duration = 'PT0S';
      lecture.isYoutubeVideo = false;
      lecture.youtubeVideoId = null;
      lecture.youtubePlaylistId = null;
    }

    // Handle YouTube video update
    if (videoUrl) {
      const youtubeVideoId = getYoutubeVideoId(videoUrl);
      const youtubePlaylistId = getYoutubePlaylistId(videoUrl); // Check for playlist, but only process single video

      if (youtubeVideoId) {
        const videoDetails = await fetchYoutubeVideoDetails(youtubeVideoId);
        if (videoDetails) {
          lecture.lectureTitle = lectureTitle || videoDetails.title;
          lecture.description = description || videoDetails.description;
          lecture.videoUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;
          lecture.duration = videoDetails.duration;
          lecture.isYoutubeVideo = true;
          lecture.youtubeVideoId = youtubeVideoId;
          lecture.youtubePlaylistId = null; // Ensure playlist ID is cleared if a single video is set
        } else {
          return res.status(400).json({
            success: false,
            message: "Could not fetch YouTube video details for update",
          });
        }
      } else if (youtubePlaylistId) {
        // For editing a single lecture, we don't support replacing it with a full playlist.
        // You might want to add a separate endpoint for "add lectures from playlist".
        return res.status(400).json({
          success: false,
          message: "Editing a single lecture with a YouTube playlist is not supported. Please use a single video URL.",
        });
      } else {
        // If videoUrl is provided but not a YouTube link, treat as a direct URL (e.g., from Cloudinary or other source)
        lecture.videoUrl = videoUrl;
        lecture.isYoutubeVideo = false;
        lecture.youtubeVideoId = null;
        lecture.youtubePlaylistId = null;
        lecture.duration = 'PT0S'; // Reset duration for non-YouTube videos if not provided
      }
    } else if (req.files && req.files.videoUrl && req.files.videoUrl[0]) {
      // Handle Cloudinary upload if no YouTube link was provided
      const videoResult = await uploadOnCloudinary(req.files.videoUrl[0].path);
      if (videoResult && videoResult.url) {
        lecture.videoUrl = videoResult.url;
        lecture.duration = videoResult.duration;
        lecture.isYoutubeVideo = false;
        lecture.youtubeVideoId = null;
        lecture.youtubePlaylistId = null;
      } else {
        return res.status(500).json({
          success: false,
          message: "Error uploading video to Cloudinary during lecture edit",
        });
      }
    }

    // Handle document removal
    if (removeDocuments) {
      removeDocuments = JSON.parse(removeDocuments);
      if (Array.isArray(removeDocuments) && removeDocuments.length > 0) {
        lecture.documents = lecture.documents.filter(
          (doc) => !removeDocuments.includes(doc._id.toString())
        );
      }
    }

    // Handle new document uploads
    if (documentInfos) {
      documentInfos = JSON.parse(documentInfos);
    }
    if (req.files && req.files.documents && documentInfos) {
      const uploadedDocuments = await Promise.all(
        req.files.documents.map(async (file, index) => {
            const docResult = await uploadOnCloudinary(file.path);
            const docInfo = documentInfos[index];
            return {
              title: docInfo.title,
              description: docInfo.description,
              url: docResult.url, // Extract the URL string
            };
        })
      );
      lecture.documents.push(...uploadedDocuments);
    }

    // Update other fields
    lecture.lectureTitle = lectureTitle || lecture.lectureTitle; // Use existing if not provided
    lecture.description = description || lecture.description; // Use existing if not provided
    lecture.isPreviewFree = isPreviewFree !== undefined ? isPreviewFree : lecture.isPreviewFree; // Use existing if not provided

    await lecture.save();
    return res.status(200).json({
      success: true,
      message: "Lecture edited successfully",
      lecture,
    });
  } catch (error) {
    // console.error("Error editing lecture:", error);
    return res.status(500).json({
      success: false,
      message: "Error while editing lecture",
      error: error.message,
    });
  }
};

export const removeLecture=async(req,res)=>{
  try {
    const {lectureId}=req.params
    const lecture=await Lecture.findByIdAndDelete(lectureId);
    if(!lecture){
      return res.status(400).json({
        success:false,
        message:"Lecture not found"
      })
    }
    return res.status(200).json({
      success:true,
      message:"Lecture deleted successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while deleting lecture",
      error
    })
  }
}
export const addDocuments=async(req,res)=>{
  try{
    const {lectureId}=req.params
    const {documents}=req.body
    const lecture=await Lecture.findById(lectureId);
    if(!lecture){
      return res.status(400).json({
        success:false,
        message:"Lecture not found"
      })
    }

    const savedDocuments=documents.map(async(doc)=>{
      const docResult=await uploadOnCloudinary(doc.path); // uploadOnCloudinary now returns {url, duration}
      return {
        title:doc.filename,
        url:docResult.url // Use the url from the result
      }
    })

    const documentsUrl=await Promise.all(savedDocuments);
    lecture.documents.push(...documentsUrl)
    await lecture.save();
    return res.status(200).json({
      success:true,
      lecture
    })
  }catch(error){
    return res.status(500).json({
      success:false,
      message:"error while adding documents",
      error
    })
  }
}

export const getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course and populate enrolled students
    const course = await Course.findById(courseId)
      .populate({
        path: 'enrolledStudents',
        select: 'name email photoUrl description' // Only select necessary fields
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    return res.status(200).json({
      success: true,
      enrolledStudents: course.enrolledStudents || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while getting enrolled students",
      error: error.message
    });
  }
}
