import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='#9ca3af' text-anchor='middle' dominant-baseline='middle'>Sem imagem</text></svg>"
  );

export const fileUrl = (path) => {
  if (!path) return PLACEHOLDER;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/")) return `${BACKEND_URL}${path}`;
  return `${API}/files/${path}`;
};

export const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
