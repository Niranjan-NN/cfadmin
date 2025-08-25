import axios from 'axios';

const api = import.meta.env.VITE_API_URL;

const adminAxiosInstance = axios.create({
  baseURL: api,
  withCredentials: true,
});

adminAxiosInstance.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    // ✅ Handle both 401 (Unauthorized) & 403 (Forbidden)
    if (
      (err.response?.status === 401 || err.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // call refresh endpoint
        const response = await axios.post(`${api}/api/admin-refresh-token`, {}, {
          withCredentials: true,
        });

        const newToken = response.data.token;

        // save in localStorage
        localStorage.setItem("adminToken", newToken);

        // retry request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      // eslint-disable-next-line no-unused-vars
      } catch (refreshErr) {
        localStorage.removeItem("adminToken");
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);


export default adminAxiosInstance;
