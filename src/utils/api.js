import axios from 'axios';
import { getApiBaseUrl } from './platform';

const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true
});

export default api;
