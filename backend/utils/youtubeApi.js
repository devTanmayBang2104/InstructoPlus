import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Function to extract YouTube video ID from a URL
export const getYoutubeVideoId = (url) => {
  const videoIdRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(videoIdRegex);
  return match ? match[1] : null;
};

// Function to extract YouTube playlist ID from a URL
export const getYoutubePlaylistId = (url) => {
  const playlistIdRegex = /[?&]list=([a-zA-Z0-9_-]+)/;
  const match = url.match(playlistIdRegex);
  return match ? match[1] : null;
};

// Function to fetch details for a single YouTube video
export const fetchYoutubeVideoDetails = async (videoId) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });
    const item = response.data.items[0];
    if (item) {
      return {
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        duration: item.contentDetails.duration, // ISO 8601 format
        youtubeVideoId: videoId,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching YouTube video details:', error.message);
    return null;
  }
};

// Function to fetch details for a YouTube playlist and its videos
export const fetchYoutubePlaylistDetails = async (playlistId) => {
  try {
    const playlistResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlists`, {
      params: {
        part: 'snippet',
        id: playlistId,
        key: YOUTUBE_API_KEY,
      },
    });
    const playlistItem = playlistResponse.data.items[0];
    if (!playlistItem) {
      return null;
    }

    const playlistTitle = playlistItem.snippet.title;
    const playlistDescription = playlistItem.snippet.description;

    let allVideos = [];
    let nextPageToken = null;

    do {
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: 50, // Max results per page
          pageToken: nextPageToken,
          key: YOUTUBE_API_KEY,
        },
      });

      const videos = videosResponse.data.items.map(item => ({
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        youtubeVideoId: item.contentDetails.videoId,
      }));
      allVideos = allVideos.concat(videos);
      nextPageToken = videosResponse.data.nextPageToken;
    } while (nextPageToken);

    // Fetch duration for each video in the playlist (requires separate video API calls)
    const videosWithDuration = await Promise.all(
      allVideos.map(async (video) => {
        const videoDetails = await fetchYoutubeVideoDetails(video.youtubeVideoId);
        const duration = videoDetails ? videoDetails.duration : 'PT0S';
        const durationInSeconds = parseInt(duration.replace('PT', '').replace('S', ''), 10);
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        return {
          ...video,
          duration: `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`,
        };
      })
    );

    return {
      playlistTitle,
      playlistDescription,
      youtubePlaylistId: playlistId,
      videos: videosWithDuration,
    };
  } catch (error) {
    console.error('Error fetching YouTube playlist details:', error.message);
    return null;
  }
};
