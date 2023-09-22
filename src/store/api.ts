import axios from 'axios';

const instance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  baseURL: 'http://localhost:8000'
});

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    console.log(originalConfig, 'originalConfig')
    
    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && originalConfig.url === '/token/refresh/') {
        window.location.href = '/login'
        return;
      }
      if (err.response.status === 401 && originalConfig.url !== '/token/refresh/') {
        originalConfig._retry = true;
        try {
          let headers = {
            'Content-Type': 'application/json',
          };
          const rs = await instance.post(
            `/token/refresh/`,
            {
              refresh: getRefreshToken(),
            },
            {
              headers,
            },
          );
          localStorage.setItem('access_token', rs.data.access);
          localStorage.setItem('refresh_token', rs.data.refresh);
          return instance(originalConfig);
        } catch (_error) {
          window.location.href = '/login'
          return Promise.reject(_error);
        }
      }
    }
    return Promise.reject(err);
  },
);
export default instance;

export const getToken = () => {
  let token = localStorage.getItem('access_token');
  if (token) {
    return token;
  } else {
    return null;
  }
};

export const getRefreshToken = () => {
  let token = localStorage.getItem('refresh_token');
  if (token) {
    return token;
  } else {
    return null;
  }
};
