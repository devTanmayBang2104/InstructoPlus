import axios from 'axios';
import { useEffect } from 'react'
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      const res = await axios.get(serverUrl + "/api/user/getcurrentuser", { withCredentials: true });
      dispatch(setUserData(res.data));
    } catch (error) {
      console.log("Error fetching user:", error);
      dispatch(setUserData(null));
    }
  };

  useEffect(() => {
    fetchUser();
  }, [dispatch]);

  return fetchUser; // Return the fetchUser function
};

export default useGetCurrentUser;
