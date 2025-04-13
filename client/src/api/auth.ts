import api from "../utils/baseUrl";

export const authLogin = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    console.log(response,"responseresponseresponse");

    return response;
  } catch (error) {
    console.log(error,"ererererereerererererer");
    
    return error;
  }
};