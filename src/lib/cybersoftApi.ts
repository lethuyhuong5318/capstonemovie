import axios from 'axios';

/**
 * Public CyberSoft bootcamp training API — shared sandbox used to demo a real
 * (non-mock) HTTP data source for the movie catalog. Not a private secret:
 * this token is the standard publicly-distributed classroom token.
 */
export const cybersoftApi = axios.create({
  baseURL: 'https://movienew.cybersoft.edu.vn/api/',
});

cybersoftApi.interceptors.request.use((config) => {
  config.headers.set(
    'TokenCybersoft',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5Mb3AiOiJCb290Y2FtcCA5NCIsIkhldEhhblN0cmluZyI6IjEzLzAxLzIwMjciLCJIZXRIYW5UaW1lIjoiMTc5OTc5ODQwMDAwMCIsIm5iZiI6MTc3MjY0MzYwMCwiZXhwIjoxNzk5OTQ2MDAwfQ.fXnFWdTzELVYga9S7pakEljJsvLiA3qz1XvvVCzlxkI',
  );
  return config;
});

export const CYBERSOFT_MA_NHOM = 'GP01';
