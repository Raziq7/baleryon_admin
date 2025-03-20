import api from "../utils/baseUrl";

export const authLogin = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error('Login failed');
  }
};