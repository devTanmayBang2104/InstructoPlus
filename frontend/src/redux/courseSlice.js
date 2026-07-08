import { createSlice } from "@reduxjs/toolkit";

const courseSlice = createSlice({
  name: "course",
  initialState: {
    creatorCourseData: [], // Initialize as an empty array
    courseData: null,
  },
  reducers: {
    setCreatorCourseData: (state, action) => {
      state.creatorCourseData = Array.isArray(action.payload) ? action.payload : [];
    },
    setCourseData: (state, action) => {
      state.courseData = action.payload;
    },
    setSelectedCourseData: (state, action) => {
      state.selectedCourseData = action.payload;
    },
  },
});

export const { setCreatorCourseData } = courseSlice.actions;
export const { setCourseData } = courseSlice.actions;
export const { setSelectedCourseData } = courseSlice.actions;
export default courseSlice.reducer;
