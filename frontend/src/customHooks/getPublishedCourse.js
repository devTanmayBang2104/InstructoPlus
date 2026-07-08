import axios from 'axios';
import { serverUrl } from '../App.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { setCourseData } from '../redux/courseSlice.js';
import { useEffect } from 'react';
import React from 'react'

const getCouseData = () => {
  const dispatch = useDispatch()
  useEffect(()=>{
    const getPublishedCourse = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/course/getpublished" , {withCredentials:true})
        // console.log(result.data)
        dispatch(setCourseData(result.data.courses))

      } catch (error) {
        console.log(error)
      }
    }
    getPublishedCourse()
  },[])

}

export default getCouseData
